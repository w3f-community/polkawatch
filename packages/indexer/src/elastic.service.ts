// Copyright 2021-2022 Valletech AB authors & contributors
// SPDX-License-Identifier: Apache-2.0


import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const { Client } = require('@elastic/elasticsearch');

@Injectable()
export class ElasticService {
    private readonly logger = new Logger(ElasticService.name);
    private readonly tracing = false;

    constructor(private readonly configService:ConfigService, @Inject('ELASTIC_API_CLIENT') private client) {
        // empty
    }

    async persistReward(reward):Promise<any> {
        if(this.tracing) this.logger.debug(`Indexing reward ${reward.id}`);

        await this.client.update({
            index: 'pw_reward',
            id: reward.id,
            body: {
                doc: {
                    date: new Date(parseInt(reward.timeStamp)),
                    era: reward.era,
                    reward: reward.newReward,
                    reward_commission: reward.comission,
                    reward_type: reward.rewardType,

                    nominator: reward.nominator,
                    nomination_value: reward.nominationExposure,

                    validator: reward.validator.id,
                    validator_type: reward.validatorType,

                    traced_heartbeat_id: reward.previousHeartbeat ? reward.previousHeartbeat.id : 'NOT_TRACED',
                    traced_heartbeat_type: reward.previousHeartbeatTrace,
                    traced_payout_id: reward.payout ? reward.payout.id : 'NOT_TRACED',

                    validator_parent: reward.validator.info.parentId,
                    validator_name: reward.validator.info.display.name,
                    validator_parent_name: reward.validator.info.display.groupName,
                    validator_parent_web: reward.validator.info.display.groupWeb,
                    validator_parent_legal: reward.validator.info.display.groupLegal,
                    validator_parent_riot: reward.validator.info.display.groupRiot,

                    validator_country_group_code: reward.geo_country_display.group_code,
                    validator_country_group_name: reward.geo_country_display.group_name,
                    validator_country_code: reward.geo_country_display.country_code,
                    validator_country_name: reward.geo_country_display.country_name,
                    validator_asn_code: reward.geo_asn_display.asn_code,
                    validator_asn_name: reward.geo_asn_display.asn_name,
                    validator_asn_group_name: reward.geo_asn_display.asn_group_name,
                    validator_asn_group_code: reward.geo_asn_display.asn_group_code,
                },
                doc_as_upsert: true,
            },
        });
        return reward;
    }

    async onModuleDestroy() {
        this.logger.log('Closing API client down...');
        await this.client.close();
    }
}

export const ElasticApiClientService = {
    provide: 'ELASTIC_API_CLIENT',
    useFactory: async (configService: ConfigService) => {
        const logger = new Logger('ELASTIC_API_CLIENT');
        logger.log('Connecting to Elastic Search');
        const elasticHost = configService.get('INDEXER_ELASTIC_HOST');
        const elasticPort = configService.get('INDEXER_ELASTIC_PORT');
        const client = new Client({
            node: `http://${elasticHost}:${elasticPort}`,
        });

        const exists = await client.indices.exists({ index: 'pw_reward' });
        if(!exists) {
            logger.log('Creating reward index');
            await client.indices.create({
                index: 'pw_reward',
                body: {
                    mappings: {
                        properties: REWARD_PROPERTIES,
                    },
                },
            });
        }

        return client;
    },
    inject: [ConfigService],
};

const REWARD_PROPERTIES = {

    date: { type: 'date' },
    era: { type: 'long' },
    nominator:  { type: 'keyword' },

    reward: { type: 'long' },
    reward_type: { type: 'keyword' },
    reward_commission: { type: 'float' },
    nomination_value: { type: 'long' },

    validator: { type: 'keyword' },
    validator_name: { type: 'keyword' },
    validator_type: { type: 'keyword' },

    // orphan validators will be their own parent (1 validator group)
    validator_parent: { type: 'keyword' },
    validator_parent_name: { type: 'keyword' },
    validator_parent_web: { type: 'keyword' },
    validator_parent_email: { type: 'keyword' },
    validator_parent_legal: { type: 'keyword' },
    validator_parent_riot: { type: 'keyword' },

    validator_country_group_code: { type: 'keyword' },
    validator_country_group_name: { type: 'keyword' },
    validator_country_code: { type: 'keyword' },
    validator_country_name: { type: 'keyword' },
    validator_asn_code: { type: 'keyword' },
    validator_asn_name: { type: 'keyword' },
    validator_asn_group_name: { type: 'keyword' },
    validator_asn_group_code: { type: 'keyword' },

    // traceability, on-chain events related to this reward
    traced_heartbeat_id: { type: 'keyword' },
    traced_heartbeat_type: { type: 'keyword' },
    traced_payout_id: { type: 'keyword' },
};
