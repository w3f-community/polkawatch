// Import
import { ApiPromise, WsProvider } from '@polkadot/api';

describe('Polkadotjs', () => {
    let api: any;
    let wsProvider: any;
    beforeEach(async () => {
        // Construct
        wsProvider = new WsProvider('wss://rpc.polkadot.io');
        api = await ApiPromise.create({ provider: wsProvider });
    });

    it('should be defined', async () => {
        console.log(await api.genesisHash.toHex());
        expect(await api.genesisHash.toHex()).toBeDefined();
    });

    // afterAll(async () => {await api.disconnect(); });

});