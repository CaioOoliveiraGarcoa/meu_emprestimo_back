# Spec — Solicitar empréstimo

Status: aprovada para implementação local em 11/11/2026; ver docs/APROVACAO.md.

## Objetivo e vínculo com o PRD
Colaborador autenticado consulta catálogo, solicita item disponível e vê seus empréstimos.
Aplicar D01, D02, D06–D08, D10–D14 de `docs/DECISOES.md`.
O empréstimo nasce na solicitação, sem aprovação de Operações nem fila.

## Regras e lacunas explicitadas
- Limite de 3 empréstimos abertos por pessoa e tenant, definido no PRD.
- Decisão aprovada: 14 dias corridos, mesmo instante do dia em
  America/Sao_Paulo. Persistir UTC, considerar atraso quando agora > vencimento.
- Apenas equipamento disponível e do tenant autenticado; nunca tenant vindo do body.
- Contar empréstimos abertos, inclusive atrasados. Uma única transação avalia o
  limite, atraso e disponibilidade, cria empréstimo e muda a situação do item.
- Bloquear pessoa e equipamento: corrida de uma pessoa em itens diferentes também
  não pode exceder o limite. Apenas índice único do item não resolve esse caso.
- Exibir motivo de recusa (limite, atraso, manutenção, emprestado), sem detalhes internos.
- Listagens isoladas por tenant; lista de empréstimos adicionalmente isolada por usuário.
- Manter link Fotos: Pexels visível e crédito por imagem.

## Critérios de aceite
| ID | Critério verificável |
| --- | --- |
| CA-E01 | Login real e catálogo autenticado, com imagens, nome, categoria e situação |
| CA-E02 | Solicitação válida cria empréstimo e indisponibiliza o item atomicamente |
| CA-E03 | Quarta solicitação aberta é recusada com motivo explícito |
| CA-E04 | Quem tem atraso é recusado, inclusive abaixo do limite |
| CA-E05 | Manutenção ou item emprestado são recusados pela API, além do botão desabilitado |
| CA-E06 | Dois usuários disputando o mesmo item geram exatamente um empréstimo |
| CA-E07 | Pedidos simultâneos da mesma pessoa não ultrapassam o limite |
| CA-E08 | Meus empréstimos mostra somente os próprios itens abertos e vencimentos |
| CA-E09 | Datas calculadas no servidor, atraso na fronteira correta e exibição em Brasília |
| CA-E10 | JWT inválido, tenant adulterado e acesso entre tenants são recusados |
| CA-E11 | Crédito Pexels permanece visível, com estados de carregamento, erro e vazio |
| CA-E12 | Contrato OpenAPI gerado e cliente gerado sincronizados |
| CA-E13 | Revisão independente por CA com evidências de back e front |

## Contrato de API
GET /v1/equipamentos?cursor=TI-0004&limit=50 → {items,nextCursor}
GET /v1/emprestimos?cursor=<UUID>&limit=50 → {items,nextCursor}, somente abertos do usuário.
POST /v1/emprestimos {equipamentoId: UUID} → 201; 401 token inválido,
403 vínculo ausente, 404 item de outro tenant/inexistente, 409 regra de negócio.
Body estrito: rejeitar usuário, tenant, situação ou data fornecidos pelo cliente.
Erros RFC 9457, com code estável e detail em português.

## Fora de escopo
Devolução, renovação, Operações, reserva futura, fila, notificações e alteração de
dados de produção pelo agente. Esses itens do PRD completo não são esta prática.
