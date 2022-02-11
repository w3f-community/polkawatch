import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BaseController } from '../lqs.controller';
import { AggregatedIndexData, IndexQueryService } from '../lqs.index.service';
import { DotRewardsByRegion } from './query.responses.dtos';
import { GeoDistributionQueryDto } from './query.parameters.dtos';
import { plainToInstance } from 'class-transformer';

@ApiTags('geography')
@Controller()
export class GeoRegionController extends BaseController {
    constructor(protected queryService: IndexQueryService) {
        super(queryService);
    }

    @Post('geo/region')
    @ApiOperation({
        description: 'Get the distribution of DOT Rewards per Region',
    })
    @ApiOkResponse({ description: 'The distribution of DOT Rewards per Region', type: DotRewardsByRegion, isArray: true })
    async post(
        @Body() params: GeoDistributionQueryDto): Promise<Array<DotRewardsByRegion>> {
        return (await super.runQuery(
            params,
            this.queryTemplate,
            this.queryResponseTransformer,
        )) as Array<DotRewardsByRegion>;
    }

    queryResponseTransformer(indexResponse): Array<DotRewardsByRegion> {
        const buckets = indexResponse.body.aggregations['polkawatch'].buckets as AggregatedIndexData;
        return plainToInstance(DotRewardsByRegion, buckets, {
            excludeExtraneousValues: true,
        });
    }

    queryTemplate(params: GeoDistributionQueryDto) {
        return {
            aggs: {
                polkawatch: {
                    terms: {
                        field: 'validator_country_group_name',
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
