import { Expose, Transform } from 'class-transformer';
import { ApiResponseProperty } from '@nestjs/swagger';


/**
 * All queries will have as a response either a record or an array of records
 */
export type QueryResponse = QueryResponseRecord | Array<QueryResponseRecord>;

/**
 * Here we list all possible Response Records we may get
 */
export type QueryResponseRecord = DotRewardsByRegion;

/**
 * Rewards by Region
 */

export class DotRewardsByRegion {

  @ApiResponseProperty()
  @Expose({ name: 'key' })
  Region: string;

  @ApiResponseProperty()
  @Transform(({ value }) => value.value, { toClassOnly: true })
  @Expose({ name: 'reward' })
  DotRewards: number;
}


