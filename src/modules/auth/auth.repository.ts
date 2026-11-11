import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
@Injectable()
export class AuthRepository {
  constructor(private readonly db: PrismaService) {}
  membership(tenantId: string, userId: string) {
    return this.db.membership.findUnique({ where: { tenantId_userId: { tenantId, userId } } });
  }
  async rate(tenantId: string, id: string): Promise<boolean> {
    const windowStart = new Date(Math.floor(Date.now() / 60000) * 60000);
    const result = await this.db.$queryRaw<{ count: number }[]>`
      INSERT INTO rate_limits(id, tenant_id, window_start, count)
      VALUES (${id}, ${tenantId}, ${windowStart}, 1)
      ON CONFLICT(id) DO UPDATE SET
        count = CASE WHEN rate_limits.window_start = EXCLUDED.window_start THEN rate_limits.count + 1 ELSE 1 END,
        window_start = EXCLUDED.window_start
      RETURNING count`;
    return result[0].count <= 120;
  }
}
