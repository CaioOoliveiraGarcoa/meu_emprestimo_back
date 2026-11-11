import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { equipmentSchema, equipmentSelect } from '../catalog/catalog.dto';
export const requestLoanSchema = z.object({ equipamentoId: z.string().uuid() }).strict();
export class RequestLoanDto extends createZodDto(requestLoanSchema) {}
export const loanSchema = z.object({
  id: z.string().uuid(), requestedAt: z.string().datetime(), dueAt: z.string().datetime(),
  equipment: equipmentSchema,
});
export class LoanDto extends createZodDto(loanSchema) {}
export class LoanPageDto extends createZodDto(z.object({ items: z.array(loanSchema), nextCursor: z.string().nullable() })) {}
export const loanQuerySchema = z.object({
  cursor: z.string().uuid().optional(), limit: z.coerce.number().int().min(1).max(100).default(50),
}).strict();
export class LoanQueryDto extends createZodDto(loanQuerySchema) {}
export const loanSelect = { id: true, requestedAt: true, dueAt: true, equipment: { select: equipmentSelect } } as const;
