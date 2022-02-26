// Copyright 2021-2022 Valletech AB authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SubstrateEvent } from '@subql/types';
import { EraIndex, AccountId } from '@polkadot/types/interfaces';
import LRU from 'lru-cache';

// Also implements Payout
import { Payout as PayoutRecord } from '../types';
import { getValidator } from './Heartbeat';

export async function hanblePayout(event: SubstrateEvent): Promise<void> {
    const blockNum = event.block.block.header.number.toBigInt();
    const eventIdx = event.idx;
    const eventId = `${blockNum}-${eventIdx}`;

    const payout = new PayoutRecord (
        eventId,
    );

    const { event: { data: [eraId, validatorId] } } = event;

    payout.blockNumber = blockNum;
    payout.era = (eraId as EraIndex).toBigInt();
    payout.eventIndex = eventIdx;
    const validator = await getValidator((validatorId as AccountId).toString());
    validator.lastPayoutId = payout.id;
    payout.validatorId = validator.id;

    logger.info(`PayoutStarted: ${eventId} ref era ${payout.era} and ${validator.id}`);
    logger.debug(JSON.stringify(event.event));

    cachePayout(payout);
    await validator.save();
    return payout.save();
}

/**
 * LRU Cache to related Rewards with Payouts
 */
const eraPayoutCache = new LRU({
    max:10,
});

export type Payout = {
    id: string
    blockNumber: bigint
    eventIndex: number
    era: bigint
    validatorId: string
}

/**
 * We need to track when a Payout event takes place in chain because the Reward event
 * happens right after it and subquery does not call handlers in order. This allows us to disambiguate
 * when several Payouts take place in the same block.
 * @param payout
 * @returns {Promise<void>}
 */
export function cachePayout(payout: Payout) {
    let blockPayouts;
    if (eraPayoutCache.has(payout.blockNumber)) blockPayouts = eraPayoutCache.get(payout.blockNumber);
    else blockPayouts = {};
    // record this block payout
    blockPayouts[payout.eventIndex] = payout;
    // cache the data
    eraPayoutCache.set(payout.blockNumber, blockPayouts);
}

/**
 * From all the payouts cached we return the last one that took place before the event
 * @param block
 * @param eventIndex
 * @param logger
 */
export function getCachedPayout(block: bigint, eventIndex, logger = console) : Payout {
    if(eraPayoutCache.has(block)) {
        const blockPayouts = eraPayoutCache.get(block);
        const payoutAtEventsIds = Object.keys(blockPayouts).map(i=>parseInt(i));

        // filter out any payout event AFTER the event, sort, return the last one
        const eraId = payoutAtEventsIds
            .filter(eid => eid < eventIndex)
            .sort((a, b)=>a - b)
            .pop();

        return blockPayouts[eraId];
    } else {logger.error(`Expected payout in block ${block} before event ${eventIndex} is missing`);}
}