import {
  DocumentBuilder,
  SwaggerModule,
  SwaggerCustomOptions,
} from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const setupSwaggerV1 = (app: INestApplication) => {
  const configService = app.get(ConfigService);
  const platform = configService.get('PLATFORM_NAME');
  const port = configService.get('PORT');
  const productionUrl = configService.get('PRODUCTION_URL');
  const stagingUrl = configService.get('STAGING_URL');

  const swaggerOptions = new DocumentBuilder()
    .setTitle(`${platform} API V1`)
    .setDescription(`API Documentation for ${platform} API V1`)
    .setVersion('1.0.0')
    .addServer(`http://localhost:${port}`, 'Local environment')
    .addServer(`https://${productionUrl}`, 'Production environment')
    .addServer(`https://${stagingUrl}`, 'Staging environment')
    /*.addBearerAuth(
      { type: 'http', scheme: 'Bearer', bearerFormat: 'JWT' },
      'Authorization',
    )
    .addCookieAuth('accessToken')*/
    .addTag('Server', 'Endpoint for Server functions')
    .addTag('Admin', 'Endpoint for Admin functions')
    .addTag('Misc', 'Endpoint for Misc functions')
    .addTag('Authentication', 'Endpoint for Authentication functions')
    .addTag('User', 'Endpoint for User functions')
    .build();

  const swaggerDocumentV1 = SwaggerModule.createDocument(app, swaggerOptions, {
    extraModels: [],
    deepScanRoutes: true, // Ensures all controllers are scanned
  });

  // Remove non-V1 endpoints manually
  swaggerDocumentV1.paths = Object.keys(swaggerDocumentV1.paths)
    .filter((path) => !path.startsWith('/v2')) // Exclude all v2 endpoints
    .reduce((obj, key) => {
      obj[key] = swaggerDocumentV1.paths[key];
      return obj;
    }, {});

  // Setup Swagger at /docs
  const customOptions: SwaggerCustomOptions = {
    customSiteTitle: `${platform} API V1`,
    swaggerOptions: {
      explorer: false,
      defaultModelsExpandDepth: -1,
      docExpansion: 'list',
      defaultModelRendering: 'model',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      displayRequestDuration: true,
      jsonEditor: true,
      useUnsafeSource: true,
      deepLinking: true,
    },
    customCss: '.swagger-ui .topbar { display: none; }',
  };

  SwaggerModule.setup('v1/docs', app, swaggerDocumentV1, customOptions);
};
