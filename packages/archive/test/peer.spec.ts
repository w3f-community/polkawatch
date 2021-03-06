// Copyright 2021-2022 Valletech AB authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/api';
import { substrateKeyOwner } from '../src';

// Allow for endpoints to be configured later on
const endpoint = process.env.PW_POLKADOT_RPC || 'wss://polkadot.valletech.eu';

// @ts-ignore
const logger = console;

describe('Will test mapping authority IDs to Validators', ()=>{
    let api;

    beforeAll(async function() {
        const wsProvider = new WsProvider(endpoint);
        api = await ApiPromise.create({ provider: wsProvider });
    }, 10000);

    it('Will get a key owner', async function() {
        const raw = await api.query.session.keyOwner(['0x696d6f6e', '0xa6ab108e0d10b8248469d38dd81c1dac29ccb53a9281577057077a062095b642']);
        logger.log(raw.toHex());
        const kr = new Keyring({ type: 'sr25519' });
        const kp = kr.addFromAddress(raw.toHex());
        kr.setSS58Format(0);
        expect(kp.address === '15mURTf3t8dEvEY6Gb5N76wm9t2jQcXzewXmjT3yfZA1w8si');
        logger.log(kp.address);
    });

    it('Will get a key owner with our utility', async function() {
        const owner = await substrateKeyOwner(api, '0xa6ab108e0d10b8248469d38dd81c1dac29ccb53a9281577057077a062095b642');
        logger.log(owner);
        expect(owner === '15mURTf3t8dEvEY6Gb5N76wm9t2jQcXzewXmjT3yfZA1w8si');
    });

    afterAll(async function() {
        logger.log('disconnecting...');
        // await api.disconnect();
    }, 20000);

});