import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { ApiPromise, WsProvider } from '@polkadot/api';

import { ConfigService } from '@nestjs/config';

import LRU from "lru-cache";


/**
 * The Substrate History service uses RPC calls over History Depth to
 * extract some available information otherwise very difficult to deduce
 * from chain data.
 *
 * Essentially we are treating HistoryDepth queries as an "external" datasource
 * to merge data from.
 *
 * It might be possible to migrate some of this data to pass-1 later on.
 *
 */

@Injectable()
export class SubstrateHistoryService {

    private readonly tracing = true;
    private readonly logger = new Logger(SubstrateHistoryService.name);

    private exposureCache;

    constructor(@Inject('SUBSTRATE_API') private api, private configService: ConfigService) {
        // We consider 10 eras being claimed by 200 validators
        this.exposureCache=new LRU({max:2000});
    }

    /**
     * pass-2 indexing will start at history-depth.
     * external databases are known to contain "live data", for example geo data is constantly
     * amended, and must be updated daily as per license agreements.
     *
     * Substrate staking data is also "live" due to the fact that rewards can be claimed after a
     * certain time period, since data may be presented per era, the claiming process represent
     * "live" data too.
     *
     * history depth is considered a generous time period for live data to settle, and 2-pass
     * indexing should re-index from history depth every day.
     *
     */
    async historyDepthStartBlock():Promise<number> {
        const historyDepth = await this.api.query.staking.historyDepth();
        const epochDuration = await this.api.consts.babe.epochDuration.toNumber();
        const sessionsPerEra = await this.api.consts.staking.sessionsPerEra.toNumber();
        const blocksPerEra = sessionsPerEra * epochDuration;
        const historyBlocks = blocksPerEra * historyDepth;
        const currentBlockNumber = await this.api.query.system.number();
        const startBlock = currentBlockNumber - historyBlocks;
        this.logger.log(`History Depth starts at block: ${startBlock}`);
        return startBlock;
    }

    /**
     * We will validate that a nominator was actually staking with a validator for a given era
     * we will also get the exposure it had to the validator
     */

    async addEraExposure(reward):Promise<any>{
        const validatorId=reward.validator.id;
        let era=reward.era;
        const exposureByStaker = await this.getCachedExposureByStaker(era,validatorId);
        let exposure = exposureByStaker[reward.nominator];
        if(!exposure) this.logger.warn(`No EXPOSURE traced in ${reward.id}`);
        reward.nominationExposure = exposureByStaker[reward.nominator];
        if(reward.validator.id === reward.nominator) {
            reward.rewardType = "comission"
        }
        else reward.rewardType = "staking";
        return reward;
    }

    async getCachedExposureByStaker(era, validatorId):Promise<any> {
        const cacheKey=`exposure-${validatorId}-${era}`;
        
        if (this.exposureCache.has(cacheKey)) return this.exposureCache.get(cacheKey);
        else {
            let valuePromise = this.getExposureByStaker(era,validatorId);
            this.exposureCache.set(cacheKey,valuePromise);
            return valuePromise;
        }
    }

    async getExposureByStaker(era, validatorId):Promise<any>{
        if (this.tracing) this.logger.debug(`Requesting eraStakers for ${validatorId} era ${era}`);
        return this.api.query.staking.erasStakers(era,validatorId)
            .then(result => {
                let r={}
                r[validatorId]=result.own.toBigInt().toString();
                result.others.forEach(exposure => r[exposure.who]=exposure.value.toBigInt().toString());
                return r;
            });
    }

}

export const SubstrateAPIService = {
    provide: 'SUBSTRATE_API',
    useFactory: async (configService: ConfigService) => {
        const endpoint = configService.get('INDEXER_SUBSTRATE_RPC_URL');
        const logger = new Logger('SUBSTRATE_API');
        const wsProvider = new WsProvider(endpoint);
        const api = await ApiPromise.create({ provider: wsProvider });
        await api.isReady;
        logger.log(`Substrate API Ready with endpoint: ${endpoint}`);
        return api;
    },
    inject: [ConfigService],
};