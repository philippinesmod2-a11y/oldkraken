import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet.default());
  app.use(compression());
  app.use(cookieParser());

  // CORS
  const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map(o => o.trim());
  // Also allow common dev ports
  if (!allowedOrigins.includes('http://localhost:3001')) allowedOrigins.push('http://localhost:3001');
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'Accept-Language'],
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('OldKraken API')
      .setDescription('OldKraken Exchange API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Health check endpoint (no prefix)
  app.getHttpAdapter().get('/health', (req: any, res: any) => {
    res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString(), service: 'OldKraken API' });
  });

  const port = process.env.BACKEND_PORT || 4000;
  await app.listen(port);
  console.log(`🐙 OldKraken API running on port ${port}`);
}

bootstrap();
