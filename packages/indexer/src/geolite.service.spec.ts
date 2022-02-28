// Copyright 2021-2022 Valletech AB authors & contributors
// SPDX-License-Identifier: Apache-2.0


import { Test, TestingModule } from '@nestjs/testing';
import { GeoliteService, GeoliteDBService } from './geolite.service';

// it might be required to download GeoIP databases
jest.setTimeout(60000);

describe('GeoliteService', () => {
    let service: GeoliteService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [GeoliteService, GeoliteDBService],
        }).compile();

        service = module.get<GeoliteService>(GeoliteService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('will test geo location of a reward a', async ()=>{
        const reward = await service.processReward({
            id: 'R1',
            previousHeartbeat: {
                externalIPV46Addresses: ['1.1.1.1'],
            },
        });

        expect(reward.geo_country_display.country_code).toBe('AU');
        expect(reward.geo_asn_display.asn_name).toBe('CLOUDFLARENET');
        expect(reward.geo_asn_display.asn_group_code).toBe('NOT_TRACED');

    });


    it('will test geo location of a reward b', async ()=>{
        const reward = await service.processReward({
            id: 'R1',
            previousHeartbeat: {
                externalIPV46Addresses: ['8.8.8.8'],
            },
        });

        expect(reward.geo_country_display.country_code).toBe('US');
        expect(reward.geo_asn_display.asn_name).toBe('GOOGLE');
        expect(reward.geo_asn_display.asn_group_code).toBe('NOT_TRACED');

    });


});

