import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
export const equipmentSchema = z.object({
  id: z.string().uuid(), patrimonio: z.string(), nome: z.string(),
  categoria: z.enum(['notebook', 'monitor', 'cabo', 'camera']),
  situacao: z.enum(['disponivel', 'manutencao', 'emprestado']),
  imageUrl: z.string().url(), photographer: z.string(), photoPage: z.string().url(), licenseUrl: z.string().url(),
});
export const pageSchema = z.object({ items: z.array(equipmentSchema), nextCursor: z.string().nullable() });
export const querySchema = z.object({
  cursor: z.string().regex(/^TI-\d{4}$/).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
}).strict();
export class EquipmentPageDto extends createZodDto(pageSchema) {}
export class CatalogQueryDto extends createZodDto(querySchema) {}
export const equipmentSelect = { id: true, patrimonio: true, nome: true, categoria: true, situacao: true,
  imageUrl: true, photographer: true, photoPage: true, licenseUrl: true } as const;
