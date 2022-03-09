import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import {Configuration, GeographyApi} from "@lqs/client";


// TODO: here we have to test the required features:
// - compression: responses are compressed and served from .gz urls
// - bundling: a single endpoint returns several calls
// - transformation: for charting libraries
// - dpp client for use from react
// - client can connect to dpp or IPFS holding same contents

@Controller()
export class AppController {

  private api;

  constructor(private readonly appService: AppService) {
  }

  @Get("test.gz")
  async getHello(): Promise<any> {

    const api=new GeographyApi(new Configuration({
      //TODO: how to make the cert work
      //basePath: "https://pwlqs.vtk.lan"
      basePath: "http://localhost:7000"
    }));

    let countries= await api.geoCountryControllerPost({
      rewardDistributionQueryDto:{
        StartingEra:510,
        TopResults:10
      }
    });

    return countries.data ;
    //return this.appService.getHello()
  }
}
