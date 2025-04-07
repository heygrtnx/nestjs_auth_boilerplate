import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AuthHelper } from 'src/utils';

@Module({
  controllers: [UserController],
  providers: [UserService, AuthHelper],
})
export class UserModule {}
