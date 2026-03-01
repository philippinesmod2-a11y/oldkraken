import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

const server = express();
let cachedApp: any;

async function bootstrap(): Promise<express.Express> {
  if (cachedApp) return server;

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), { logger: ['error', 'warn'] });

  app.use(cookieParser());

  const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map(o => o.trim());
  app.enableCors({
    origin: (origin: string | undefined, cb: Function) => {
      if (!origin || allowedOrigins.some(o => origin.startsWith(o)) || origin.includes('vercel.app')) {
        cb(null, true);
      } else {
        cb(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'Accept-Language'],
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.getHttpAdapter().get('/health', (req: any, res: any) => {
    res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString(), service: 'OldKraken API' });
  });

  await app.init();
  cachedApp = app;
  return server;
}

export default async function handler(req: any, res: any) {
  const app = await bootstrap();
  app(req, res);
}
