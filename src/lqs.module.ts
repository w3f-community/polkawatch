import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { IndexQueryService } from './lqs.index.service';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import QueryConstrollers from './queries';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        LQS_PORT: Joi.number().default(7000),
        LQS_GLOBAL_PREFIX: Joi.string().default('lqs'),
        LQS_ELASTIC_HOST: Joi.string().default('localhost'),
        LQS_ELASTIC_PROTO: Joi.string().default('http'),
        LQS_ELASTIC_PORT: Joi.number().default(9200),
      }),
    }),
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        node: `${configService.get('LQS_ELASTIC_PROTO')}://${configService.get(
          'LQS_ELASTIC_HOST',
        )}:${configService.get('LQS_ELASTIC_PORT')}`,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: QueryConstrollers,
  providers: [IndexQueryService],
})
export class AppModule {}
