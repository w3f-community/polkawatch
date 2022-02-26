// Copyright 2021-2022 Valletech AB authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SubstrateEvent } from '@subql/types';
import { Balance, AccountId } from '@polkadot/types/interfaces';
import { Reward, Validator } from '../types';

import { getTimestamp } from './TimeStamp';
import { getCachedPayout } from './Payout';

export async function hanbleReward(event: SubstrateEvent): Promise<void> {
    const blockNum = event.block.block.header.number.toBigInt();
    const eventIdx = event.idx;
    const eventId = `${blockNum}-${eventIdx}`;

    const reward = new Reward(
        eventId,
    );

    const timeStamp = getTimestamp(event.block.block.header.number.toBigInt());

    // We get the payout that is associated with this Reward event.
    // The Indexer will be able to verify that our tracing was accurate in 2nd Stage Indexing
    // by comparing the archived events to subQuery eraStakers api calls when processing inside history depth

    const payout = getCachedPayout(blockNum, eventIdx, logger) ;
    const validator = await Validator.get(payout.validatorId);

    logger.info(`Reward: ${eventId} era ${payout.era} by validator ${payout.validatorId}`);
    const { event: { data: [accountId, newReward] } } = event;

    reward.timeStamp = timeStamp;
    reward.validatorId = payout.validatorId;
    reward.nominator = (accountId as AccountId).toString();
    reward.newReward = (newReward as Balance).toBigInt();
    reward.payoutId = payout.id;
    reward.blockNumber = blockNum;
    reward.era = payout.era;

    // The Reward event will inherit Geo Location data associated with the external Addresses provided in the
    // last heartbeat received from its validator.
    reward.previousHeartbeatId = validator.lastHeartbeatId;

    logger.debug(JSON.stringify(event));
    return reward.save();
}