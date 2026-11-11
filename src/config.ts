import { z } from 'zod';
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  CORS_ORIGIN: z.string().min(1),
  SENTRY_DSN: z.string().url().optional().or(z.literal('')),
});
export type Config = z.infer<typeof envSchema>;
export const CONFIG = Symbol('CONFIG');
export function readConfig(): Config {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    // Nunca incluir os valores de env na mensagem de falha.
    throw new Error(`Configuração inválida: ${result.error.issues.map(i => i.path.join('.')).join(', ')}`);
  }
  return result.data;
}
