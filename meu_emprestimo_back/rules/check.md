# Verificação de fim de tarefa

> leitor: agente

## Quando

Sempre que você for dizer "pronto", "implementado" ou "funcionando".

## Procedimento

1. Identifique se a tarefa é de frontend ou backend e use o comando de testes correspondente (`<COMANDO-TESTES>`). Inclua a última linha da saída na resposta.
2. Se a tarefa tiver alterado uma migration, rode `supabase db reset` localmente e confirme que o banco sobe do zero com todas as migrations.
3. Rode o comando de build correspondente (`<COMANDO-BUILD>`) antes de qualquer push. O build precisa passar tanto para frontend quanto para backend quando a tarefa afetar os dois.
4. Rode `git status --short`. Só podem aparecer arquivos dentro do escopo da tarefa.
5. Informe qual critério de aceitação (`CA-xx`) a tarefa atende.

## Verificação

Uma tarefa só está pronta quando os comandos aplicáveis terminarem sem falha e o `git status --short` não trouxer surpresa. As duas condições são obrigatórias.

## Falhas

- Não relate sucesso parcial. Teste vermelho significa que a tarefa não terminou, mesmo que o código pareça correto.
- Se um check falhar, pare, analise o problema e explique a causa e o impacto. Só ajuste depois que o usuário aceitar.
- Não tente corrigir a mesma falha duas vezes seguidas sem mostrar a saída do erro ao usuário.

## Não faça

- Não rode testes contra o banco remoto.
- Não use `supabase db reset` contra o projeto remoto; a verificação de migrations deve ser local.
