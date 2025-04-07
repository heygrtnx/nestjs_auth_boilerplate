import { Global, Module } from '@nestjs/common';
import { WebPushService } from './web-push.service';

@Global()
@Module({
  providers: [WebPushService],
  exports: [WebPushService],
})
export class WebPushModule {}
