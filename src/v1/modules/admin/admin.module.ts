import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AuthHelper, TokenService } from 'src/utils';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AdminController],
  providers: [AdminService, AuthHelper, TokenService],
})
export class AdminModule {}
