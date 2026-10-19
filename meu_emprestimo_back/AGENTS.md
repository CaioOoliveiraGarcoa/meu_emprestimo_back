# Instruções do projeto

## Escopo

- `EMPREST.AI/` contém o frontend.
- `EMPREST.AI-Back/` contém o backend.
- Antes de investigar ou alterar arquivos, pergunte ao usuário se o escopo é frontend ou backend.

## Processo de trabalho

- Explique o plano antes de fazer alterações.
- Responda em português.
- Não crie commits nem pull requests; deixe essas ações para o usuário.
- Ao concluir uma alteração, execute os testes como verificação obrigatória.
- Se os testes falharem, pare, analise o problema e explique a causa e o impacto. Só faça ajustes depois que o usuário aceitar.
- Quando a tarefa afetar a verificação final, siga o checklist de `rules/check.md`.
- Quando a tarefa afetar schema ou migration, siga o procedimento de `rules/migration.md`.

## Arquitetura e código

- Use Arquitetura Limpa.
- Siga os princípios SOLID.

## Referências do projeto

- Contrato completo em `rules/regras.md` (Aula 09 + versão Teixeira +
  PRD, ADR-001 e layout). Leia esse arquivo. Ele prevalece se um
  arquivo solto em `rules/` estiver incompleto.
- Consulte `EMPREST.AI/docs/PRD.md` para os requisitos do produto.
- Consulte `EMPREST.AI/docs/adr/001-stack.md` para as decisões de arquitetura, stack, testes, operação e segurança.
- Consulte `EMPREST.AI/layout.md` para a tela da v1.
- Consulte `rules/check.md` para o processo de verificação antes de afirmar que a tarefa está pronta.
- Consulte `rules/migration.md` para qualquer mudança de schema ou migration.
- No backend, preserve a organização por domínio e as camadas `Controller -> Service -> Repository` definidas no ADR.
