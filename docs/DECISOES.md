# Decisões e lacunas — 11/11/2026

Esta página distingue fonte, orientação recebida e proposta técnica. Não atribui
ao aluno decisões que ele não confirmou nem inventa aprovação formal de spec.

| ID | Conflito ou lacuna | Encaminhamento | Origem / situação |
| --- | --- | --- | --- |
| D01 | 5 itens no briefing, 3 no PRD | Limite 3, recusar a quarta solicitação | PRD, apoiado pela preferência do aluno por preservar a regra anterior; a precedência é pela autoridade, não pela idade |
| D02 | 14 úteis no briefing, 14 dias no PRD | 14 dias corridos, mesma hora de Brasília; atraso estritamente após o vencimento | Plano aceito para implementação local, ver APROVACAO.md |
| D03 | Lista exata mantém TI-0010, briefing omite | TI-0004, TI-0007 e TI-0010 em manutenção; 9 disponíveis | Lista obrigatória; aluno pediu a solução que faz mais sentido |
| D04 | Senha escrita no seed | Somente variável de ambiente; não logar nem versionar | Requisito de segurança prevalece |
| D05 | Instalar sharp | Não instalar; solicitar JPEG já recortado à CDN retornada pela API e validar dimensões nos bytes | ADR não permite sharp; se CDN não fornecer 800×600, abortar |
| D06 | Catálogo sem crédito | Manter link visível Fotos: Pexels e crédito individual | Contrato da skill e diretrizes da API |
| D07 | Verificador corrigir teste | Somente leitura; principal faz a correção | Independência exigida na prática |
| D08 | Testar com conta do professor | Conta de teste separada, scripts de teste rejeitam o e-mail do professor | Orientação expressa do aluno e enunciado |
| D09 | Repetir seed após empréstimos | Não apagar empréstimos, não trocar situação de item emprestado; validar manifesto antes de escrever | Proposta técnica segura |
| D10 | Corrida no mesmo item e no limite da pessoa | Transação e bloqueio da membership, bloqueio do equipamento, índice único parcial | Proposta técnica; PostgreSQL como árbitro |
| D11 | Tenant e perfil do usuário | Tenant em app_metadata assinado; papel confirmado em memberships | ADR-001; nunca user_metadata nem body |
| D12 | 3 repos na conversa, 2 no ADR | Back e front; landing integrada ao front | ADR pede dois. A lista de links diz que agentes separados são opcionais |
| D13 | Seeds e uploads remotos | Scripts fornecidos ao operador, sem execução pelo agente | Regra geral da prática |
| D14 | Prazo, fuso e devolução | Instante UTC; exibição America/Sao_Paulo; exclusão de devoluções desta prática | Proposta técnica; devolução pertence ao PRD completo, fora desta entrega |
| D15 | JPEG válido mas conteúdo impróprio | Revisão visual humana ligada ao SHA-256; arquivo alterado invalida aprovação | Nenhum texto de busca garante ausência de pessoas/logos |
| D16 | Regra de reset Supabase contra ADR Prisma | Usar Prisma Migrate como único dono do schema | Correção de inconsistência do material recebido |

## Registro da conversa

Caio autorizou a implementação e as correções locais após receber o plano.
A produção, os commits e a tag ficam com o operador, conforme `APROVACAO.md`.

As duas listas usam cursor, conforme ADR-001. O pedido de empréstimo usa
a identificação assinada pelo Supabase. O seed e a revisão de imagens
recebem dados locais preparados pelo operador.
