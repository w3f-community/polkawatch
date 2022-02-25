import { NestFactory } from '@nestjs/core';
import { IndexerModule } from './indexer.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
    const app = await NestFactory.create(IndexerModule);
    app.enableShutdownHooks();
    await app.listen(app.get(ConfigService).get('INDEXER_PORT'));
}
bootstrap();
