// Copyright 2021-2022 Valletech AB authors & contributors
// SPDX-License-Identifier: Apache-2.0


import { CacheModule, Module } from '@nestjs/common';
import { ArchiveService } from './archive.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { IndexerSchedulerService } from './indexer.scheduler';
import { SubstrateHistoryService, SubstrateAPIService } from './substrate.history.service';
import { GeoliteService, GeoliteDBService } from './geolite.service';
import { ElasticService, ElasticApiClientService } from './elastic.service';

import * as Joi from 'joi';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: Joi.object({
                NODE_ENV: Joi.string()
                    .valid('development', 'production', 'test')
                    .default('development'),
                INDEXER_PORT: Joi.number().default(7100),
                INDEXER_ARCHIVE_HOST: Joi.string().default('localhost'),
                INDEXER_ARCHIVE_PORT: Joi.number().default(3000),
                INDEXER_SUBSTRATE_RPC_URL: Joi.string().default('wss://polkadot.valletech.eu'),
                INDEXER_ELASTIC_PORT: Joi.number().default(9200),
                INDEXER_ELASTIC_HOST: Joi.string().default('localhost'),
            }),
        }),
        ScheduleModule.forRoot(),
        CacheModule.register(),
    ],
    controllers: [],
    providers: [ArchiveService, IndexerSchedulerService, SubstrateAPIService, SubstrateHistoryService, GeoliteService, GeoliteDBService, ElasticService, ElasticApiClientService],
})
export class IndexerModule {}
