import { Test, TestingModule } from '@nestjs/testing';
import { SubstrateHistoryService } from './substrate.history.service';

describe('SubstrateService', () => {
    let service: SubstrateHistoryService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [SubstrateHistoryService],
        }).compile();

        service = module.get<SubstrateHistoryService>(SubstrateHistoryService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

});
