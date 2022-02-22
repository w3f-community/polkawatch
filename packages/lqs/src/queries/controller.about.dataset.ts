import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BaseController } from '../lqs.controller';
import { AggregatedIndexData, IndexQueryService } from '../lqs.index.service';
import { RewardsByRegion } from './query.responses.dtos';
import { RewardDistributionQueryDto } from './query.parameters.dtos';
import { plainToInstance } from 'class-transformer';

@ApiTags('about')
@Controller()
export class AboutDatasetController extends BaseController {
    constructor(protected queryService: IndexQueryService) {
        super(queryService);
    }

    @Post('about/dataset')
    @ApiOperation({
        description: 'Get information about the dataset',
    })
    @ApiOkResponse({ description: 'Returns information about the dataset', type: RewardsByRegion, isArray: true })
    @HttpCode(HttpStatus.OK)
    async post(
        @Body() params: RewardDistributionQueryDto): Promise<Array<RewardsByRegion>> {
        return (await super.runQuery(
            params,
            this.queryTemplate,
            this.queryResponseTransformer,
        )) as Array<RewardsByRegion>;
    }

    queryResponseTransformer(indexResponse): Array<RewardsByRegion> {
        const buckets = indexResponse.body.aggregations['polkawatch'].buckets as AggregatedIndexData;
        // TODO: query has a different structure, it is not a reward distribution query.
        return indexResponse;
        return plainToInstance(RewardsByRegion, buckets, {
            excludeExtraneousValues: true,
        });
    }

    queryTemplate(params: RewardDistributionQueryDto) {
        return {
            "aggs": {
                "0": {
                    "cardinality": {
                        "field": "era"
                    }
                },
                "1": {
                    "cardinality": {
                        "field": "reward"
                    }
                },
                "2": {
                    "sum": {
                        "script": {
                            "source": "doc['reward'].value/10000000000.0",
                            "lang": "painless"
                        }
                    }
                },
                "3": {
                    "max": {
                        "field": "era"
                    }
                }
            },
            "size": 0,
            "fields": [
                {
                    "field": "date",
                    "format": "date_time"
                }
            ],
            "script_fields": {
                "reward_dot": {
                    "script": {
                        "source": "doc['reward'].value/10000000000.0",
                        "lang": "painless"
                    }
                },
                "nomination_value_dot": {
                    "script": {
                        "source": "doc['nomination_value'].value/10000000000.0 ",
                        "lang": "painless"
                    }
                }
            },
            "stored_fields": [
                "*"
            ],
            "runtime_mappings": {},
            "_source": {
                "excludes": []
            },
            "query": {
                "bool": {
                    "must": [],
                    "filter": [
                        {
                            "range": {
                                "era": {
                                    "gte": 510,
                                }
                            }
                        }
                    ],
                    "should": [],
                    "must_not": []
                }
            }
        }
    }
}