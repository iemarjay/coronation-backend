import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import configuration from '../config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = configuration();

  app.useGlobalPipes(new ValidationPipe());
  const port = config.port ?? 5000;
  console.log('Listening on: ', `http://0.0.0.0:${port}`);
  await app.listen(port);
}
bootstrap();
