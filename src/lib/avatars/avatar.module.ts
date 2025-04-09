import { Global, Module } from '@nestjs/common';
import { AvatarService } from './avatar.service';
import { HttpModule } from '@nestjs/axios';

@Global()
@Module({
  imports: [HttpModule],
  providers: [AvatarService],
  exports: [AvatarService],
})
export class AvatarModule {}
