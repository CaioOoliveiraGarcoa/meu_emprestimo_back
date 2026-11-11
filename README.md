# EMPREST.AI · API

API REST NestJS com autenticação Supabase, catálogo e solicitação de empréstimo.

```powershell
npm ci
Copy-Item .env.example .env
npm run prisma:generate
npm test
npm run test:images
npm run test:integration
npm run build
npm run start:dev
```

Configure o ambiente antes de iniciar. A integração usa PostgreSQL real via
Testcontainers por padrão. Para usar um PostgreSQL local dedicado, defina
`TEST_DATABASE_URL` com endereço de loopback e uma conta que possa criar
schema e role. O teste usa schema isolado e remove esse schema ao terminar.

- Saúde da aplicação em `/v1/health`.
- Contrato em `/openapi.json`. Gere outra vez com `npm run openapi`.
- [Configuração e publicação](docs/OPERACAO.md)
- [Entrega da prática](ENTREGA.md)
