// Copyright 2021-2022 Valletech AB authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SubstrateExtrinsic } from '@subql/types';
import { Compact } from '@polkadot/types';
import { Moment } from '@polkadot/types/interfaces';

let lastTimestamp = {
    block: null,
    ts: BigInt(0),
};

// All events without a block are assumed to have the timestamp of the block itself.
// We just check that we are not asking for the timestamp from an event handling in another block
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

