import { Global, Module } from '@nestjs/common';
import { CrcService } from './crc.service';
import { HttpModule } from '@nestjs/axios';

@Global()
@Module({
  imports: [HttpModule],
  providers: [CrcService],
  exports: [CrcService],
})
export class CrcModule {}
