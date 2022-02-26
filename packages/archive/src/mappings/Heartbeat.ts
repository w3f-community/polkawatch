// Copyright 2021-2022 Valletech AB authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { decodeAddress, encodeAddress } from '@polkadot/keyring';
import { isHex, u8aToHex } from'@polkadot/util';

import { SubstrateEvent } from '@subql/types';

import { Heartbeat as SubstrateHeartbeat } from '@polkadot/types/interfaces/imOnline';

import { Heartbeat, Peer, Validator } from '../types';

export async function handleHeartbeat(event: SubstrateEvent): Promise<void> {
    const blockNum = event.block.block.header.number.toBigInt();
    const eventId = `${blockNum}-${event.idx}`;
    const heartbeat = new Heartbeat(
        eventId,
    );

    const shb = event.extrinsic.extrinsic.method.args[0] as SubstrateHeartbeat;

    heartbeat.blockNumber = blockNum;
    heartbeat.authorityId = event.event.data[0].toString();
    heartbeat.peerId = shb.networkState.peerId.toHex();
    heartbeat.externalAddresses = JSON.stringify(shb.networkState.externalAddresses.toHuman());
    await heartbeat.save();

    /**
     * Here we are going to try to identify who is behind a heartbeat, this is easy to findout
     * at the top of the chain because session keys are recent. Old hertbeats may have been issued
     * with old session keys and finding out who is behind it would be complex, however, we assume that
     * the relation peerId to validatorId is more durable.
     */
    let peer = await Peer.get(heartbeat.peerId);
    if(!peer) {
        // We don't yet know the validator associated to this peerId
        const keyOwner = await substrateKeyOwner(api, heartbeat.authorityId);
        if(keyOwner) {
            const validator = await getValidator(keyOwner);
            validator.lastHeartbeatId = heartbeat.id;

            peer = new Peer(heartbeat.peerId);
            peer.validatorId = validator.id;
            validator.lastPeerId = peer.id;

            await validator.save();
            await peer.save();

            logger.info(`Peer ${heartbeat.peerId} is Validator ${validator.id}`);
            // We will also store the validator with the heartbeat when known
            // PeerId matching will therefore be backup for identifying validators whose session keys where
            // expired at indexing time.
            heartbeat.validatorId = validator.id;
            await heartbeat.save();
        } else {logger.info(`AuthorityId ${heartbeat.authorityId} could not be resolved`);}
    }

    logger.info('Heartbeat: ' + eventId);
}

/**
 * Attempts to deduct the validator by authorityId which seems related to session keys.
 * This information is not always available, as session keys change over time.
 *
 * @param api
 * @param key
 * @param network
 * @param keyType
 */
export async function substrateKeyOwner(api, key, network = 0, keyType = '0x696d6f6e') {
    if(!isHex(key)) key = u8aToHex(decodeAddress(key));
    const owner = await api.query.session.keyOwner([keyType, key]);
    if(!owner.isEmpty && owner !== '') return encodeAddress(owner.toHex(), network);
}

/**
 * Returns or Creates a new Validator
 */

export async function getValidator(id) {
    let v = await Validator.get(id);
    v = new Validator(id);
    return v;
}
