import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { QoreIDService } from './qoreid.service';

@Global()
@Module({
  imports: [HttpModule],
  providers: [QoreIDService],
  exports: [QoreIDService],
})
export class QoreIDModule {}
