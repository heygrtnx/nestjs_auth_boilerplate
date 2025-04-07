import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthHelper, TokenService } from 'src/utils';
import { JwtModule } from '@nestjs/jwt';
@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, AuthHelper, TokenService],
})
export class AuthModule {}
