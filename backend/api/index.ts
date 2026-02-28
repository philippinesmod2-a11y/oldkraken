import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';

const server = express();
let app: any;

async function bootstrap() {
  if (!app) {
    const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(server));

    nestApp.use(cookieParser());

    const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
      .split(',')
      .map(o => o.trim());
    nestApp.enableCors({
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'Accept-Language'],
    });

    nestApp.setGlobalPrefix('api');

    nestApp.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    nestApp.getHttpAdapter().get('/health', (req: any, res: any) => {
      res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString(), service: 'OldKraken API' });
    });

    await nestApp.init();
    app = nestApp;
  }
  return server;
}

export default async (req: any, res: any) => {
  const instance = await bootstrap();
  instance(req, res);
};
