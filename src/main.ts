import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import configuration from '../config';
import { AppModule } from './app.module';

import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = configuration();

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: '*',
  });
  app.use(express.urlencoded({ extended: true }));
  const port = config.port ?? 5000;
  console.log('Listening on: ', `http://0.0.0.0:${port}`);
  await app.listen(port);
}
bootstrap();
