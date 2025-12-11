import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggerInterceptor } from './common/interceptors/logger.interceptor';
import { PrismaExceptionInterceptor } from './common/interceptors/prisma-exception.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  app.useGlobalInterceptors(
    new LoggerInterceptor(),
    new PrismaExceptionInterceptor(),
  );

  const config = new DocumentBuilder()
    .setTitle('NestJS Practice')
    .setDescription('The NestJS Practice API description')
    .setVersion('1.0')
    .addGlobalResponse({
      status: 500,
      description: 'Internal server error',
    })
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port');
  if (!port) {
    throw new Error('PORT is not defined');
  }
  await app.listen(port);
}
bootstrap();
