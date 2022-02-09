import { Expose, Transform } from 'class-transformer';
import { ApiAcceptedResponse } from '@nestjs/swagger';


/**
 * All quires will have as a response either a record all an array of records
 */
export type QueryResponse = QueryResponseRecord | Array<QueryResponseRecord>;

/**
 * Here we list all possible Response Records we may get
 */
export type QueryResponseRecord = DotRewardsByRegion;

/**
 * Rewards by Region
 */

@ApiAcceptedResponse()
export class DotRewardsByRegion {
  @Expose({ name: 'key' })
  Region: string;
  @Transform(({ value }) => value.value, { toClassOnly: true })
  @Expose({ name: 'reward' })
  DotRewards: string;
}
