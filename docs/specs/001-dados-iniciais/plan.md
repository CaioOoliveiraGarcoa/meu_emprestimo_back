# Plano — Dados iniciais

Base: ADR-001, PRD e decisões registradas na spec. Aprovação de implementação local registrada em docs/APROVACAO.md.
1. Conferir ambiguidades e aprovação das decisões/DDL antes de fechar o SDD.
2. Preparar migrations Prisma e scripts locais sem segredos.
3. Implementar a fatia no back, com Controller → Service → Repository.
4. Gerar OpenAPI e integrar o front por cliente gerado.
5. Testar unidades, API, transações/isolamento em PostgreSQL local e UI.
6. Encaminhar arquivos e evidências ao verificador com contexto limpo.
7. Principal corrige os achados; verificador apenas reavalia.
8. Operador faz commits, execução remota, conferência de produção e tag.
