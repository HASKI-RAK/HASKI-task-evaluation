import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { AppModule } from './app/app.module.js';
import { HttpExceptionFilter } from './common/http-exception.filter.js';
import { cookiesInsecure } from './config/cookies.js';
import { resolveCorsOrigins } from './config/cors.js';
import { WebSocketCookieAdapter } from './utils/websocket-cookie.adapter.js';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

  // Use our custom WebSocketCookieAdapter
  app.useWebSocketAdapter(new WebSocketCookieAdapter(app));

  // The frontend container proxies to the backend, so the client address only survives
  // if Express is told to trust it. Login throttling and audit fields depend on it.
  app.set('trust proxy', 1);

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const allowedOrigins = resolveCorsOrigins();

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Origin',
      'X-Requested-With',
      'Accept',
      'If-Match',
      'X-CSRF-Token',
    ],
    exposedHeaders: ['ETag'],
  });

  if (cookiesInsecure()) {
    logger.warn(
      'COOKIE_INSECURE is set: cookies are issued without the Secure attribute. Use this for local HTTP only.',
    );
  }

  const port = Number(process.env.PORT ?? 5000);
  await app.listen(port);
  logger.log(
    `NestJS server running on port ${port} with CORS enabled for origins: ${allowedOrigins.join(', ')}`,
  );
}
void bootstrap();
