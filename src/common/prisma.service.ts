import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CONFIG, Config } from '../config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(@Inject(CONFIG) config: Config) {
    super({ datasourceUrl: config.DATABASE_URL });
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
