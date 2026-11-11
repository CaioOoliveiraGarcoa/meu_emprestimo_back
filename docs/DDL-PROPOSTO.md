# Alteração de schema proposta

Plano autorizado para implementação local. Schema versionado em prisma/migrations.
Preservar a tabela memberships existente e sua chave única. Novas tabelas:
- tenants(id text PK, nome text); primeiro tenant suporte_ti.
- equipments(id UUID PK, tenant_id text, patrimonio text, nome text,
  categoria enum, situacao enum, image_url text, photo_id integer,
  photo_sha256 text, photographer text, photo_page text, license_url text).
  UNIQUE(tenant_id, patrimonio), UNIQUE(tenant_id, photo_id).
- loans(id UUID PK, tenant_id text, user_id text, equipment_id UUID,
  requested_at timestamptz, due_at timestamptz, returned_at timestamptz NULL).
  FK composta de equipamento+tenant. Índice único parcial para item aberto.
- audit_events(id UUID PK, tenant_id, user_id, action, resource_id, created_at).
  Sem atualização/exclusão por usuários da aplicação.
- rate_limits(id text PK, tenant_id, window_start timestamptz, count integer).
Toda tabela tem RLS habilitada e policies explícitas deny by default.
O schema recebido só tem memberships e não traz migrations. Migration inicial
pressupõe banco novo; projeto já existente exige baseline analisado pelo operador,
sem reset e sem sobrescrever linhas. Não executar reset remoto.
