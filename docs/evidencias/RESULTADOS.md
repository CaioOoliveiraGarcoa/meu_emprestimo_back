# Evidências da rodada local

Rodada de 11/11/2026, comparada ao código dos dois repositórios. Login e API do
teste Playwright usam respostas locais simuladas. A integração da API valida
JWT assinado via JWKS local e grava em PostgreSQL 17 real.

| Verificação | Resultado |
| --- | --- |
| Prisma Migrate reset + seed de tenant local | Aplicados em banco novo |
| Backend Jest unitário | 4 passaram |
| Skill de imagens | 2 testes com fixtures passaram |
| API + PostgreSQL com Supertest | 9 passaram |
| Frontend Vitest | 2 passaram |
| Frontend Playwright | 1 passou em Chromium headless, modo DOM |
| Build de back e front | Ambos passaram |
| OpenAPI do backend e cliente Orval | Sincronizados |
| Inspeção de padrões de segredo nos arquivos | Nenhum padrão encontrado |

O Chromium disponível apresentou limitação de entrada nativa. No teste
local, o modo DOM preencheu os inputs e acionou os eventos no navegador.
A configuração padrão do teste usa as interações nativas do Playwright.

## Histórico de revisão

| Rodada | CA | Achado | Correção |
| --- | --- | --- | --- |
| Inicial | E05 | O banner mostrava o bloqueio de atraso e limite, mas o botão ainda abria o modal. | Desabilitar a ação e informar o motivo no botão. |
| Inicial | D03/D04 | O validador aceitava cabeçalho JPEG sem varredura. A nova preparação zerava rejeições. | Exigir segmento de varredura e preservar a lista de rejeições. A revisão visual continua necessária. |
| Inicial | E12 | O POST rejeitava campos extras, mas o contrato publicado pelo gerador aceitava. | Gerar o corpo estrito e sincronizar as duas cópias do contrato. |
| Integração | D09 | O papel de teste não tinha USAGE no schema recém-criado. | Conceder USAGE no teste, usar schema e papel isolados e repetir a verificação. |
| Erro plantado | E03 | Limite alterado de 3 para 5 numa cópia local. | O teste recebeu nulo em vez de LOAN_LIMIT. Após reversão, o teste voltou a passar. |

## Prova da reprovação

Comando em ambas as rodadas: `npm test -- --testPathPattern=policy.spec.ts`.

| Rodada | CA | Evidência |
| --- | --- | --- |
| Limite 5 | CA-E03 · REPROVADO | Expected: "LOAN_LIMIT". Received: null. 1 reprovado e 2 aprovados. |
| Limite 3 restaurado | CA-E03 · APROVADO | 3 aprovados. A política restaurada foi comparada byte a byte com a política entregue. |

Os dois commits ficam pendentes do operador. O ensaio local demonstra o
comportamento e não substitui os commits solicitados no enunciado.


## Dados iniciais

| CA | Parecer | Evidência |
| --- | --- | --- |
| CA-D01 | APROVADO | Inventário fixo de 12 patrimônios únicos em equipamentos.json. Teste de seed conferiu 4 notebooks, 3 monitores, 3 cabos e 2 câmeras. |
| CA-D02 | APROVADO | Teste de seed conferiu TI-0004, TI-0007 e TI-0010 em manutenção. Os outros nove começam disponíveis. |
| CA-D03 | PENDENTE | Dois testes locais da skill validaram dimensões, origem e duplicidade com fixtures. Faltam as 12 fotos obtidas pela API do Pexels. |
| CA-D04 | PENDENTE | O teste da skill rejeitou hash diferente do registrado na revisão. Falta revisão visual dos 12 JPEGs reais. |
| CA-D05 | PENDENTE | O seed no PostgreSQL local manteve 12 itens, dois vínculos e um empréstimo da conta de teste após reexecução. A reexecução com Auth e Storage do deploy fica pendente. |
| CA-D06 | PENDENTE | A carga usou dois UUIDs fictícios distintos e a conta de correção de teste teve zero empréstimos. Falta conferir a conta real em produção. |
| CA-D07 | PENDENTE | Busca local de padrões de segredo limpa. O perfil do verificador é somente leitura. Falta conferir histórico nos dois repositórios remotos. |
| CA-D08 | PENDENTE | A carga exige que a URL pública corresponda ao hash do manifesto. Faltam os 12 objetos no Storage público. |
| CA-D09 | APROVADO | Prisma migrate reset aplicou a migration e o seed local em PostgreSQL 17. A integração demonstrou RLS sem BYPASSRLS e índice parcial. |
| CA-D10 | APROVADO | O verificador independente revisou a spec, a implementação e as evidências por CA. Correções foram feitas pelo agente principal. |

## Solicitar empréstimo

| CA | Parecer | Evidência |
| --- | --- | --- |
| CA-E01 | PENDENTE | JWT assinado local foi validado via JWKS e o navegador passou pelo login e catálogo com serviços interceptados. Faltam login Supabase e fotos reais no deploy. |
| CA-E02 | APROVADO | Supertest recebeu 201. A falha de auditoria forçada produziu 500 e o PostgreSQL preservou o item disponível e nenhum empréstimo. |
| CA-E03 | APROVADO | Supertest recebeu 409 LOAN_LIMIT na quarta tentativa. A mutação 3 → 5 reprovou o teste unitário. |
| CA-E04 | APROVADO | Supertest recebeu 409 OVERDUE_LOAN com um único empréstimo vencido. Jest conferiu a fronteira de igualdade. |
| CA-E05 | APROVADO | A API recusou manutenção e empréstimo existente com 409. Playwright confirmou botão desabilitado em manutenção. |
| CA-E06 | APROVADO | Dois usuários em paralelo receberam 201 e 409. O banco ficou com um único empréstimo para o item. |
| CA-E07 | APROVADO | Dois pedidos paralelos da mesma pessoa com dois empréstimos abertos produziram 201 e 409. Total final de três. |
| CA-E08 | APROVADO | API retornou só empréstimos abertos da identidade autenticada. Paginação e apresentação em Meus empréstimos exercitadas. |
| CA-E09 | APROVADO | Jest e integração verificaram 14 dias e a fronteira temporal. Vitest e Playwright conferiram exibição no horário de Brasília. |
| CA-E10 | APROVADO | Testes recusaram assinatura alterada, token expirado, tenant no body, ausência de vínculo e item de outro tenant. |
| CA-E11 | APROVADO | Link Fotos: Pexels exercitado no navegador. Estados de carregamento, vazio, erro e crédito individual revisados em screens.tsx. |
| CA-E12 | APROVADO | npm run api:check conferiu o OpenAPI do backend e o cliente Orval. O CI suporta comparação com o contrato publicado após configuração do link. |
| CA-E13 | APROVADO | O verificador analisou API, front, logs de teste e prova com erro plantado em contexto independente. |

Fingerprint da rodada `15415e5c8a6da96a506fa561739709de0285faad29338c5d15c0a0ba7e991a11`.

[Saídas selecionadas dos comandos](LOGS.txt).
