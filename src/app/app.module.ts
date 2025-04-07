import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

//app
import { AppController } from './app.controller';
import { AppService } from './app.service';

//config
import { CustomLoggerService } from 'src/lib/logger/logger.service';

//library modules
import { LibModule } from 'src/lib/lib.module';

//module [Version 1]
import { v1Module } from 'src/v1/v1.module';

//commons
import { JwtStrategy } from 'src/utils';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LibModule,
    v1Module,
  ],
  controllers: [AppController],
  providers: [AppService, CustomLoggerService, JwtStrategy],
})
export class AppModule {}
