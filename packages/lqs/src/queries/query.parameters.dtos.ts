// Copyright 2021-2022 Valletech AB authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

/**
 * All possible query parameters.
 */
export type QueryParameters = RewardDistributionQueryDto | AboutDataQueryDto;


/**
 * Query parameters for reward distribution queries
 */
export class RewardDistributionQueryDto {
  @IsOptional()
  @IsNumber()
  @ApiProperty({
      description: 'Limit the dataset by starting Era',
      minimum: 1,
      default: 0,
      example: 510,
      required: false,
  })
      StartingEra: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty({
      description: 'Return only the Top N Results',
      minimum: 1,
      default: 10,
      required: false,
  })
      TopResults: number;
}

export class AboutDataQueryDto extends PickType(RewardDistributionQueryDto, ['StartingEra'] as const) {}
