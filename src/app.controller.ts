import { Body, Controller, Logger, Post } from '@nestjs/common';
import {
  BaseQueryParameters,
  GeoDistributionQueryDto,
} from './queryParameters.dtos';
import { IndexQueryService, QueryTemplate } from './app.service';

@Controller()
class BaseController {
  readonly logger = new Logger(BaseController.name);

  constructor(protected queryService: IndexQueryService) {}

  runQuery(
    parameters: BaseQueryParameters,
    queryTemplate: QueryTemplate,
  ) {
    this.logger.debug('Input is valid, running query');
    return this.queryService.runQuery(parameters, queryTemplate);
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
  ): Promise<any> {
    return super.runQuery(params, this.queryTemplate);
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
