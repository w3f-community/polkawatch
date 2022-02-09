import { Body, Controller, Logger, Post } from '@nestjs/common';
import {
  BaseQueryParameters,
  GeoDistributionQueryDto,
} from './queryParameters.dtos';
import {
  IndexQueryService,
  QueryResponseTransformer,
  QueryTemplate,
} from './app.service';
import { DotRewardsByRegion } from './queryReponse.dtos';

import { plainToInstance } from 'class-transformer';

@Controller()
class BaseController {
  readonly logger = new Logger(BaseController.name);

  constructor(protected queryService: IndexQueryService) {}

  runQuery(
    parameters: BaseQueryParameters,
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
  async post(
    @Body()
    params: GeoDistributionQueryDto,
  ): Promise<Array<DotRewardsByRegion>> {
    return super.runQuery(
      params,
      this.queryTemplate,
      this.queryResponseTransformer,
    ) as Promise<Array<DotRewardsByRegion>>;
  }

  queryResponseTransformer(rawResponse): Array<DotRewardsByRegion> {

    let buckets=rawResponse.body.aggregations['polkawatch'].buckets as Array<any>;

    return plainToInstance(
      DotRewardsByRegion,
      buckets,
      {
        excludeExtraneousValues: true
      }
    );
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
            size: 10,
          },
          aggs: {
            reward: {
              sum: {
                script: {
                  source: "doc['reward'].value/10000000000.0\n",
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
          filter: { range: { era: { gte: params.StartingEra } } },
        },
      },
    };
  }
}
