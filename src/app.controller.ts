import { Body, Controller, Logger, Post } from '@nestjs/common';
import {
  BaseQueryParameters,
  GeoDistributionQueryDto,
} from './queryParameters.dtos';
import { IndexQueryService } from './app.service';

@Controller()
class BaseController {
  readonly logger = new Logger(BaseController.name);

  constructor(protected queryService: IndexQueryService) {}

  runQuery(parameters: BaseQueryParameters) {
    this.logger.debug('Input is valid, running query');
    return this.queryService.runQuery(parameters);
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
    this.logger.debug('POST /geo/region');
    return super.runQuery(params);
  }
}
