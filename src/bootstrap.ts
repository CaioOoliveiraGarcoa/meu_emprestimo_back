import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { ZodValidationPipe, patchNestJsSwagger } from 'nestjs-zod';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { CONFIG, Config } from './config';
import { ProblemFilter } from './common/problem';
export function configureApp(app: INestApplication, config: Config) {
  app.setGlobalPrefix('v1');
  app.use(helmet());
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Request-Id', randomUUID());
    next();
  });
  app.enableCors({ origin: config.CORS_ORIGIN.split(',').map(x => x.trim()), credentials: true });
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new ProblemFilter());
}
export function openApi(app: INestApplication) {
  patchNestJsSwagger();
  return SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('EMPREST.AI').setVersion('1.0.0').addBearerAuth().build());
}
export async function createApp() {
  if (process.env.SENTRY_DSN) Sentry.init({ dsn: process.env.SENTRY_DSN, sendDefaultPii: false });
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  configureApp(app, app.get<Config>(CONFIG));
  const document = openApi(app);
  app.getHttpAdapter().get('/openapi.json', (_req: Request, res: Response) => res.json(document));
  await app.init();
  return app;
}
