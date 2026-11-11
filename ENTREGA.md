# Entrega da prática EMPREST.AI

## Links

| Item | Referência |
| --- | --- |
| GitHub do backend | [Origem indicada no ZIP original](https://github.com/CaiodeOliveiragarcia/meu_emprestimo_back). A branch da prática ainda precisa ser enviada. |
| GitHub do frontend | Preencher com o link do repositório remoto. |
| Backend na Vercel | Preencher após publicar e conferir `/v1/health`. |
| Frontend na Vercel | Preencher após publicar e conferir o site. |
| Agentes | O verificador está neste backend, em `.codex/agents/verificador.toml`. |

## 1. Conflitos

| Pedido | Fonte contrariada | Encaminhamento e motivo | Registro | Commit |
| --- | --- | --- | --- | --- |
| Permitir 5 empréstimos abertos | PRD, limite 3 | A quarta solicitação recebe recusa. A regra já foi definida por Operações. | D01 e CA-E03, `src/modules/loans/policy.ts` | Pendente |
| Contar 14 dias úteis | PRD prevê 14 dias sem qualificar | O plano aprovado interpreta como 14 dias corridos, com vencimento na mesma hora de Brasília. | D02/D14, CA-E09 | Pendente |
| Deixar TI-0010 disponível | Lista de equipamentos que o enunciado pede usar exatamente | TI-0004, TI-0007 e TI-0010 ficam em manutenção. | D03, CA-D02, `skills/imagens-equipamentos/references/equipamentos.json` | Pendente |
| Gravar a senha padrão no seed | Enunciado e regra de segredos | O operador informa a senha em variável de ambiente. As contas têm IDs e senhas distintos. | D04/D08, CA-D06/D07, `scripts/operator.mjs` | Pendente |
| Instalar sharp | ADR-001 e regra de dependências | A CDN retornada pela API recebe a solicitação de recorte. A skill exige JPEG de 800×600 na validação. | D05, CA-D03, `skills/imagens-equipamentos/scripts/` | Pendente |
| Remover créditos | Contrato da skill e diretrizes da API Pexels | Manter link geral e fotógrafo por foto. | D06, CA-E11, `src/screens.tsx` do front | Pendente |
| Verificador consertar teste | Requisito de independência | O verificador aponta CA, evidência e falha. A correção volta para o agente principal. | D07, CA-D10/E13 | Pendente |
| Reset via Supabase CLI | ADR-001 atribui o schema ao Prisma Migrate | O checklist passa a usar o reset local do Prisma. | D16, CA-D09, `rules/check.md` | Pendente |

## 1b. Lacunas

| Spec | Lacuna | Alternativas | Decisão e motivo | Commit |
| --- | --- | --- | --- | --- |
| Dados iniciais | Como revisar conteúdo de cada foto | Confiar na busca ou inspecionar o JPEG final | Revisão visual do arquivo final vinculada ao SHA-256, pois um recorte ou troca de arquivo muda o que é exibido. D15, CA-D04. | Pendente |
| Dados iniciais | Como repetir upload e seed | Criar objetos novos ou reutilizar a chave por patrimônio | Reutilizar chave estável, validar hash e fazer upsert. Uma reexecução preserva itens emprestados. D09, CA-D05. | Pendente |
| Solicitar | Como tratar dois pedidos simultâneos | Índice só para item ou travas por pessoa e item | Lock de membership e de equipamento na mesma transação. O índice parcial reforça a unicidade por item. D10, CA-E06/E07. | Pendente |
| Solicitar | Fronteira de atraso | Início do dia ou instante de vencimento | Atraso começa quando o relógio passa do instante. A API calcula o prazo e a interface exibe hora de Brasília. D02/D14, CA-E04/E09. | Pendente |
| Ambas | Local da landing e do agente | Repositório extra ou dois repositórios da turma REST | A landing fica no front e o agente no back. A lista de links admite repo de agentes opcional. D12. | Pendente |

## 2. Onde o agente tentou decidir

O agente inicialmente tratou a landing como terceiro repositório sem uma
definição no enunciado. A leitura do ADR-001 e da lista de links mostrou que
os dois repositórios obrigatórios são API e frontend. A página inicial foi
integrada ao frontend e o verificador ficou no backend.

## 3. Uma decisão que merece um ADR

O ponto a revisar é a entrada serverless. O ADR-001 cita
`@vendia/serverless-express`. O código local usa o handler HTTP da Vercel com
Express e cache da aplicação Nest em `api/index.ts`. Usar a integração
NestJS nativa da Vercel ou um adaptador que converta eventos são alternativas.
O ADR original está preservado. A escolha da entrada e seu comportamento
precisam ser confirmados no deploy.

## 4. Skill de imagens

O SKILL.md descreve o procedimento. As referências guardam lista, fontes e
contrato. O código verifica origem, IDs, dimensões, créditos e hash. A revisão
visual do arquivo final verifica pessoas, logos, marcas, texto e telas.
O script de publicação é separado e recebe a credencial somente no ambiente
do operador. Contagem de fotos reprovadas pendente de revisão das fotos reais.

## 5. Subagente verificador

O verificador Codex abre com contexto limpo e perfil somente leitura. Ele lê
spec, código e saídas de teste dos dois repositórios. O operador deixa segredos
fora da sessão. O portão compara o fingerprint da rodada e cobra parecer para
cada CA. O CI repete o check na tag. Veja [VERIFICADOR.md](docs/evidencias/VERIFICADOR.md).

## 6. Verificador em ação

A [rodada local](docs/evidencias/RESULTADOS.md) tem as tabelas por CA e a prova
com erro plantado. A prova foi executada numa cópia local da política, trocando
o limite para 5. O teste CA-E03 reprovou. O mesmo teste voltou a passar após a
reversão e a cópia restaurada foi comparada à política do ZIP. Os dois commits
de evidência precisam ser registrados pelo operador.

## 7. Regra posta à prova

O checklist inicial mandava resetar via Supabase CLI. O ADR-001 e a regra de
migration já atribuíam o schema ao Prisma. O comando de `rules/check.md` foi
alinhado ao Prisma Migrate e exercitado no PostgreSQL local.

## 8. Fora de escopo e pendências

Devolução, renovação, Operações e reservas ficaram fora da prática. Os testes
locais usam identidades fictícias distintas da conta de correção. As fotos
reais, Storage, Auth do projeto, deploys, links, commits e tags ainda precisam
da execução e conferência do operador. Siga o [guia](docs/OPERACAO.md).
