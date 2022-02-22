import {Injectable, Inject, Logger} from '@nestjs/common';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { ConfigService } from '@nestjs/config';



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

    private readonly logger = new Logger(SubstrateHistoryService.name);

    constructor(@Inject('SUBSTRATE_API') private api, private configService: ConfigService) {}

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
    async historyDepthStartBlock():Promise<number>{
        let historyDepth = await this.api.query.staking.historyDepth();
        let epochDuration = await this.api.consts.babe.epochDuration.toNumber();
        let sessionsPerEra = await this.api.consts.staking.sessionsPerEra.toNumber();
        let blocksPerEra = sessionsPerEra * epochDuration;
        let historyBlocks = blocksPerEra * historyDepth;
        let currentBlockNumber = await this.api.query.system.number();
        let startBlock = currentBlockNumber - historyBlocks;
        this.logger.log(`History Depth starts at block: ${startBlock}`)
        return startBlock;
    }

}

export const SubstrateAPIService =  {
    provide: 'SUBSTRATE_API',
    useFactory: async (configService: ConfigService) => {
        const endpoint=configService.get('INDEXER_SUBSTRATE_RPC_URL');
        const logger = new Logger('SUBSTRATE_API')
        const wsProvider = new WsProvider(endpoint);
        const api = await ApiPromise.create({ provider: wsProvider });
        const ready = await api.isReady;
        logger.log(`Substrate API Ready with endpoint: ${endpoint}`)
        return api;
    },
    inject: [ConfigService]
}