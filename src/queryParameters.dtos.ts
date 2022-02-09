import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BaseQueryParameters {}

export class GeoDistributionQueryDto extends BaseQueryParameters {
  @ApiProperty({ description: 'this is a endpoint' })
  @IsInt()
  StartingEra: number;
}
