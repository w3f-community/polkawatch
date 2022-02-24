import { Test, TestingModule } from '@nestjs/testing';
import { SubstrateHistoryService, SubstrateAPIService } from './substrate.history.service';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { Multiaddr } from 'multiaddr';
import { hexToU8a, isHex, u8aToString } from'@polkadot/util';


describe('SubstrateService', () => {
    let service: SubstrateHistoryService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    validationSchema: Joi.object({
                        INDEXER_SUBSTRATE_RPC_URL: Joi.string().default('wss://polkadot.valletech.eu'),
                    }),
                }),
            ],
            providers: [SubstrateAPIService, SubstrateHistoryService],
        }).compile();

        service = module.get<SubstrateHistoryService>(SubstrateHistoryService);
    });

    it('should be defined', () => {
        jest.setTimeout(10000);
        expect(service).toBeDefined();
    });

    /**
     * The polkadot API doesn't exactly use Multiadress as defined in libp2p
     * The documentation does not enter into detail of specific usage
     * Research of the substrate code is required.
     * This test cover the required cases anyway.
     */
    it('Will test the MultiAddress library for required functionality', () => {
        const addr = new Multiaddr('/ip4/127.0.0.1/udp/1234');
        expect(addr.nodeAddress().family).toBe(4);
        expect(addr.nodeAddress().address).toBe('127.0.0.1');
        expect(Multiaddr.isMultiaddr(addr)).toBeTruthy();
        // no clue what this first character is or who is introducing it in the address
        // does not show up in the Multiaddress speficiation
        const addr2 = new Multiaddr('l/ip4/51.163.1.174/tcp/30004'.substring(1));
        expect(Multiaddr.isMultiaddr(addr2)).toBeTruthy();
        // earlier HB cotains packed addresses
        const addr3 = '0x8c2f6970362f323030313a343164303a3330333a333738633a3a2f7463702f3330333333';
        expect(isHex(addr3)).toBeTruthy();
        const ma3 = new Multiaddr(u8aToString(hexToU8a(addr3)).substring(1));
        expect(Multiaddr.isMultiaddr(ma3)).toBeTruthy();
    });

    it('will test public ip address parsing', ()=>{
        const reward = {
            id: 'R-1',
            previousHeartbeat:{
                externalAddresses: '["l/ip4/51.163.1.174/tcp/30004","d/ip4/172.18.0.2/tcp/30004","d/ip4/172.18.0.3/tcp/30004","p/ip4/192.168.162.0/tcp/30004","d/ip4/172.16.9.1/tcp/30004","p/ip4/192.168.3.128/tcp/30004","x/ip4/192.168.227.128/tcp/30004","x/ip4/192.168.110.128/tcp/30004","x/ip4/192.168.196.128/tcp/30004","0x8c2f6970362f323030313a343164303a3330333a333738633a3a2f7463702f3330333333"]',
            },
        };

        const rewardWithIps = service.addPublicIPAddresses(reward);
        const publicIPs = rewardWithIps.previousHeartbeat.previousPublicExternalIPV46Addresses;
        expect(publicIPs).toContain('51.163.1.174');
        expect(publicIPs).not.toContain('172.18.0.2');
        expect(publicIPs).not.toContain('192.168.3.128');
        expect(publicIPs).toContain('2001:41d0:303:378c::');

    });

    /**
     * Validator info appears and is presented in several configurations
     * We will test
     */
    it('Will fetch validator info of a well known validator', async ()=>{

        // Anonymous validator with named parent, indexed.
        let info = await service.getValidatorInfo('1zugcagDxgkJtPQ4cMReSwXUbhQPGgtDEmFdHaaoHAhkKhU');
        expect(info.info).toBeUndefined();
        expect(info.parentId).toBeDefined();
        expect(info.parentInfo).toBeDefined();
        expect(info.childId).toBeDefined();

        // Named validator with no parent
        info = await service.getValidatorInfo('1MrurrNb4VTrRJUXT6fGxHFdmwwscqHZUFkMistMsP8k5Nk');
        expect(info.info).toBeDefined();
        expect(info.parentId).toBeUndefined();
        expect(info.parentInfo).toBeUndefined();
        expect(info.childId).toBeUndefined();

        // anonymous validator with no parent
        info = await service.getValidatorInfo('14xEfVDASe2FYodUoNoXaksxyvnjxudjjQXkbXWgG5fVaxi8');
        expect(info.info).toBeUndefined();
        expect(info.parentId).toBeUndefined();
        expect(info.parentInfo).toBeUndefined();
        expect(info.childId).toBeUndefined();


    });


});
