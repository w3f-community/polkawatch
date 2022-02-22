import { SubstrateExtrinsic } from '@subql/types';
import { Compact } from '@polkadot/types';
import { Moment } from '@polkadot/types/interfaces';

let lastTimestamp = {
    block: null,
    ts: BigInt(0),
};

// This will actually work only for the last timestamp
// block check is done for validation
export function getTimestamp(blk) {
    const { block, ts } = lastTimestamp;
    if(blk == block) {
        return ts;
    } else {
        logger.warn('Requesting Timestamp for out of order block');
        return BigInt(-1);
    }
}

export async function handleTimestampSet(extrinsic: SubstrateExtrinsic): Promise<void> {
    const moment = extrinsic.extrinsic.args[0] as Compact<Moment>;
    lastTimestamp = {
        block: extrinsic.block.block.header.number.toBigInt(),
        ts: moment.toBigInt(),
    };
}

