# Mudança de schema

> leitor: agente

## Quando

Qualquer tarefa que precise criar, alterar ou remover tabela, coluna,
índice, constraint, política de acesso ou seed que afete o contrato do
banco — inclusive quando a mudança parecer trivial.

## Procedimento

1. Antes de gerar qualquer coisa: escreva o DDL ou a alteração
   pretendida na resposta e PARE. Eu aprovo ou corrijo.
2. Gere a migration pela CLI do projeto: `npx prisma migrate dev --name
<nome>`. Uma migration por tarefa. Se a mudança exigir SQL bruto para
   RLS ou policies, mantenha esse SQL dentro da mesma migration.
3. Toda tabela nova nasce com Row Level Security habilitado e pelo
   menos uma policy explícita na mesma migration. Tabela sem policy não
   entra no repositório.
4. Se a tabela já tem dado, diga o que acontece com as linhas
   existentes. Coluna obrigatória nova precisa de default ou de um passo
   de preenchimento.
5. Aplique localmente com `npx prisma migrate reset` e rode
   `<COMANDO-TESTES>`.

## Verificação

`npx prisma migrate reset` numa máquina limpa aplica todas as migrations
sem erro e sem nenhum passo manual.

## Não faça

- Não altere schema pelo Studio nem por SQL avulso fora do fluxo de
  migration. O que não está em migration não existe.
- Não edite migration que já foi para o repositório remoto. Escreva a
  próxima.
- Não toque no projeto Supabase remoto. Tudo acontece no local.
- Não use `supabase ...` como dono do schema do projeto; o Prisma Migrate
  é o dono único do schema conforme o ADR.
