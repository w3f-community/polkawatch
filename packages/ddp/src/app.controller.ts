import { Controller, Get } from '@nestjs/common';
import {Configuration,
  GeographyApi,
  ValidatorApi,
  NetworkApi,
  RewardDistributionQueryDto
} from "@lqs/client";

import {RewardsByCountry, RewardsByRegion} from "@lqs/types";

import {ApiOkResponse, ApiOperation, ApiResponseProperty, ApiProperty} from "@nestjs/swagger";

// TODO: here we have to test the required features:
// - bundling: a single endpoint returns several calls OK
// - transformation: for charting libraries
// - dpp client for use from react
// - client can connect to dpp or IPFS holding same contents
// - compression: responses are compressed and served from .gz urls (OPTIONAL)

class GeoBundle {
  @ApiProperty({
    type: RewardsByCountry,
    isArray: true
  })
  countries: RewardsByCountry[]
  @ApiProperty({
    type: RewardsByRegion,
    isArray: true
  })
  regions: RewardsByRegion[]
}

@Controller()
export class AppController {

  private readonly conf;

  constructor() {
    this.conf=new Configuration({
      //TODO: how to make the cert work
      //basePath: "https://pwlqs.vtk.lan"
      basePath: "http://localhost:7000"
    });
  }

  @Get("test")
  @ApiOperation({
    description: 'Get the distribution of DOT Rewards per Country',
  })
  @ApiOkResponse({ description: 'The distribution of DOT Rewards per Country', type: RewardsByCountry, isArray: true })
  async getTest(): Promise<RewardsByCountry[]> {

    let api=new GeographyApi(this.conf);

    let countries= await api.geoCountryControllerPost({
      rewardDistributionQueryDto:{
        StartingEra:510,
        TopResults:10
      }
    });

    return countries.data ;
  }


  @Get("bundle")
  @ApiOperation({
    description: 'Get the distribution of DOT Rewards per Country',
  })
  @ApiOkResponse({ description: 'The distribution of DOT Rewards per Country', type: GeoBundle, isArray: false })
  async getBundle(): Promise<GeoBundle>{
    const api=new GeographyApi(this.conf);

    const params:RewardDistributionQueryDto = {
      StartingEra: 510,
      TopResults: 10
    };

    const regions = await api.geoRegionControllerPost({
      rewardDistributionQueryDto: params}
    );

    const countries = await api.geoCountryControllerPost({
      rewardDistributionQueryDto: params}
    );

    return {
      regions:regions.data,
      countries:countries.data,
    };
  }
}

