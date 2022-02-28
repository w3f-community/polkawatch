// Copyright 2021-2022 Valletech AB authors & contributors
// SPDX-License-Identifier: Apache-2.0


import { Test, TestingModule } from '@nestjs/testing';
import { SubstrateHistoryService } from './substrate.history.service';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';


// The API Connection may take time when connecting from far away
jest.setTimeout(10000);

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
            providers: [{
                provide: 'SUBSTRATE_API',
                useValue: {},
            }, SubstrateHistoryService],
        }).compile();

        service = module.get<SubstrateHistoryService>(SubstrateHistoryService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('will test public ip address parsing', ()=>{
        const reward = {
            id: 'R-1',
            previousHeartbeat:{
                externalAddresses: '["l/ip4/51.163.1.174/tcp/30004","d/ip4/172.18.0.2/tcp/30004","d/ip4/172.18.0.3/tcp/30004","p/ip4/192.168.162.0/tcp/30004","d/ip4/172.16.9.1/tcp/30004","p/ip4/192.168.3.128/tcp/30004","x/ip4/192.168.227.128/tcp/30004","x/ip4/192.168.110.128/tcp/30004","x/ip4/192.168.196.128/tcp/30004","0x8c2f6970362f323030313a343164303a3330333a333738633a3a2f7463702f3330333333"]',
            },
        };

        const rewardWithIps = service.addPublicIPAddresses(reward);
        const publicIPs = rewardWithIps.previousHeartbeat.externalIPV46Addresses;
        expect(publicIPs).toContain('51.163.1.174');
        expect(publicIPs).not.toContain('172.18.0.2');
        expect(publicIPs).not.toContain('192.168.3.128');
        expect(publicIPs).toContain('2001:41d0:303:378c::');

    });

    /**
     * Validator info appears and is presented in several configurations
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
