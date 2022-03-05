// Copyright 2021-2022 Valletech AB authors & contributors
// SPDX-License-Identifier: Apache-2.0


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
 * It might be possible to migrate some of this traces to pass-1 later on.
 *
 */

@Injectable()
export class SubstrateHistoryService {

    private readonly tracing = false;
    private readonly logger = new Logger(SubstrateHistoryService.name);

    // We will cache some expensive Substrate queries
    private exposureCache;
    private prefsCache;
    private validatorInfoCache;

    constructor(@Inject('SUBSTRATE_API') private api, private configService: ConfigService) {
        // When caching we are sizing with the following assumptions
        // We consider 5 eras being claimed by 300 validators
        this.exposureCache = new LRU({ max:1500 });
        this.prefsCache = new LRU({ max:1500 });
        this.validatorInfoCache = new LRU({ max:200 });
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

        // This message may result also if the payout - reward trace is an error
        // becuase we dont find in history-depth a matching record of exposure
        if(!exposure) this.logger.warn(`No EXPOSURE traced in ${reward.id}`);
        reward.nominationExposure = exposureByStaker[reward.nominator];
        reward.comission = validatorPrefs.comission;

        // Here we try to caracterize the reward and validator for later analysis or grouping
        reward.validatorType = validatorPrefs.comission == 1 ? 'custodial' : 'public';
        reward.rewardType = reward.validator.id == reward.nominator ? 'validator comission' : 'staking reward';

        if(reward.validatorType == 'custodial') this.logger.warn(`Found custodial validator ${reward.validator.id}`);
        return reward;
    }

    /**
     * Cached version of Exposure by Staker
     * @param era
     * @param validatorId
     */
    async getCachedExposureByStaker(era, validatorId):Promise<any> {
        const cacheKey = `exposure-${validatorId}-${era}`;
        
        if (this.exposureCache.has(cacheKey)) {return this.exposureCache.get(cacheKey);} else {
            const valuePromise = this.getExposureByStaker(era, validatorId);
            this.exposureCache.set(cacheKey, valuePromise);
            return valuePromise;
        }
    }

    /**
     * Returns the exposure of nominators for a given era and validator id.
     * @param era
     * @param validatorId
     */
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


    /**
     * Cached version of Validator Preferences
     * @param era
     * @param validatorId
     */
    async getCachedValidatorPrefs(era, validatorId):Promise<any> {
        const cacheKey = `prefs-${validatorId}-${era}`;

        if (this.prefsCache.has(cacheKey)) {return this.prefsCache.get(cacheKey);} else {
            const valuePromise = this.getValidatorPrefs(era, validatorId);
            this.prefsCache.set(cacheKey, valuePromise);
            return valuePromise;
        }
    }

    /**
    * Returns validator preferences for a given era
    * @param era
    * @param validatorId
    */
    async getValidatorPrefs(era, validatorId):Promise<any> {
        if (this.tracing) this.logger.debug(`Requesting validatorPrefs for ${validatorId} era ${era}`);
        return this.api.query.staking.erasValidatorPrefs(era, validatorId)
            .then(result => ({
                commission: result.commission.toNumber() / 1000000000,
                blocked: result.blocked.toHuman(),
            }));
    }


    /**
     * Returns the public IP addresses associated with a reward event.
     * @param reward
     */
    addPublicIPAddresses(reward) {

        // We need a previous HeartBeat event traced to this reward in order to workout this.
        if(!reward.previousHeartbeat) {
            this.logger.warn(`No heartbeat traced for reward ${reward.id}, IP addressing not possible.`);
            return reward;
        }

        const externalAddress = JSON.parse(reward.previousHeartbeat.externalAddresses);

        const publicAddresses = externalAddress.map(address => {
            // We unpack the Address if it is in Hex, which some are
            if(isHex(address)) address = u8aToString(hexToU8a(address));

            // There is a 1-char prefix added to the libp2p Multiaddress which we remove.
            // No idea whast it is about, we could not find
            if(address[0] != '/' && address[1] == '/') address = address.substring(1);

            try{
                const ma = new Multiaddr(address);
                if (ma.nodeAddress().family === 4 || ma.nodeAddress().family === 6) {
                    const ipv46a = ma.nodeAddress().address;
                    if (!is_private_ip(ipv46a)) return ipv46a;
                } else {this.logger.warn(`Unexpected address type ${address} for ${reward.id}\``);}
            } catch (e) {
                // This is a data quality warning, we must of course always be able to parse the address.
                this.logger.warn(`Could not parse address ${address} for ${reward.id}`);
            }

        }).filter(address => address);

        if (this.tracing) this.logger.debug(`external IPV46 for reward ${reward.id} are ${publicAddresses}`);
        if (!publicAddresses.length) this.logger.warn(`NO external IPV46 addresses identified for reward ${reward.id}`);
        reward.previousHeartbeat.externalIPV46Addresses = publicAddresses;

        return reward;
    }

    /**
     * Returns the validator information for a reward.
     * @param reward
     */
    async addValidatorInfo(reward): Promise<any> {
        reward.validator.info = await this.getCachedValidatorInfo(reward.validator.id);
        return reward;
    }

    /**
     * Cached version of validator info.
     * @param reward
     */
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
            id: validatorId,
            info: undefined,
            parentInfo: undefined,
            parentId: undefined,
            childId: undefined,
            display: undefined,
        };
        const validatorInfo = await this.api.query.identity.identityOf(validatorId as AccountId);
        if (validatorInfo.isSome) ret.info = validatorInfo.unwrap().toHuman().info;

        let validatorSuper = await this.api.query.identity.superOf(validatorId as AccountId);
        if(validatorSuper.isSome) {
            validatorSuper = validatorSuper.unwrap().toHuman();
            const validatorParent = validatorSuper[0];
            ret.parentId = validatorParent;
            if(validatorSuper.length > 1) ret.childId = validatorSuper[1];
            const parentInfo = await this.api.query.identity.identityOf(validatorParent);
            if (parentInfo.isSome) ret.parentInfo = parentInfo.unwrap().toHuman().info;
        }

        // Add the Validator information in its preferred display format
        ret.display = this.getValidatorInfoDisplay(ret);

        if (this.tracing) this.logger.debug(`Validator info for ${validatorId} is ${JSON.stringify(ret)}`);
        return ret;
    }

    /**
     * The validator information is presented to the user differently depending on the
     * parent/child available data
     * @param info
     */
    getValidatorInfoDisplay(vi) {
        return {
            name: this.getValidatorDisplayName(vi),
            parentId: vi.parentId ? vi.parentId : vi.id,
            groupName: this.getValidatorGroupName(vi),
            groupWeb: this.getValidatorGroupAttributute(vi, 'web'),
            groupEmail: this.getValidatorGroupAttributute(vi, 'email'),
            groupLegal: this.getValidatorGroupAttributute(vi, 'legal'),
            groupRiot: this.getValidatorGroupAttributute(vi, 'riot'),
        };

    }

    /**
     * Workout the validator display name depending on the different present information objects
     * @param vi the available validator information
     */
    getValidatorDisplayName(vi) {
        // the validator itself has a
        if (vi.info) {
            if (vi.info.display) {return this.decodeInfoField(vi.info.display);}
        }
        if(vi.parentInfo && vi.childId) return `${this.getValidatorGroupName(vi)} / ${this.decodeInfoField(vi.childId)}`;
        return vi.id;
    }

    /**
     * Workout the group name of the validator
     * @param vi the available validator information
     */
    getValidatorGroupName(vi) {
        // if we dont have parent, we are it, use or same display name
        if(!vi.parentId) return this.getValidatorDisplayName(vi);
        if(vi.parentInfo) return this.decodeInfoField(vi.parentInfo.display);
        else return vi.parentId;
    }

    /**
     * Return a validator group data field,
     * @param vi
     * @param attr
     */
    getValidatorGroupAttributute(vi, attr) {
        if(vi.parentInfo) {
            if(vi.parentInfo[attr]) {return this.decodeInfoField(vi.parentInfo[attr]);}
        }
    }

    /**
     * Will read an info field, detecting and decoding it in the case it is HEX
     */
    decodeInfoField(field) {
        if(isHex(field.Raw)) return new Buffer(hexToU8a(field.Raw)).toString();
        else return field.Raw;
    }

    /**
     * We close the api connection on module destroy
     */
    async onModuleDestroy() {
        this.logger.log('Closing API Connection...');
        await this.api.disconnect();
    }
}

/**
 * Associated provider of the RPC api object.
 * Will return the connected api object after configuration.
 */
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