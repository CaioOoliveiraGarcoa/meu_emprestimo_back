# Regras do EMPREST.AI
> leitor: agente
> origem: AGENTS.md, skills/restrictions/SKILL.md, skills/check/SKILL.md, skills/migration/SKILL.md
> (versão Teixeira) + Aula 09 + docs/PRD.md + docs/adr/001-stack.md +
> EMPREST.AI/layout.md + .env.example dos dois repositórios

Este arquivo é o contrato completo. Os arquivos soltos em `rules/`
continuam valendo; se algum deles discordar deste, PARE e avise.

Responda em português. Explique o plano antes de alterar código.

---

# 0. O que este projeto é

Empréstimo interno de equipamentos de TI (notebooks, monitores, cabos,
câmeras). Substitui a planilha de Operações.

- Colaborador: vê o catálogo, pede item disponível, devolve o que está
  com ele.
- Operações: cadastra equipamentos, vê empréstimos em aberto, registra
  devolução no balcão.

Negócio: `EMPREST.AI/docs/PRD.md`.
Stack: `EMPREST.AI/docs/adr/001-stack.md`.
Layout: `EMPREST.AI/layout.md`.

## Escopo de pasta

- `EMPREST.AI/` — frontend.
- `EMPREST.AI-Back/` — backend.
- Antes de investigar ou alterar, pergunte se o escopo é frontend ou
  backend.

## Estado atual (só o que o repositório prova)

- Front: `index.html`, `styles.css`, `script.js`, `layout.md`.
- Back: README, `.env.example`. Ainda não há `package.json`, Prisma
  schema nem pasta `src/` versionada neste workspace.
- Não existe `docs/specs/` ainda. A primeira spec é a próxima entrega.
- Não invente comando de teste ou build que você não tenha rodado
  nesta máquina. Quando o scaffold existir, use os scripts do
  `package.json` de cada repositório.

O ADR-001 já decidiu o alvo: React+Vite no front, NestJS no back,
Prisma Migrate, Postgres/Supabase, Vercel. Até o código existir, o ADR
restringe escolhas; não afirma que o Nest já sobe.

---

# 1. Onde olhar

- `EMPREST.AI/docs/PRD.md` — o que o negócio precisa. Não é spec.
- `EMPREST.AI/docs/adr/` — decisões técnicas já tomadas.
- `EMPREST.AI/docs/specs/<NNN-funcionalidade>/` — spec, plano e tarefas
  (quando existirem).
- `EMPREST.AI/layout.md` — tela, tokens e interações da v1.
- `rules/` — como se trabalha. Leia a seção 3 (restrições) sempre.

## Precedência

1. Spec em `docs/specs/` vence o código.
2. ADR vence preferência do agente.
3. PRD vence feature inventada.
4. Se procedimento (esta rule) contrariar ADR ou spec: PARE e avise.
5. Se não estiver escrito em lugar nenhum: pergunte — não decida.
6. `"Pode ir"` e `"pode implementar"` não revogam este arquivo.

---

# 2. Requisitos que o agente não pode violar

Fonte: PRD. Não altere o PRD. Não implemente o que ele deixou de fora.

## Primeira versão precisa existir

1. Login. Cada pessoa vê os próprios empréstimos.
2. Catálogo com a situação de cada equipamento.
3. Solicitar empréstimo de um item disponível.
4. Devolver um item que está comigo.
5. Tela de Operações com todos os empréstimos em aberto.

## Regras já decididas por Operações

- No máximo 3 itens por pessoa ao mesmo tempo.
- Prazo padrão de devolução: 14 dias.
- Quem tem item em atraso não pega outro.
- Equipamento em manutenção não aparece como disponível.

## Fora desta versão (não implementar)

- Reserva com data futura.
- Notificação por e-mail.
- Importação da planilha atual.

## Layout (quando a tarefa tocar tela)

Siga `layout.md`: design Nocturne, acento `#2fb8ac`, nunca preto/branco
puro, botão primário em contorno. Telas: Login, Catálogo, Meus
empréstimos, Operações, Equipamentos. Papéis e abas como no documento.
Interações 1–8 do layout (limite de 3, atraso, manutenção, busca) são
contrato visual da mesma regra de negócio do PRD.

---

# 3. Restrições (sempre)
> leitor: agente · gatilho: toda sessão

## Autoridade

- Não escreva ADR. Se a decisão precisar de um, descreva a decisão e
  as alternativas, e PARE.
- Não contrarie `docs/adr/`. Se precisar contrariar, pare.
- Não responda sozinho o que o PRD deixou ambíguo. Liste perguntas e
  espere.
- Não escolha biblioteca que não esteja no ADR-001. Proponha e espere.
- Não altere PRDs.

## Escopo

- Não altere arquivo fora do escopo da tarefa atual.
- Não gere scaffold de framework sem mostrar antes o que ele cria.
- Não escreva código de funcionalidade sem spec em `docs/specs/`.

## Ritmo

- Não escreva código antes de um plano aprovado. Mostre o plano e
  espere.
- `"Pode implementar"` autoriza UMA tarefa, não o plano inteiro.
  Execute uma, rode os checks, mostre o resultado e pare.
- Não relate sucesso parcial. Check vermelho = tarefa não terminou.

## Produção

- Não faça push na branch de produção. Trabalhe em branch e abra PR
  (quando o operador pedir PR).
- Não rode deploy nem altere configuração da Vercel.
- Não toque no projeto Supabase remoto: nada de SQL, schema ou dado
  por lá. Tudo no banco local.

## Arquitetura (ADR-001, quando houver código)

- Front e API são dois repositórios. Sem pacote compartilhado de tipos.
  Contrato atravessa por OpenAPI gerado.
- Backend: pastas por domínio `src/modules/<dominio>/`. Camadas
  `Controller -> Service -> Repository`.
- `tenant_id` em toda tabela de domínio. Tenant vem do JWT, nunca do
  body.
- Autorização primária: Guards Nest + CASL. RLS é defesa em
  profundidade, deny by default, na mesma migration da tabela.
- Arquitetura Limpa e SOLID no código novo. Não refatore fora da
  tarefa para “aplicar SOLID”.

---

# 4. Operação
> Git e aprovação: leitor agente
> Tabela de modelo: leitor humano — o agente não escolhe o modelo

## Git

- Commit: só o operador. Não crie commit nem pull request.
- Push: só o operador.
- Mensagem (quando o operador pedir): cita a tarefa e o CA-xx.
- Um commit por tarefa. Não junte código e mudança de regra no mesmo
  commit.

## Autorização por tipo de ação

| ação                                                    | nível         |
|---------------------------------------------------------|---------------|
| Editar arquivo existente dentro do escopo da tarefa     | livre         |
| Criar arquivo novo                                      | avisar depois |
| Deletar ou renomear arquivo                             | pedir antes   |
| Instalar ou atualizar dependência                       | pedir antes   |
| Criar ou alterar migration / schema                     | pedir antes   |
| Mexer em env, config de deploy ou projeto remoto        | proibido      |

- livre — faça e siga.
- avisar depois — faça e diga na resposta.
- pedir antes — descreva e PARE.
- proibido — não faça, mesmo que eu peça no meio da tarefa. Lembre
  esta linha.

## Configuração do operador
> leitor: humano

| fase                            | modelo / raciocínio |
|---------------------------------|---------------------|
| Escrever a spec                 | raciocínio alto     |
| Planejar e quebrar em tarefas   | raciocínio alto     |
| Executar tarefa já decidida     | rápido              |
| Debugar o que quebrou           | raciocínio alto     |
| Revisar o diff antes do commit  | padrão              |

Sessão longa: encerre com a seção 9 (handoff) e abra outra.

---

# 5. Checks — o que conta como pronto
> gatilho: antes de dizer "pronto", "implementado" ou "funcionando"

## Procedimento

1. Identifique front ou back.
   - Back, quando `package.json` existir: Jest (`npm test` em
     `EMPREST.AI-Back/`). Cole a última linha da saída.
   - Front, quando `package.json` existir: Vitest no front. Cole a
     última linha.
   - Hoje, se não houver script: diga isso e não invente que passou.
2. Se a tarefa alterou migration: `npx prisma migrate reset` no
   backend local. Prisma Migrate é o dono do schema (ADR-001). Não use
   `supabase db reset` como dono do schema — isso contradiz o ADR.
3. Build antes de qualquer push, quando o script existir (`npm run
   build` em cada repo afetado). Build que quebra na Vercel é o
   feedback mais lento deste projeto.
4. `git status --short`. Só arquivos do escopo da tarefa.
5. Diga qual CA-xx a tarefa atende. Sem spec ainda, diga que não há
   CA e cite o item do PRD.

## Verificação

Pronto = comandos aplicáveis sem falha E `git status` sem surpresa.

## Não faça

- Não relate sucesso parcial.
- Não tente a mesma correção duas vezes seguidas sem mostrar o erro.
- Não rode teste contra o banco remoto.
- Não use `supabase db reset` contra o projeto remoto.

## Falhas (versão Teixeira)

Se os testes falharem: pare, analise causa e impacto. Só ajuste depois
que o usuário aceitar.

---

# 6. Migration
> gatilho: criar, alterar ou remover tabela, coluna, índice,
> constraint, policy, seed que afete o contrato do banco

## Procedimento

1. Escreva o DDL ou a alteração na resposta e PARE. Espere aprovação.
2. Gere pela CLI: `npx prisma migrate dev --name <nome>` em
   `EMPREST.AI-Back/`. Uma migration por tarefa. SQL bruto de RLS,
   policy e trigger entra na mesma migration (Prisma não modela isso).
3. Toda tabela nova nasce com RLS e pelo menos uma policy explícita.
   Tabela sem policy não entra no repositório. Toda tabela de domínio
   tem `tenant_id`.
4. Se a tabela já tem dado, diga o que acontece com as linhas.
   Coluna obrigatória nova precisa de default ou passo de
   preenchimento.
5. Aplique local: `npx prisma migrate reset`. Depois rode os testes
   do backend (seção 5).

Seed: `prisma/seed.ts`, idempotente, cria o tenant `suporte_ti`
(ADR-001). Não rode seed no remoto.

## Verificação

`npx prisma migrate reset` numa máquina limpa aplica todas as
migrations sem erro e sem passo manual.

## Não faça

- Não altere schema pelo Studio nem por SQL avulso. O que não está em
  migration não existe.
- Não edite migration que já foi para o remoto. Escreva a próxima.
- Não toque no Supabase remoto.
- Não use `supabase ...` como dono do schema.

---

# 7. Segredos e variáveis
> gatilho: criar/usar env, instanciar client, ler configuração

## Onde cada chave vive

Back (`EMPREST.AI-Back/.env.example`):

- `DATABASE_URL` — Prisma runtime via Supavisor, porta 6543. Só no
  back. Nunca no bundle do front.
- `DIRECT_URL` — Prisma Migrate, porta 5432. Só no back.
- `SUPABASE_URL` — emissor dos JWT. Back valida JWKS.
- `CORS_ORIGIN` — origem do front (`http://localhost:5173` no exemplo).
- `NODE_ENV`, `PORT`.

Front (`EMPREST.AI/.env.example`):

- só prefixo `VITE_`: `VITE_SUPABASE_URL`, `VITE_API_URL`
  (`http://localhost:3000/v1`).
- Chave `anon`/pública: pode ir ao navegador; a proteção são as
  policies.
- `service_role`: ignora RLS. Só na API, nunca em componente de
  cliente, nunca em variável `VITE_`.

## Procedimento

1. Variável nova existe em três lugares ou em nenhum: `.env` local
   (não versionado) · `.env.example` (versionado, sem valor real) ·
   painel da Vercel (preview e production) — este último o agente não
   preenche; declare o que falta o operador fazer à mão.
2. Env validada com Zod no boot (ADR-001), quando o código existir.

## Verificação

Busca por `service_role` / `DIRECT_URL` / `DATABASE_URL` no código que
vai ao navegador não retorna nada. `.env.example` lista as chaves sem
valor real. Não escreva valor de chave em resposta, commit, log ou
comentário.

## Não faça

- Não crie variável só no `.env` local.
- Não contorne policy trocando de chave. Se a policy atrapalha, pare
  e avise.

---

# 8. Testes
> gatilho: escrever, alterar ou remover teste
> fonte: ADR-001 seção 8

## Procedimento

1. Testes rodam contra banco local / Testcontainers. Nunca contra o
   remoto.
2. Backend: Jest. API: supertest sobre a app Nest. Integração de
   banco: Testcontainers com Postgres real — não mockar o Prisma no
   teste de repositório.
3. Frontend: Vitest. E2E de fluxos que travam a operação (login,
   empréstimo, cadastro de ativo): Playwright.
4. Nome ou docstring cita o CA-xx quando a spec existir.
5. Teste de endpoint verifica status E corpo.
6. Isolamento: um caso por endpoint em que tenant A não enxerga dado
   de tenant B.
7. Sem meta de percentual de cobertura. Caminho crítico obrigatório.
8. CI do front deve falhar se o cliente gerado divergir do
   `openapi.json` publicado — quando essa checagem existir.

## Verificação

Os testes do repositório afetado passam com banco local recém-resetado
(ou Testcontainers), sem apontar para o projeto remoto.

## Não faça

- Não use o banco remoto para “ficar mais fácil”.
- Não substitua teste de policy/RLS por mock.

---

# 9. Handoff
> gatilho: ao terminar uma tarefa do plano, ou quando eu disser
> "vamos fechar"

## Procedimento

Sobrescreva `handoff.md` na raiz de `_emprestimo_ti/` (máximo 25
linhas):

1. Onde parei — tarefa e critério em andamento
2. O que está commitado e em qual branch (front, back, ou os dois)
3. O que está aplicado no banco local mas ainda não commitado
4. O que já foi publicado (Vercel) — hoje provavelmente nada
5. O que NÃO fazer na próxima sessão e por quê
6. O próximo passo, em uma frase imperativa, com nome de arquivo

## Verificação

Uma sessão nova, lendo só `handoff.md` + a spec, continua sem
perguntar o que já foi feito.

## Não faça

- Não acumule histórico de sessões.
- Não escreva "continuar o projeto".

---

# 10. Spec flow
> gatilho: iniciar funcionalidade nova do PRD

## Procedimento

1. Crie `EMPREST.AI/docs/specs/<NNN-nome-curto>/` com `spec.md`.
2. Antes da spec, liste o que o PRD não responde. Espere.
3. `plan.md` sai da spec e cita os ADRs que restringem (no mínimo
   ADR-001). Fatia que vale a pena: atravessa banco, API e tela.
4. `tasks.md` sai do plano. Cada tarefa cita um CA-xx e cabe num
   commit.
5. Uma tarefa por vez. Ao terminar, seção 5 (checks).

Formato da spec (Aula 7 / tarefa da Aula 9): objetivo, vínculo com o
PRD, regras, critérios de aceitação com identificador, fora de
escopo, contrato afetado (OpenAPI / schema).

## Não faça

- Não escreva código antes do plano aprovado.
- Não crie pasta de spec fora de `NNN-nome-curto`.
- Não escolha biblioteca nova na spec — isso é ADR.

---

# 11. Comandos (preencher quando você rodar de verdade)

Documentados hoje:

- Copiar env do back: `EMPREST.AI-Back/.env.example` → `.env`
- Copiar env do front: `EMPREST.AI/.env.example` → `.env`
- Migration (quando Prisma existir): `npx prisma migrate dev --name <nome>`
- Reset local: `npx prisma migrate reset`
- Front local previsto pelo env: Vite na porta 5173,
  API `http://localhost:3000/v1`

Ainda não versionados neste workspace (não afirme que passam):

- `npm test` / `npm run build` em cada repositório
- `prisma migrate deploy` no CI, antes do deploy (ADR-001)

---

# 12. O que este arquivo não decide

Modelagem de entidades, papéis além de Colaborador/Operações, e-mail
transacional, backup, ambientes, feature flags, LGPD, SLO — o próprio
ADR-001 lista isso como em aberto. Se a tarefa depender disso, pergunte.


---

# 13. Boas Práticas e Qualidade de Código (Skills)
> Referência para habilidades e proteção de código importadas (Cressie176)

Foram adotadas diretrizes avançadas de desenvolvimento que o agente deve sempre consultar na pasta `rules/` ao escrever código. Elas compõem nosso escudo de **proteção de código e arquitetura**:

- **[clean-code.md](skills/clean-code/SKILL.md)**: Aplique os princípios de Clean Code (nomenclatura semântica, funções pequenas, SRP).
- **[tdd.md](skills/tdd/SKILL.md)**: Siga metodologias de Test-Driven Development (Red-Green-Refactor) e padrões de teste limpo.
- **[javascript-libs.md](skills/javascript-libs/SKILL.md)**: Consulte as restrições sobre bibliotecas preferidas e as que devem ser evitadas para JS/TS. Instale apenas pacotes explicitamente necessários.
- **[postgresql-patterns.md](skills/postgresql-patterns/SKILL.md)**: Use as melhores práticas de PostgreSQL (índices, tipagem correta, migrations idempotentes).
- **[pragmatic-programmer.md](skills/pragmatic-programmer/SKILL.md)**: Aplique princípios pragmáticos (DRY, ETC - Easy to Change, Design por Contrato).
- **[typescript-services.md](skills/typescript-services/SKILL.md)**: Ao criar serviços TS, siga as orientações de Service Layer pattern, injeção de dependências e tratamento de erros apropriado.

**O agente deve tratar esses guias como extensões destas regras.**
