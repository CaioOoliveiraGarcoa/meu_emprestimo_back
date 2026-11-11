import type { Category, EquipmentStatus, PrismaClient } from '@prisma/client';

export const TENANT = 'suporte_ti';
export const PROFESSOR_EMAIL = 'marcelo.grilo@institutojef.org.br';

export interface InventoryRow {
  patrimonio: string; nome: string; categoria: Category; situacao: EquipmentStatus;
}
export interface Photo {
  patrimonio: string; photoId: number; sha256: string; photographer: string; photoPage: string;
  licenseUrl: string; path: string; bytes: Buffer;
}
export const images = require('../skills/imagens-equipamentos/scripts/manifest.cjs') as {
  inventory: InventoryRow[];
  readApproved: (file: string) => Photo[];
  sha256: (bytes: Buffer) => string;
};

export async function seedTenant(db: PrismaClient) {
  return db.tenant.upsert({ where: { id: TENANT }, update: {}, create: { id: TENANT, name: 'Suporte TI' } });
}

export async function seedInventory(db: PrismaClient, photos: Map<string, Photo & { imageUrl: string }>,
    professorId: string, testId: string) {
  if (professorId === testId) throw new Error('Professor e teste precisam de contas distintas.');
  await db.$transaction(async tx => {
    await tx.tenant.upsert({ where: { id: TENANT }, update: {}, create: { id: TENANT, name: 'Suporte TI' } });
    for (const userId of [professorId, testId]) {
      const membership = await tx.membership.upsert({ where: { tenantId_userId: { tenantId: TENANT, userId } },
        update: {}, create: { tenantId: TENANT, userId, role: 'COLABORADOR' } });
      if (membership.role !== 'COLABORADOR') throw new Error('A conta de correção ou teste tem outro papel.');
    }
    if (await tx.loan.count({ where: { tenantId: TENANT, userId: professorId } }))
      throw new Error('A conta de correção já tem histórico de empréstimo. Nenhum dado foi removido.');

    for (const item of images.inventory) {
      const photo = photos.get(item.patrimonio);
      if (!photo) throw new Error('Imagem ausente no manifesto.');
      const fields = { nome: item.nome, categoria: item.categoria, imageUrl: photo.imageUrl, photoId: photo.photoId,
        photoSha256: photo.sha256, photographer: photo.photographer, photoPage: photo.photoPage, licenseUrl: photo.licenseUrl };
      const key = { tenantId: TENANT, patrimonio: item.patrimonio };
      await tx.equipment.upsert({
        where: { tenantId_patrimonio: key }, update: fields, create: { ...key, ...fields, situacao: item.situacao },
      });
      // PostgreSQL reavalia o filtro depois de obter o lock de linha em caso de concorrência.
      await tx.equipment.updateMany({ where: { ...key, situacao: { not: 'emprestado' } },
        data: { situacao: item.situacao } });
    }
  }, { timeout: 25000 });
}
