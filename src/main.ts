import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { VersioningType, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
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

  // Makes .env available
  const configService = app.get(ConfigService);

  // // Get global prefix from .env
  const globalPrefix: string = configService.get('LQS_GLOBAL_PREFIX');

  // Get port number from .env file
  const port: number = configService.get('LQS_PORT');

  // Versioning system
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // Set global prefix
  app.setGlobalPrefix(globalPrefix);

  // Enable validation pipeline globally
  app.useGlobalPipes(new ValidationPipe());

  // Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Polkawatch Live Query Sever')
    .setDescription('Nestjs api for Polkawatch elastic indexer')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(globalPrefix, app, document);

  await app.listen(port);
}
bootstrap();
