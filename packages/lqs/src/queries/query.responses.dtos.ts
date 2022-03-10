// Copyright 2021-2022 Valletech AB authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Expose, Transform } from 'class-transformer';
import { ApiResponseProperty } from '@nestjs/swagger';

/**
 * All queries will have as a response either a record or an array of records
 */
export type QueryResponse = QueryResponseRecord | Array<QueryResponseRecord>;

/**
 * Here we list all possible Response Records we may get
 */
export type QueryResponseRecord = RewardsByRegion | RewardsByCountry | RewardsByNetworkProvider | RewardsByValidationGroup | AboutData;

/**
 * About Data
 */

export class AboutData {
    @ApiResponseProperty()
    @Transform(({ value }) => value.value, { toClassOnly: true })
    @Expose({ name: 'total_eras' })
        TotalEras: number;

    @ApiResponseProperty()
    @Transform(({ value }) => value.value, { toClassOnly: true })
    @Expose({ name: 'total_rewards' })
        TotalRewards: number;

    @ApiResponseProperty()
    @Transform(({ value }) => value.value, { toClassOnly: true })
    @Expose({ name: 'total_rewards_dot' })
        TotalRewardsDot: number;

    @ApiResponseProperty()
    @Transform(({ value }) => value.value, { toClassOnly: true })
    @Expose({ name: 'latest_era' })
        LastestEra: number;
}

/**
 * Rewards by Region
 */

export class RewardsByRegion {
  @ApiResponseProperty()
  @Expose({ name: 'key' })
      Region: string;

  @ApiResponseProperty()
  @Transform(({ value }) => value.value, { toClassOnly: true })
  @Expose({ name: 'reward' })
      DotRewards: number;
}

/**
 * Rewards by Country
 */

export class RewardsByCountry {
    @ApiResponseProperty()
    @Expose({ name: 'key' })
        Country: string;

    @ApiResponseProperty()
    @Transform(({ value }) => value.value, { toClassOnly: true })
    @Expose({ name: 'reward' })
        DotRewards: number;
}

/**
 * Rewards by Computing Network Provider
 */

export class RewardsByNetworkProvider {
    @ApiResponseProperty()
    @Expose({ name: 'key' })
        NetworkProvider: string;

    @ApiResponseProperty()
    @Transform(({ value }) => value.value, { toClassOnly: true })
    @Expose({ name: 'reward' })
        DotRewards: number;

}

/**
 * Rewards by Validator Group
 */

export class RewardsByValidationGroup {
    @ApiResponseProperty()
    @Expose({ name: 'key' })
        ValidationGroup: string;

    @ApiResponseProperty()
    @Transform(({ value }) => value.value, { toClassOnly: true })
    @Expose({ name: 'reward' })
        DotRewards: number;

    @ApiResponseProperty()
    @Transform(({ value }) => value.values['50.0'], { toClassOnly: true })
    @Expose({ name: 'median_nomination' })
        DotMedianNomination: number;

    @ApiResponseProperty()
    @Transform(({ value }) => value.value, { toClassOnly: true })
    @Expose({ name: 'validators_in_group' })
        ValidatorsInGroup: number;

}