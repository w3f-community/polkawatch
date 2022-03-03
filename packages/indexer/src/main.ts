// Copyright 2021-2022 Valletech AB authors & contributors
// SPDX-License-Identifier: Apache-2.0


import { NestFactory } from '@nestjs/core';
import { IndexerModule } from './indexer.module';
import { ConfigService } from '@nestjs/config';

// Adds support for proxying, required in production

import 'global-agent/bootstrap';


/**
 * NestJS application bootstrap
 */
async function bootstrap() {
    const app = await NestFactory.create(IndexerModule);
    app.enableShutdownHooks();
    await app.listen(app.get(ConfigService).get('INDEXER_PORT'));
}
bootstrap();
