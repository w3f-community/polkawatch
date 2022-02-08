import { Body, Controller, Logger, Post } from '@nestjs/common';
import {
  BaseQueryParameters,
  GeoDistributionQueryDto,
} from './queryParameters.dtos';
import { IndexQueryService } from './app.service';

export type ElasticQueryTemplate = any;

@Controller()
class BaseController {
  readonly logger = new Logger(BaseController.name);

  constructor(protected queryService: IndexQueryService) {}

  runQuery(
    parameters: BaseQueryParameters,
    queryTemplate: ElasticQueryTemplate,
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
    const queryTemplate =
      '{ "query" : { "match_all" : {} }, "stored_fields": [] }';
    this.logger.debug('POST /geo/region');
    return super.runQuery(params, queryTemplate);
  }
}
