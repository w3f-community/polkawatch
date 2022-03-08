import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Configuration, GeographyApi, RewardDistributionQueryDto } from './lqs-client';
import globalAxios from 'axios';

const openapiConfig = new Configuration();
openapiConfig.baseOptions = {
  basePath: 'http://localhost:7000',
  proxy: {
    protocol: 'http',
    host: '127.0.0.1',
    port: 7000,
  },
  // headers: { Authorization: 'Bearer ' + cookies.access_token },
};
const geoApi = new GeographyApi(openapiConfig);

const inputParams: RewardDistributionQueryDto = {
  StartingEra: 510,
  TopResults: 10,
};

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello(): Promise<any> {
    try {
      console.log(await geoApi.geoRegionControllerPost(inputParams));
      const res = await geoApi.geoRegionControllerPost(inputParams);
      return res.data;
    } catch (e) {
      console.log(e);
      return e;
    }
  }
}
