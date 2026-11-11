# Spec — Dados iniciais

Status: aprovada para implementação local em 11/11/2026; ver docs/APROVACAO.md.

## Objetivo e vínculo com o PRD
Fornecer o inventário da prática e a conta de correção, sem criar empréstimos.
As decisões D03–D09, D11, D13 e D15 de `docs/DECISOES.md` fazem parte desta spec.

## Regras
- Usar exatamente os 12 patrimônios/nomes/categorias/buscas do enunciado.
- Manutenção em TI-0004, TI-0007, TI-0010. Demais nove disponíveis na primeira carga.
- Cadastro fechado via Supabase Auth; professor é colaborador do tenant suporte_ti.
- Conta de teste é outra identidade; repetir seed não altera a senha de usuário existente.
- Fotos vêm exclusivamente da API Pexels; JPEG 800×600 verificado, IDs e hashes únicos.
- Créditos, licença, origem, revisão visual e SHA-256 são necessários para publicação.
- Upload e seed de produção são executados pelo operador, nunca pelo agente.
- Reexecução preserva empréstimos e a disponibilidade de itens já emprestados.

## Critérios de aceite
| ID | Critério verificável |
| --- | --- |
| CA-D01 | Exatos 12 equipamentos, com 4 notebooks, 3 monitores, 3 cabos e 2 câmeras; sem patrimônio repetido |
| CA-D02 | Lista exata de 3 itens em manutenção e 9 disponíveis na primeira carga |
| CA-D03 | Fotos únicas 800×600, provenientes da API e com crédito/licença registrados |
| CA-D04 | Arquivo sem pessoas, marcas/logos legíveis, texto ou telas com conteúdo; revisão do mesmo hash |
| CA-D05 | Carga repetida não duplica equipamentos, usuários, objetos nem reabre equipamento emprestado |
| CA-D06 | Professor autentica em produção e permanece com zero empréstimos; testes usam outra conta |
| CA-D07 | Segredos ausentes do git e agente sem publicação/escrita em produção |
| CA-D08 | URLs públicas das 12 imagens abrem sem login no Supabase Storage |
| CA-D09 | Migration reproduzível com tenant_id, constraints e RLS explícita |
| CA-D10 | Revisão independente por CA com evidência e sem correções pelo verificador |

## Contratos afetados
Prisma: tenants, memberships, equipments, loans, audit_events, rate_limits.
Equipamento possui patrimônio único por tenant, categoria, situação e metadados da imagem.
Prisma Migrate é o único dono do schema. Nenhuma tabela é criada por SQL avulso remoto.

## Fora de escopo
Cadastro pela interface, importação de planilha, geração de foto por IA, teste com
o professor, migração ou upload executado pelo agente.
