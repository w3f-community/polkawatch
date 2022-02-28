// Copyright 2021-2022 Valletech AB authors & contributors
// SPDX-License-Identifier: Apache-2.0


import { Test, TestingModule } from '@nestjs/testing';
import { ElasticService } from './elastic.service';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';


describe('ElasticService', () => {
    let service: ElasticService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    validationSchema: Joi.object({
                        INDEXER_ELASTIC_PORT: Joi.number().default(9200),
                        INDEXER_ELASTIC_HOST: Joi.string().default('localhost'),
                    }),
                }),
            ],
            providers: [ElasticService, {
                provide: 'ELASTIC_API_CLIENT',
                useValue: {},
            }],
        }).compile();
        service = module.get<ElasticService>(ElasticService);
    });

    /**
     * We only test for right instantiation of the module.
     * Elastic only writes the reward to elasticsearch with is an external service.
     */
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
