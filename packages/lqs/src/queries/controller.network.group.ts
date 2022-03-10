// Copyright 2021-2022 Valletech AB authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BaseController } from '../lqs.controller';
import { AggregatedIndexData, IndexQueryService, QueryTemplate } from '../lqs.index.service';
import { RewardsByNetworkProvider } from './query.responses.dtos';
import { RewardDistributionQueryDto } from './query.parameters.dtos';
import { plainToInstance } from 'class-transformer';

@ApiTags('network')
@Controller()
export class NetworkProviderController extends BaseController {
    constructor(protected queryService: IndexQueryService) {
        super(queryService);
    }

    @Post('network/group')
    @ApiOperation({
        description: 'Get the distribution of DOT Rewards per Computing Network Provider',
    })
    @ApiOkResponse({ description: 'The distribution of DOT Rewards per Computing Network Provider', type: RewardsByNetworkProvider, isArray: true })
    @HttpCode(HttpStatus.OK)
    async post(
        @Body() params: RewardDistributionQueryDto): Promise<Array<RewardsByNetworkProvider>> {
        return (await super.runQuery(
            params,
            this.queryTemplate as QueryTemplate,
            this.queryResponseTransformer,
        )) as Array<RewardsByNetworkProvider>;
    }

    queryResponseTransformer(indexResponse): Array<RewardsByNetworkProvider> {
        const buckets = indexResponse.body.aggregations['polkawatch'].buckets as AggregatedIndexData;
        return plainToInstance(RewardsByNetworkProvider, buckets, {
            excludeExtraneousValues: true,
        });
    }

    queryTemplate(params: RewardDistributionQueryDto) {
        return {
            aggs: {
                polkawatch: {
                    terms: {
                        field: 'validator_asn_group_name',
                        order: {
                            reward: 'desc',
                        },
                        size: params.TopResults,
                    },
                    aggs: {
                        reward: {
                            sum: {
                                script: {
                                    source: 'doc[\'reward\'].value/10000000000.0',
                                    lang: 'painless',
                                },
                            },
                        },
                    },
                },
            },
            size: 0,
            query: {
                bool: {
                    filter: {
                        range: {
                            era: {
                                gte: params.StartingEra,
                            },
                        },
                    },
                },
            },
        };
    }

}

