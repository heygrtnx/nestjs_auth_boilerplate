import { Module } from '@nestjs/common';
import { MiscService } from './misc.service';
import { MiscController } from './misc.controller';
import { AuthHelper } from 'src/utils';

@Module({
  controllers: [MiscController],
  providers: [MiscService, AuthHelper],
})
export class MiscModule {}
