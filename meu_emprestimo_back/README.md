# EMPREST.AI-Back

## Configuração local

Copie `.env.example` para `.env` e preencha as variáveis do backend. As URLs
`DATABASE_URL` e `DIRECT_URL` ficam somente neste projeto: nunca devem ser
levadas para o bundle do frontend.

- `DATABASE_URL`: conexão de runtime do Prisma via Supavisor, na porta 6543.
- `DIRECT_URL`: conexão direta usada pelo Prisma Migrate, na porta 5432.
- `SUPABASE_URL`: projeto Supabase usado para validar o emissor dos tokens.
- `CORS_ORIGIN`: origem do frontend permitida pela API.

O frontend mantém sua própria configuração em `EMPREST.AI/.env`, limitada a
variáveis prefixadas com `VITE_`.
