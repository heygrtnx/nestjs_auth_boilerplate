import { Global, Module } from '@nestjs/common';
import { PaystackService } from './paystack.service';
import { HttpModule } from '@nestjs/axios';

@Global()
@Module({
  imports: [HttpModule],
  providers: [PaystackService],
  exports: [PaystackService],
})
export class PaystackModule {}
