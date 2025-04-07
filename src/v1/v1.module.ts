import { Module } from '@nestjs/common';
import { MiscModule } from './modules/misc/misc.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
@Module({
  imports: [MiscModule, AdminModule, AuthModule, UserModule],
})
export class v1Module {}
