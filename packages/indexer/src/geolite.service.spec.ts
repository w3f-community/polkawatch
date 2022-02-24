import { Test, TestingModule } from '@nestjs/testing';
import { GeoliteService, GeoliteDBService } from './geolite.service';

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

