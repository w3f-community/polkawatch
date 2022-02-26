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
});

