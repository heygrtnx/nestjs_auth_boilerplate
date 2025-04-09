import { Module, Global } from '@nestjs/common';
import { MonoService } from './mono.service';
import { HttpModule } from '@nestjs/axios';

@Global()
@Module({
  imports: [HttpModule],
  providers: [MonoService],
  exports: [MonoService],
})
export class MonoModule {}
