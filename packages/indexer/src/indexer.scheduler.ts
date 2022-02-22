import { Injectable, Logger } from '@nestjs/common';

import { Cron, Timeout } from '@nestjs/schedule';

import { ArchiveService } from './archive.service';
import { SubstrateHistoryService } from './substrate.history.service';

/**
 * This is the main entrypoin of Polkawatch second pass indexing
 * It is scheduled as it depends on live data
 *
 */

@Injectable()
export class IndexerSchedulerService {
    private readonly logger = new Logger(IndexerSchedulerService.name);

    constructor(
    private archiveService: ArchiveService,
    private substrateHistory: SubstrateHistoryService,
    ) {
        // ignore
    }

    @Cron('0 0 3 * * *')
    async processRewardsDaily() {
        return this.rewardProcessing();
    }

    @Timeout(2000)
    async processRewardsOnStart() {
        return this.rewardProcessing();
    }


    async rewardProcessing() {
        let qr: QueryRet = { hasNext: true, cursor: undefined };
        let total = 0;

        this.logger.log('Starting Rewards Processing');
        const startBlockNumber = await this.substrateHistory.historyDepthStartBlock();

        while (qr.hasNext) {
            // We will run the query in batches
            // Each batch will be processed asynchronously
            // Return Query Status, and the results of processing all reward events
            qr = await this.archiveService
                .queryRewards({ batchSize: 100, cursor: qr.cursor, startBlockNumber: startBlockNumber })
                .then((results) =>
                    Promise.all([
                        Promise.resolve({
                            hasNext: results.data.rewards.pageInfo.hasNextPage,
                            cursor:
                results.data.rewards.edges[
                    results.data.rewards.edges.length - 1
                ].cursor,
                        }),
                        Promise.all(
                            results.data.rewards.edges.map((reward) =>
                                this.processReward(reward.node),
                            ),
                        ),
                    ]),
                )
                .then((result) => {
                    // We compute the number of records
                    total += result[1].length;
                    this.logger.debug(
                        `processing rewards ${total} so far, last: ${
                            result[1][result[1].length - 1].id
                        }`,
                    );
                    return result[0];
                });
        }
        this.logger.log(`${total} rewards processed`);
    }

    /**
   * Processes a Reward event asynchronously
   * @param reward
   */
    async processReward(reward): Promise<any> {
        // this.logger.debug(reward);
        return this.archiveService.traceLastHeartbeat(reward);
    }
}

type QueryRet = {
  hasNext: boolean;
  cursor: string;
};
