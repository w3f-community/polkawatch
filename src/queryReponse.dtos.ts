import { Expose, Transform } from 'class-transformer';

export class BaseQueryResponse {}

export class DotRewardsByRegion extends BaseQueryResponse {
  @Expose({ name: 'key' })
  Region: string;
  @Transform(({ value }) => value.value, { toClassOnly: true })
  @Expose({ name: 'reward' })
  DotRewards: string;
}
