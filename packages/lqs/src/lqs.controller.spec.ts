import { Test, TestingModule } from '@nestjs/testing';
import { BaseController } from './lqs.controller';
import { IndexQueryService, QueryTemplate } from './lqs.index.service';
import { RewardDistributionQueryDto } from './queries/query.parameters.dtos';
import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { AppModule } from './lqs.module';

describe('BaseController Unit Tests - search and transformation with mocked elastic response', () => {

    let baseController: BaseController;
    beforeAll(async () => {

        // Mock elastic service response
        const ElasticFake = {
            provide: ElasticsearchService,
            useFactory: () => ({
                search: jest.fn((x) => {
                    return x.body + 1;
                }),
            }),
        };

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
            controllers: [BaseController],
            providers: [ElasticFake, IndexQueryService],
        }).compile();

        baseController = moduleFixture.get<BaseController>(BaseController);
    });

    it('checks if runQuery method on BaseController correctly returns response from ElasticService.search', async () => {
        const dto = 1;
        const dto2 = 3;
        const qt = (x) => x as QueryTemplate;
        const transformation = (x) => x;
        // @ts-ignore
        expect(await baseController.runQuery(dto, qt, transformation)).toEqual(2);
        // @ts-ignore
        expect(await baseController.runQuery(dto2, qt, transformation)).toEqual(4);
    });

    it('checks if transformation works as expected', async () => {
        const dto = 1;
        const dto2 = 3;
        const qt = (x) => x as QueryTemplate;
        const transformation = (x) => x * 10;
        // @ts-ignore
        expect(await baseController.runQuery(dto, qt, transformation)).toEqual(20);
        // @ts-ignore
        expect(await baseController.runQuery(dto2, qt, transformation)).toEqual(40);
    });
});

describe('Validation Unit Tests - test DTO against nestjs validation pipeline', () => {

    it('tests validation pipeline - using DistributionQueryDto', async () => {
        const testObject1 = {
            StartingEra: 500,
            TopResults: 10,
        };
        const testObject2 = {
            StartingEra: '500',
            TopResults: 10,
        };
        const target: ValidationPipe = new ValidationPipe({ transform: true, whitelist: true });
        const metadata: ArgumentMetadata = {
            type: 'body',
            metatype: RewardDistributionQueryDto,
            data: '',
        };

        await expect(target.transform(testObject1, metadata)).resolves.toEqual(testObject1);

        await expect(target.transform(testObject2, metadata)).rejects.toThrowError();

    });
});