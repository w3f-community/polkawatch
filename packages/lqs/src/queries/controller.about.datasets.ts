import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BaseController } from '../lqs.controller';
import { AggregatedIndexData, IndexQueryService } from '../lqs.index.service';
import {AboutData, RewardsByRegion} from './query.responses.dtos';
import {AboutDataQueryDto, QueryParameters, RewardDistributionQueryDto} from './query.parameters.dtos';
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
    @ApiOkResponse({ description: 'Returns information about the dataset', type: AboutData, isArray: false })
    @HttpCode(HttpStatus.OK)
    async post(
        @Body() params: AboutDataQueryDto): Promise<AboutData> {
        return (await super.runQuery(
            params,
            this.queryTemplate as (p: QueryParameters) => any,
            this.queryResponseTransformer,
        )) as AboutData;
    }

    queryResponseTransformer(indexResponse): AboutData {
        const aggs = indexResponse.body.aggregations;
        return plainToInstance(AboutData, aggs, {
            excludeExtraneousValues: true,
        });
    }

    queryTemplate(params: AboutDataQueryDto) {
        return {
            'aggs': {
                'total_eras': {
                    'cardinality': {
                        'field': 'era',
                    },
                },
                'total_rewards': {
                    'cardinality': {
                        'field': 'reward',
                    },
                },
                'total_rewards_dot': {
                    'sum': {
                        'script': {
                            'source': 'doc[\'reward\'].value/10000000000.0',
                            'lang': 'painless',
                        },
                    },
                },
                'latest_era': {
                    'max': {
                        'field': 'era',
                    },
                },
            },
            'size': 0,
            'fields': [
                {
                    'field': 'date',
                    'format': 'date_time',
                },
            ],
            'script_fields': {
                'reward_dot': {
                    'script': {
                        'source': 'doc[\'reward\'].value/10000000000.0',
                        'lang': 'painless',
                    },
                },
                'nomination_value_dot': {
                    'script': {
                        'source': 'doc[\'nomination_value\'].value/10000000000.0 ',
                        'lang': 'painless',
                    },
                },
            },
            'stored_fields': [
                '*',
            ],
            'runtime_mappings': {},
            '_source': {
                'excludes': [],
            },
            'query': {
                'bool': {
                    'must': [],
                    'filter': [
                        {
                            'range': {
                                'era': {
                                    'gte': params.StartingEra,
                                },
                            },
                        },
                    ],
                    'should': [],
                    'must_not': [],
                },
            },
        };
    }
}