import {
  DocumentBuilder,
  SwaggerModule,
  SwaggerCustomOptions,
} from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const setupSwaggerV2 = (app: INestApplication) => {
  const configService = app.get(ConfigService);
  const platform = configService.get('PLATFORM_NAME');
  const port = configService.get('PORT');
  const productionUrl = configService.get('PRODUCTION_URL');
  const stagingUrl = configService.get('STAGING_URL');

  const swaggerOptions = new DocumentBuilder()
    .setTitle(`${platform} API V2`)
    .setDescription(`API Documentation for ${platform} API V2`)
    .setVersion('2.0.0')
    .addServer(`http://localhost:${port}`, 'Local environment')
    .addServer(`https://${productionUrl}`, 'Production environment')
    .addServer(`https://${stagingUrl}`, 'Staging environment')
    .addBearerAuth(
      { type: 'http', scheme: 'Bearer', bearerFormat: 'JWT' },
      'Authorization',
    )
    .addTag('Server', 'Endpoint for Server functions')
    .build();

  const swaggerDocumentV2 = SwaggerModule.createDocument(app, swaggerOptions, {
    extraModels: [],
    deepScanRoutes: true, // Ensures all controllers are scanned
  });

  // Remove non-V1 endpoints manually
  swaggerDocumentV2.paths = Object.keys(swaggerDocumentV2.paths)
    .filter((path) => !path.startsWith('/v1')) // Exclude all v1 endpoints
    .reduce((obj, key) => {
      obj[key] = swaggerDocumentV2.paths[key];
      return obj;
    }, {});

  // Setup Swagger at /docs
  const customOptions: SwaggerCustomOptions = {
    customSiteTitle: `${platform} API V2`,
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

  SwaggerModule.setup('v2/docs', app, swaggerDocumentV2, customOptions);
};
