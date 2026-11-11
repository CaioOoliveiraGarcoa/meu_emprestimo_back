import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { equipmentSelect } from './catalog.dto';
@Injectable()
export class CatalogRepository {
  constructor(private readonly db: PrismaService) {}
  list(tenantId: string, limit: number, cursor?: string) {
    return this.db.equipment.findMany({
      where: { tenantId, ...(cursor ? { patrimonio: { gt: cursor } } : {}) },
      orderBy: { patrimonio: 'asc' }, take: limit + 1, select: equipmentSelect,
    });
  }
}
