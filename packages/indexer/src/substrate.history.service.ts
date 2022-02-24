import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { Multiaddr } from 'multiaddr';
import is_private_ip from 'private-ip';
import LRU from 'lru-cache';
import { isHex, hexToU8a, u8aToString } from '@polkadot/util';
import { AccountId } from '@polkadot/types/interfaces';


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

    private readonly tracing = false;
    private readonly logger = new Logger(SubstrateHistoryService.name);

    private exposureCache;
    private prefsCache;
    private validatorInfoCache;

    constructor(@Inject('SUBSTRATE_API') private api, private configService: ConfigService) {
        // We consider 10 eras being claimed by 300 validators
        this.exposureCache = new LRU({ max:3000 });
        this.prefsCache = new LRU({ max:3000 });
        this.validatorInfoCache = new LRU({ max:300 });
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

    async processReward(reward): Promise<any> {
        reward = await this.addEraExposure(reward);
        reward = await this.addPublicIPAddresses(reward);
        reward = await this.addValidatorInfo(reward);
        return reward;
    }

    /**
     *
     * This method will add additional information to the reward event that could not be traced
     * at chain archive time.
     *
     * This also allows us to validate the indexed data versus history-depth queries.
     *
     */

    async addEraExposure(reward):Promise<any> {
        const validatorId = reward.validator.id;
        const era = reward.era;
        const exposureByStaker = await this.getCachedExposureByStaker(era, validatorId);
        const validatorPrefs = await this.getCachedValidatorPrefs(era, validatorId);
        const exposure = exposureByStaker[reward.nominator];
        if(!exposure) this.logger.warn(`No EXPOSURE traced in ${reward.id}`);
        reward.nominationExposure = exposureByStaker[reward.nominator];
        reward.comission = validatorPrefs.comission;
        reward.validatorType = validatorPrefs.comission == 1 ? 'custodial' : 'public';
        reward.rewardType = reward.validator.id == reward.nominator ? 'comission' : 'staking reward';

        if(reward.validatorType == 'custodial') this.logger.warn(`Found custodial validator ${reward.validator.id}`);
        return reward;
    }

    async getCachedExposureByStaker(era, validatorId):Promise<any> {
        const cacheKey = `exposure-${validatorId}-${era}`;
        
        if (this.exposureCache.has(cacheKey)) {return this.exposureCache.get(cacheKey);} else {
            const valuePromise = this.getExposureByStaker(era, validatorId);
            this.exposureCache.set(cacheKey, valuePromise);
            return valuePromise;
        }
    }

    async getExposureByStaker(era, validatorId):Promise<any> {
        if (this.tracing) this.logger.debug(`Requesting eraStakers for ${validatorId} era ${era}`);
        return this.api.query.staking.erasStakersClipped(era, validatorId)
            .then(result => {
                const r = {};
                r[validatorId] = result.own.toBigInt().toString();
                result.others.forEach(exposure => r[exposure.who] = exposure.value.toBigInt().toString());
                return r;
            });
    }

    async getCachedValidatorPrefs(era, validatorId):Promise<any> {
        const cacheKey = `prefs-${validatorId}-${era}`;

        if (this.prefsCache.has(cacheKey)) {return this.prefsCache.get(cacheKey);} else {
            const valuePromise = this.getValidatorPrefs(era, validatorId);
            this.prefsCache.set(cacheKey, valuePromise);
            return valuePromise;
        }
    }


    async getValidatorPrefs(era, validatorId):Promise<any> {
        if (this.tracing) this.logger.debug(`Requesting validatorPrefs for ${validatorId} era ${era}`);
        return this.api.query.staking.erasValidatorPrefs(era, validatorId)
            .then(result => ({
                commission: result.commission.toNumber() / 1000000000,
                blocked: result.blocked.toHuman(),
            }));
    }


    addPublicIPAddresses(reward) {
        if(!reward.previousHeartbeat) {
            this.logger.warn(`No heartbeat traced for reward ${reward.id}, IP addressing not possible.`);
            return reward;
        }

        const externalAddress = JSON.parse(reward.previousHeartbeat.externalAddresses);

        const publicAddresses = externalAddress.map(address => {

            if(isHex(address)) address = u8aToString(hexToU8a(address));
            if(address[0] != '/' && address[1] == '/') address = address.substring(1);

            try{
                const ma = new Multiaddr(address);
                if (ma.nodeAddress().family === 4 || ma.nodeAddress().family === 6) {
                    const ipv46a = ma.nodeAddress().address;
                    if (!is_private_ip(ipv46a)) return ipv46a;
                } else {this.logger.warn(`Unexpected address type ${address} for ${reward.id}\``);}
            } catch (e) {
                this.logger.warn(`Could not parse address ${address} for ${reward.id}`);
            }

        }).filter(address => address);

        if (this.tracing) this.logger.debug(`external IPV46 for reward ${reward.id} are ${publicAddresses}`);
        if (!publicAddresses.length) this.logger.warn(`NO external IPV46 addresses identified for reward ${reward.id}`);
        reward.previousHeartbeat.previousPublicExternalIPV46Addresses = publicAddresses;

        return reward;
    }

    async addValidatorInfo(reward): Promise<any> {
        reward.validator.info = await this.getCachedValidatorInfo(reward.validator.id);
        return reward;
    }

    async getCachedValidatorInfo(validatorId):Promise<any> {
        const cacheKey = `info-${validatorId}`;

        if (this.validatorInfoCache.has(cacheKey)) {return this.validatorInfoCache.get(cacheKey);} else {
            const valuePromise = this.getValidatorInfo(validatorId);
            this.validatorInfoCache.set(cacheKey, valuePromise);
            return valuePromise;
        }
    }

    /**
     * Returns up to date substrate information about the validator and its parent.
     * @param reward
     */
    async getValidatorInfo(validatorId):Promise<any> {
        const ret = {
            info: undefined,
            parentInfo: undefined,
            parentId: undefined,
            childId: undefined,
        };
        const validatorInfo = await this.api.query.identity.identityOf(validatorId as AccountId);
        if (validatorInfo.isSome) ret.info = validatorInfo.unwrap().toHuman().info;

        let validatorSuper = await this.api.query.identity.superOf(validatorId as AccountId);
        if(validatorSuper.isSome) {
            validatorSuper = validatorSuper.unwrap().toHuman();
            const validatorParent = validatorSuper[0];
            ret.parentId = validatorParent;
            if(validatorSuper.length > 1) ret.childId = validatorSuper[1].Raw;
            const parentInfo = await this.api.query.identity.identityOf(validatorParent);
            if (parentInfo.isSome) ret.parentInfo = parentInfo.unwrap().toHuman().info;
        }

        // if (this.tracing)
        this.logger.debug(`Validator info for ${validatorId} is ${JSON.stringify(ret)}`);
        return ret;
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