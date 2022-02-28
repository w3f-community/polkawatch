// Copyright 2021-2022 Valletech AB authors & contributors
// SPDX-License-Identifier: Apache-2.0


import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { gql, Client, createClient } from '@urql/core';
import { fetch } from 'cross-fetch';

/**
 * This Service access Polkawatch Archive GraphQL end point
 * through its query endpoints.
 *
 * Its main responsibility is to query all reward events in batches.
 *
 * Will also handle some edge cases in which heartbeats could not be
 * traced during the 1-pass archive process. The main reason is that
 * when you start mid-chain, there have been no heartbeats prior to the
 * very first rewards events. In those case Heartbeats are looked forward
 * and tagged as such.
 *
 */

@Injectable()
export class ArchiveService {
    private readonly logger = new Logger(ArchiveService.name);
    private readonly tracing = false;

    // We will not cache the main reward processing query
    private readonly client: Client;

    // We will cache queries to handle missing traces
    private readonly cachedClient: Client;

    constructor(private configService: ConfigService) {
        const host = configService.get('INDEXER_ARCHIVE_HOST');
        const port = configService.get('INDEXER_ARCHIVE_PORT');
        this.client = createClient({
            url: `http://${host}:${port}/graphql`,
            fetch: fetch,
            requestPolicy: 'network-only',
        });

        this.cachedClient = createClient({
            url: `http://${host}:${port}/graphql`,
            fetch: fetch,
            requestPolicy: 'cache-first',
        });
    }

    async query(query, params): Promise<any> {
        return this.client.query(query, params).toPromise();
    }

    /**
     * We want to select which queries we cache, as we know that queries that target the "edge" of the blockchain
     * are changing all the time, while queries that target older blocks are efficient and safe to cache.
     * @param query
     * @param params
     */
    async cachedQuery(query, params): Promise<any> {
        return this.cachedClient.query(query, params).toPromise();
    }

    async queryRewards(params): Promise<any> {
        return this.query(REWARDS_QUERY, params);
    }

    /**
   *
   * When the reward record has no heartbeat information we will get it falling
   * back to peer-id resolution.
   *
   * We will use the validator ID to find out the peers that run that validator
   * and we will return the last heartbeat received form any of the peers.
   *
   * Will also handle the case in which heartbeats were not found at all.
   * Data is tagged accordingly in all cases.
   *
   * @param reward
   */
    async traceLastHeartbeat(reward): Promise<any> {
        let trace = 'session';

        if (!reward.previousHeartbeat) {
            // A Heartbeat event was not traced during archive. We resort to finding the closest heartbeat
            // from any libp2p peer associated with the validator.
            const peers = await this.getPeersByValidatorId(reward.validator.id);

            if (peers) {
                trace = 'peer_prev';
                // Ideally we want the heartbeats that came just before the rewards event.
                let lhb = await this.getLastHeartbeatsByPeers(reward.blockNumber, peers);
                if (!lhb.length) {
                    trace = 'peer_post';
                    // If we could not find any HB before the reward event, we take the first we ever received from
                    // Any of those peers.
                    lhb = await this.getFirstHeartbeatsByPeers(peers);
                }

                if (!lhb.length) trace = 'missing';
                else reward.previousHeartbeat = lhb[0];
            }
        }

        // We put on the dataset which tracing we used to resolve this relationship
        // Later on we could analyse the quality of this "trace", with an analysis of rewards distribution by
        // Heartbeat trace.
        reward.previousHeartbeatTrace = trace;

        if (this.tracing) {
            this.logger.debug(
                `Reward ${reward.id} by validator ${reward.validator.id} traced to Heartbeat by ${trace}.`,
            );
        }
        return reward;
    }

    /**
     * Returns the libp2p peers associated with a validator ID. Those are traced from heartbeat events after the
     * validator is resolved using the authority id.
     * @param validatorId
     */
    async getPeersByValidatorId(validatorId): Promise<Array<any>> {
        return this.cachedQuery(PEERS_BY_VALIDATOR_ID_QUERY, {
            validatorId: validatorId,
        }).then((results) => results.data.peers.nodes.map((peer) => peer.id));
    }

    /**
     * Returns the last hearbeat received from a group of peers before a given block number.
     * @param blockNumberLimit
     * @param peers
     */
    async getLastHeartbeatsByPeers(
        blockNumberLimit,
        peers: Array<string>,
    ): Promise<Array<any>> {
        return this.cachedQuery(LAST_HEARTBEAT_BY_PEERS_QUERY, {
            blockNumberLimit: blockNumberLimit,
            peers: peers,
        }).then((results) => results.data.heartbeats.nodes);
    }

    /**
     * Returns the first heartbeat ever received from a group of peers.
     * @param peers
     */
    async getFirstHeartbeatsByPeers(peers: Array<string>): Promise<Array<any>> {
        return this.cachedQuery(FIRST_HEARTBEAT_BY_PEERS_QUERY, {
            peers: peers,
        }).then((results) => results.data.heartbeats.nodes);
    }
}

// The actual GraphQL queries associates with the methods above follow:

const REWARDS_QUERY = gql`
  query ($batchSize: Int!, $cursor: Cursor, $startBlockNumber: BigFloat) {
    rewards(
      first: $batchSize, 
      after: $cursor
      filter: {
        blockNumber: { greaterThan: $startBlockNumber }
      }
    ) {
      edges {
        cursor
        node {
          id
          timeStamp
          era
          blockNumber
          newReward
          nominator
          validator {
            id
            lastPeerId
          }
          payout {
            id
          }
          previousHeartbeat {
            id
            externalAddresses
          }
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

const LAST_HEARTBEAT_BY_PEERS_QUERY = gql`
  query ($blockNumberLimit: BigFloat!, $peers: [String!]) {
    heartbeats(
      last: 1
      filter: {
        blockNumber: { lessThan: $blockNumberLimit }
        peerId: { in: $peers }
      }
    ) {
      nodes {
        id
        peerId
        externalAddresses
      }
    }
  }
`;

const FIRST_HEARTBEAT_BY_PEERS_QUERY = gql`
  query ($peers: [String!]) {
    heartbeats(first: 1, filter: { peerId: { in: $peers } }) {
      nodes {
        id
        peerId
        externalAddresses
      }
    }
  }
`;

const PEERS_BY_VALIDATOR_ID_QUERY = gql`
  query ($validatorId: String!) {
    peers(filter: { validatorId: { equalTo: $validatorId } }) {
      nodes {
        id
        validatorId
      }
    }
  }
`;
