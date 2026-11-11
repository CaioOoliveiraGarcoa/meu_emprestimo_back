import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { Identity } from '../../common/context';
import { Problem } from '../../common/problem';
import { checkBorrowingPolicy, dueDate } from './policy';
import { loanSelect } from './loans.dto';
@Injectable()
export class LoansRepository {
  constructor(private readonly db: PrismaService) {}
  list(identity: Identity, limit: number, cursor?: string) {
    return this.db.loan.findMany({ where: { tenantId: identity.tenantId, userId: identity.userId,
      returnedAt: null, ...(cursor ? { id: { gt: cursor } } : {}) },
      orderBy: { id: 'asc' }, take: limit + 1, select: loanSelect });
  }
  async request(identity: Identity, equipmentId: string) {
    return this.db.$transaction(async tx => {
      // Ordem fixa: pessoa primeiro, equipamento depois. Dois itens distintos
      // ainda disputam a mesma linha de pessoa antes de contar os empréstimos.
      const members = await tx.$queryRaw<{ role: string }[]>`
        SELECT role FROM memberships WHERE tenant_id = ${identity.tenantId}
        AND user_id = ${identity.userId} FOR UPDATE`;
      if (!members.length || !['COLABORADOR', 'OPERACOES'].includes(members[0].role))
        throw new Problem(403, 'ACCESS_DENIED', 'Vínculo não autorizado.');
      const equipment = await tx.$queryRaw<{ id: string; situacao: string }[]>`
        SELECT id, situacao FROM equipments WHERE tenant_id = ${identity.tenantId}
        AND id = ${equipmentId}::uuid FOR UPDATE`;
      if (!equipment.length) throw new Problem(404, 'NOT_FOUND', 'Equipamento não encontrado.');
      const open = await tx.loan.findMany({ where: { tenantId: identity.tenantId,
        userId: identity.userId, returnedAt: null }, select: { dueAt: true } });
      const now = new Date();
      checkBorrowingPolicy(open, equipment[0].situacao, now);
      await tx.equipment.update({ where: { id: equipmentId }, data: { situacao: 'emprestado' } });
      const loan = await tx.loan.create({ data: { tenantId: identity.tenantId, userId: identity.userId,
        equipmentId, requestedAt: now, dueAt: dueDate(now) }, select: loanSelect });
      await tx.auditEvent.create({ data: { tenantId: identity.tenantId, userId: identity.userId,
        action: 'loan.requested', resourceId: loan.id } });
      return loan;
    }, { isolationLevel: 'ReadCommitted', maxWait: 10000, timeout: 15000 });
  }
}
