// Copyright 2021-2022 Valletech AB authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BaseController } from '../lqs.controller';
import { AggregatedIndexData, IndexQueryService } from '../lqs.index.service';
import { RewardsByValidationGroup } from './query.responses.dtos';
import { RewardDistributionQueryDto } from './query.parameters.dtos';
import { plainToInstance } from 'class-transformer';

@ApiTags('validator')
@Controller()
export class ValidatorGroupController extends BaseController {
    constructor(protected queryService: IndexQueryService) {
        super(queryService);
    }

    @Post('validator/group')
    @ApiOperation({
        description: 'Get the distribution of DOT Rewards per Validator Group',
    })
    @ApiOkResponse({ description: 'The distribution of DOT Rewards per Validator Group', type: RewardsByValidationGroup, isArray: true })
    @HttpCode(HttpStatus.OK)
    async post(
        @Body() params: RewardDistributionQueryDto): Promise<Array<RewardsByValidationGroup>> {
        return (await super.runQuery(
            params,
            this.queryTemplate,
            this.queryResponseTransformer,
        )) as Array<RewardsByValidationGroup>;
    }

    queryResponseTransformer(indexResponse): Array<RewardsByValidationGroup> {
        const buckets = indexResponse.body.aggregations['polkawatch'].buckets as AggregatedIndexData;
        return plainToInstance(RewardsByValidationGroup, buckets, {
            excludeExtraneousValues: true,
        });
    }

    queryTemplate(params: RewardDistributionQueryDto) {
        return {
            aggs: {
                polkawatch: {
                    terms: {
                        field: 'validator_parent_name',
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

