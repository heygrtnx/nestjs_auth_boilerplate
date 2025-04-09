import { Global, Module } from '@nestjs/common';
import { PremblyService } from './prembly.service';
import { HttpModule } from '@nestjs/axios';

@Global()
@Module({
  imports: [HttpModule],
  providers: [PremblyService],
  exports: [PremblyService],
})
export class PremblyModule {}
