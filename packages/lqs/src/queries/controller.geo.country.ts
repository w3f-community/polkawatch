import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BaseController } from '../lqs.controller';
import {AggregatedIndexData, IndexQueryService, QueryTemplate} from '../lqs.index.service';
import { RewardsByCountry } from './query.responses.dtos';
import {QueryParameters, RewardDistributionQueryDto} from './query.parameters.dtos';
import { plainToInstance } from 'class-transformer';

@ApiTags('geography')
@Controller()
export class GeoCountryController extends BaseController {
    constructor(protected queryService: IndexQueryService) {
        super(queryService);
    }

    @Post('geo/country')
    @ApiOperation({
        description: 'Get the distribution of DOT Rewards per Country',
    })
    @ApiOkResponse({ description: 'The distribution of DOT Rewards per Country', type: RewardsByCountry, isArray: true })
    @HttpCode(HttpStatus.OK)
    async post(
        @Body() params: RewardDistributionQueryDto): Promise<Array<RewardsByCountry>> {
        return (await super.runQuery(
            params,
            this.queryTemplate as QueryTemplate,
            this.queryResponseTransformer,
        )) as Array<RewardsByCountry>;
    }

    queryResponseTransformer(indexResponse): Array<RewardsByCountry> {
        const buckets = indexResponse.body.aggregations['polkawatch'].buckets as AggregatedIndexData;
        return plainToInstance(RewardsByCountry, buckets, {
            excludeExtraneousValues: true,
        });
    }

    queryTemplate(params: RewardDistributionQueryDto) {
        return {
            aggs: {
                polkawatch: {
                    terms: {
                        field: 'validator_country_name',
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
