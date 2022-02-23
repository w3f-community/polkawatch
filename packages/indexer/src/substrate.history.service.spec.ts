import { Test, TestingModule } from '@nestjs/testing';
import { SubstrateHistoryService, SubstrateAPIService } from './substrate.history.service';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';


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
        expect(service).toBeDefined();
    });

});
