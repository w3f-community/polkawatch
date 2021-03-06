// Copyright 2021-2022 Valletech AB authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NestFactory, NestApplication } from '@nestjs/core';
import { AppModule } from './lqs.module';
import { ConfigService } from '@nestjs/config';

import { configure } from './lqs.config';

async function bootstrap() {
    // App setup
    const app: NestApplication = await NestFactory.create(
        AppModule,
    );

    configure(app);

    await app.listen(app.get(ConfigService).get('LQS_PORT'));
}

bootstrap();
