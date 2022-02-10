import { Body, Controller, Logger, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import {
  QueryParameters,
  GeoDistributionQueryDto,
} from './queryParameters.dtos';
import {
  IndexQueryService,
  QueryResponseTransformer,
  QueryTemplate,
} from './app.service';
import { DotRewardsByRegion } from './queryReponse.dtos';
import { plainToInstance } from 'class-transformer';
import { ApiResponse } from '@elastic/elasticsearch';
import {
  AggregationsFiltersAggregate,
  AggregationsTermsAggregateBase,
} from '@elastic/elasticsearch/api/types';

interface ApiResponseFilterAggregate extends ApiResponse {
  body: {
    aggregations: Record<
      string,
      AggregationsTermsAggregateBase<AggregationsFiltersAggregate>
    >;
  };
}

@Controller()
class BaseController {
  readonly logger = new Logger(BaseController.name);

  constructor(protected queryService: IndexQueryService) {}

  runQuery(
    parameters: QueryParameters,
    queryTemplate: QueryTemplate,
    queryResponseTransformer: QueryResponseTransformer,
  ) {
    this.logger.debug('Input is valid, running query');
    return this.queryService.runQuery(
      parameters,
      queryTemplate,
      queryResponseTransformer,
    );
  }
}

@Controller()
export class GeoRegionController extends BaseController {
  constructor(protected queryService: IndexQueryService) {
    super(queryService);
  }

  @Post('geo/region')
  @ApiOperation({
    description: 'Get the distribution of DOT Rewards per Region',
  })
  @ApiOkResponse({
    description: 'The distribution of DOT Rewards per Region',
    type: DotRewardsByRegion,
    isArray: true,
  })
  async post(
    @Body()
    params: GeoDistributionQueryDto,
  ): Promise<Array<DotRewardsByRegion>> {
    return (await super.runQuery(
      params,
      this.queryTemplate,
      this.queryResponseTransformer,
    )) as Array<DotRewardsByRegion>;
  }

  queryResponseTransformer(
    rawResponse: ApiResponseFilterAggregate,
  ): Array<DotRewardsByRegion> {
    const buckets = rawResponse.body.aggregations['polkawatch']
      .buckets as AggregationsFiltersAggregate[];
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
                  source: "doc['reward'].value/10000000000.0",
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
