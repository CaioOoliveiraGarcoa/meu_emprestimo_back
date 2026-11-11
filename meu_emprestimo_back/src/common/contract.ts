import { applyDecorators } from '@nestjs/common';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';
import { zodToOpenAPI } from 'nestjs-zod';
import { z } from 'zod';

const problem = z.object({
  type: z.string(), title: z.string(), status: z.number().int(),
  detail: z.string(), code: z.string(), instance: z.string(),
});

export function ApiPageQuery(query: z.AnyZodObject) {
  return applyDecorators(...Object.entries<z.ZodTypeAny>(query.shape).map(([name, type]) =>
    ApiQuery({ name, required: false, schema: zodToOpenAPI(type) }),
  ));
}

export function ApiProblems(...statuses: number[]) {
  return applyDecorators(...statuses.map(status => ApiResponse({
    status, description: 'Detalhes da recusa',
    content: { 'application/problem+json': { schema: zodToOpenAPI(problem) } },
  })));
}
