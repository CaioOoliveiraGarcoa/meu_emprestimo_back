# Revisão independente

O agente customizado `verificador` fica em `.codex/agents/` no backend. Abra o
Codex a partir de uma cópia limpa, com os dois repositórios lado a lado, sem
`.env`, MCPs com acesso externo ou credenciais de produção na sessão. O perfil
usa `sandbox_mode = "read-only"`. A tarefa do verificador é leitura de arquivos
e resultados locais. O agente principal aplica correções e pede nova rodada.

Para comparar rodadas, execute `npm run verify:snapshot` no backend e informe
o SHA-256, a spec, as saídas dos testes e a árvore do frontend. Peça a tabela
`CA | situação | evidência`, inclusive para itens pendentes. Guarde o parecer
em `verificacao.json`, preservando as evidências e o fingerprint daquela árvore.

A conclusão passa por `npm run verify:gate`. O CI repete esse portão na tag
`entrega-pratica`. Para isso, o operador configura `FRONT_REPOSITORY` com
`dono/repo`. Se o front for privado, usa um token somente de leitura no secret
`FRONT_READ_TOKEN`. O portão falha quando há critério pendente/reprovado,
evidência ausente ou mudança na árvore revisada.

## Prova com erro plantado

Em branch descartável do backend, troque `MAX_OPEN_LOANS = 3` por 5 em
`src/modules/loans/policy.ts`, registre o commit e rode
`npm test -- --testPathPattern=policy.spec.ts`. O CA-E03 deve reprovar.
Desfaça a alteração, registre o segundo commit e rode de novo. Guarde os
dois hashes e as duas saídas em `ENTREGA.md`. O agente não faz commits.
