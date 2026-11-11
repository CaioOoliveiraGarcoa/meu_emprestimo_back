---
name: imagens-equipamentos
description: Prepara imagens do inventário EMPREST.AI a partir da API do Pexels, valida JPEG 800×600, registra créditos e exige revisão visual antes da carga.
---

# Imagens de equipamentos

1. Use a lista fixa em [equipamentos.json](references/equipamentos.json). Com a chave
   Pexels local, rode `npm run images:search`. Para buscar outra página, passe o
   patrimônio e a página depois de `--`.
2. Abra as prévias e escolha um ID diferente por patrimônio. Grave um objeto JSON
   patrimônio → ID em `images-work/selecao.json`.
3. Rode `npm run images:prepare`. A saída vai para `images-work/preparadas/`, com
   rascunho de manifesto para revisão. O script rejeita bytes que não sejam JPEG 800×600.
4. Abra cada JPEG final em tamanho integral. Reprove pessoas, logotipos ou marcas
   legíveis, qualquer texto, tela com conteúdo e imagem que não corresponda ao item.
   Registre cada rejeição com `patrimonio`, `photoId` e `reason` em `rejected`.
   Troque a seleção quando necessário e mantenha o histórico de rejeições no rascunho final.
5. O operador registra `approved: true`, nome em `reviewer` e data ISO em
   `reviewedAt` após verificar cada arquivo. Preserve o hash do rascunho.
   Rode `npm run images:validate` para emitir o manifesto final.
6. Entregue o manifesto e arquivos revisados ao operador. Ele executa o upload
   com a credencial de Storage mantida fora do ambiente do agente. O catálogo
   exibe o link **Fotos: Pexels** e o crédito individual.

Consulte [contrato e operação](references/contrato.md).
