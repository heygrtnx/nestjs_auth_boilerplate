import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      //log: ['query', 'info', 'warn', 'error'],
      log: ['warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect()
      .then(() => console.log('✅ Connected to DB'))
      .catch((error) =>
        console.error('❌ Error connecting to DB:', error.message),
      );
  }

  async onModuleDestroy() {
    await this.$disconnect()
      .then(() => console.log('✅ Disconnected from DB'))
      .catch((error) =>
        console.error('❌ Error disconnecting from DB:', error.message),
      );
  }
}
