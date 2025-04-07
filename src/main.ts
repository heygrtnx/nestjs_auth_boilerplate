import * as express from 'express';
import * as moment from 'moment-timezone';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { AllExceptionsFilter } from './utils';
import { CustomLoggerService } from './lib/logger/logger.service';
import { AppModule } from './app/app.module';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as cookieParser from 'cookie-parser';
import { setupSwaggerV1, setupSwaggerV2 } from './lib/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global app prefix
  //app.setGlobalPrefix('v1');

  //set cookies
  app.use(cookieParser());

  // Enables /v1 or /v2 versioning
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // Set the default timezone to Africa/Lagos
  moment.tz.setDefault('Africa/Lagos');

  // Access the underlying Express app and enable trust proxy
  const expressApp = app.getHttpAdapter().getInstance() as express.Application;
  expressApp.set('trust proxy', 1);

  // Get configurations
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const productionUrl = configService.get<string>('PRODUCTION_URL');
  const stagingUrl = configService.get<string>('STAGING_URL');
  const appUrl = configService.get<string>('PLATFORM_URL');
  const logger = app.get(CustomLoggerService);

  // Enable security features
  app.use(helmet());

  // Rate limiting to prevent abuse
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5000, // Limit each IP to 5000 requests per windowMs
  });
  app.use(limiter);

  // CORS settings
  const allowedOrigins = [
    `http://localhost:${port}`,
    `https://${productionUrl}`,
    `https://${stagingUrl}`,
    `https://${appUrl}`,
    'https://admin.eventsandcateringbydebiz.com',
  ];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    optionsSuccessStatus: 200,
    methods: 'GET,PATCH,POST,PUT,DELETE,OPTIONS',
  });

  // JSON body limit
  app.use(express.json({ limit: '10kb' }));

  // Global filters and pipes
  app.useGlobalFilters(new AllExceptionsFilter(logger));
  app.useGlobalPipes(
    new ValidationPipe({
      stopAtFirstError: true,
      transform: true,
      whitelist: false,
    }),
  );

  // Setup Swagger for v1 and v2
  setupSwaggerV1(app);
  setupSwaggerV2(app);

  // Start the server
  try {
    await app.listen(port);
    logger.log(`Server is running at http://localhost:${port}`);
  } catch (err) {
    logger.error('Error starting the server:', err);
  }
}

bootstrap();
