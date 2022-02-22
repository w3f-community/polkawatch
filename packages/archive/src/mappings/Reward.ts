import {SubstrateEvent,SubstrateBlock} from "@subql/types";
import {EraIndex, Balance, AccountId} from "@polkadot/types/interfaces";
import {Reward, Validator} from "../types";

import {getTimestamp} from "./TimeStamp";
import {getCachedPayout} from "./Payout";

export async function hanbleReward(event: SubstrateEvent): Promise<void> {
    const blockNum=event.block.block.header.number.toBigInt();
    const eventIdx=event.idx;
    const eventId =`${blockNum}-${eventIdx}`;

    const reward = new Reward(
        eventId
    );

    const timeStamp = getTimestamp(event.block.block.header.number.toBigInt());
    const extrinsic=event.extrinsic.extrinsic.toHuman();

    const payout=getCachedPayout(blockNum,eventIdx,logger) ;
    const validator= await Validator.get(payout.validatorId);

    logger.info(`Reward: ${eventId} era ${payout.era} by validator ${payout.validatorId}`);
    const {event: {data: [accountId, newReward]}} = event;

    reward.timeStamp=timeStamp;
    reward.validatorId=payout.validatorId;
    reward.nominator=(accountId as AccountId).toString();
    reward.newReward=(newReward as Balance).toBigInt();
    reward.payoutId=payout.id;
    reward.blockNumber=blockNum;
    reward.era=payout.era;

    // Why? heartbeats come all the time, and validators will move addresses
    // We associate to the reward the most recent we have
    reward.previousHeartbeatId=validator.lastHeartbeatId;

    logger.debug(JSON.stringify(event));
    return reward.save();
}