import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

/**
 * All possible query parameters.
 */
export type QueryParameters = GeoDistributionQueryDto;

export class GeoDistributionQueryDto {
  @IsOptional()
  @IsNumber()
  @ApiProperty({
    description: 'Limit the dataset by starting Era',
    minimum: 1,
    default: 0,
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
