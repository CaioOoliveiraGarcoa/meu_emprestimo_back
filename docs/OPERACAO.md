# Configurar e publicar

Execute os comandos na sua máquina. O ZIP contém código, contrato e migration.
Os links de produção e as provas em produção precisam ser preenchidos depois da publicação.

## 1. Instalar e preparar o Supabase

Em cada repositório, rode `npm ci` e copie `.env.example` para `.env`.
No backend, preencha `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `DATABASE_URL`
e `DIRECT_URL`. Use a conexão transaction pooler na porta 6543 para runtime,
com `pgbouncer=true&connection_limit=1`. Para migration, use a conexão direta
ou session pooler na porta 5432. Consulte **Connect** no painel do Supabase.

No Auth do Supabase, desative cadastro público, habilite login por e-mail e senha
e verifique uma chave de assinatura assimétrica ativa (ES256 ou RS256) no JWKS.
Na migração de uma configuração antiga, siga o procedimento do painel de Auth.
O backend valida assinatura, emissor, audience, expiração, tenant assinado
e membership. A chave pública do Supabase é a única chave usada pelo frontend.

Em banco novo, execute a migration na sua máquina com `npx prisma migrate deploy`,
ou dispare o workflow manual de migração, com os secrets configurados.
Se já existir schema da aplicação no banco, confira as migrations e compare
as tabelas antes de aplicar. A migration deste ZIP é inicial. Use um banco
vazio para o projeto da prática ou faça um baseline verificado. Nunca resete
um banco de produção.

## 2. Preparar as 12 fotos

Obtenha a chave gratuita no [Pexels](https://www.pexels.com/api/) e preencha
`PEXELS_API_KEY` no `.env` local do backend.

```powershell
npm run images:search
```

Os candidatos são listados em `images-work/buscas/`. Abra os previews e crie
`images-work/selecao.json` com um ID diferente para cada um dos 12 patrimônios.
Se precisar de mais opções, use `npm run images:search -- TI-0008 2`,
substituindo patrimônio e página conforme necessário.

```powershell
npm run images:prepare
```

Abra os JPEGs de `images-work/preparadas/`. Reprove imagens com pessoa, texto,
marca ou logo legível, tela com conteúdo ou item incorreto. Registre o motivo
em `images-work/rascunho.json`, na lista `rejected` com patrimônio, ID e motivo.
Troque os IDs reprovados, prepare de novo e revise o arquivo final de cada item.
Preencha em cada revisão `approved: true`, `reviewer` e `reviewedAt` em ISO.
Rode `npm run images:validate` para validar e emitir `images-work/manifest.json`.

## 3. Carregar imagens, contas e catálogo

No terminal do operador, preencha `SUPABASE_SERVICE_ROLE_KEY`, `PROFESSOR_PASSWORD`
com a senha padrão fornecida na aula, `TEST_USER_EMAIL` com seu e-mail separado
e `TEST_USER_PASSWORD` com outra senha. Mantenha esses valores fora do git e
da Vercel. Execute:

```powershell
npm run operator:upload
npm run operator:accounts
```

Copie os dois IDs retornados para `PROFESSOR_USER_ID` e `TEST_USER_ID` no
`.env` do backend. Se uma conta já existir, o script preserva sua senha.
Se a senha do professor já cadastrada divergir da senha da turma, corrija-a no
painel Auth e confirme acesso no momento da conferência.

```powershell
npm run seed -- --inventario
npm run seed -- --inventario
```

A carga confere as URLs públicas contra os hashes antes de escrever. O seed
repetido preserva os itens emprestados e o histórico. Confira 12 objetos públicos,
12 equipamentos, 3 em manutenção e zero empréstimos para a conta do professor.

## 4. Publicar e conferir

1. Suba os dois repositórios no seu GitHub. Importe cada um em um projeto
   Vercel separado. No back, configure a versão Node do projeto e as
   variáveis de runtime da API, incluindo o `CORS_ORIGIN` com a URL exata
   do frontend. Deixe as credenciais de provisionamento no terminal do operador.
2. No front, configure `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
   e `VITE_API_URL=https://<backend>.vercel.app/v1`. Faça novo deploy após
   qualquer mudança de variáveis do frontend.
3. Abra `/v1/health` no backend e o site no frontend. Use a conta de teste
   para conferir login, 12 imagens, três itens em manutenção, solicitação,
   vencimento, item indisponível e recusa no limite. Use a conta de correção
   exclusivamente para confirmar acesso e zero empréstimos.
4. Preencha os links e a evidência em `ENTREGA.md` e atualize o parecer do
   verificador. Registre o erro plantado e a reversão em commits de uma branch
   de evidência, conforme [VERIFICADOR.md](evidencias/VERIFICADOR.md).
5. Quando `npm run verify:gate` aprovar os dois projetos, marque os commits
   conferidos com a tag `entrega-pratica` nos dois repositórios. Envie a tag do
   frontend antes da tag do backend, pois o CI do backend confere as duas juntas.
