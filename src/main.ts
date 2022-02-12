import { NestFactory } from '@nestjs/core';
import { AppModule } from './lqs.module';
import { ConfigService } from '@nestjs/config';

import {configure} from './lqs.config';

import {
    FastifyAdapter,
    NestFastifyApplication,
} from '@nestjs/platform-fastify';

async function bootstrap() {
    // App setup
    const app: NestFastifyApplication = await NestFactory.create(
        AppModule,
        new FastifyAdapter(),
    );

    configure(app);

    await app.listen(app.get(ConfigService).get('LQS_PORT'));
}

bootstrap();
