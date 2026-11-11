# Origem, validação e revisão

- [API e diretrizes do Pexels](https://www.pexels.com/api/documentation/)
- [Licença Pexels](https://www.pexels.com/license/)
- [Buckets públicos do Supabase](https://supabase.com/docs/guides/storage/buckets/fundamentals)

A API recebe a chave em Authorization. A busca retorna candidatos e o endpoint
individual confirma ID, URL da foto, fotógrafo e endereço original na CDN.
O script pede recorte JPEG e inspeciona as dimensões nos bytes recebidos.
IDs e hashes são únicos. A revisão visual cobre conteúdo que os metadados
não conseguem verificar e fica vinculada ao hash do JPEG final.

O operador usa o bucket público `equipamentos`. O objeto de cada item tem o
caminho estável `equipamentos/TI-xxxx.jpg` dentro do bucket. Reexecuções conferem
o hash do objeto público antes de decidir se precisam gravar. A chave de escrita
só existe no ambiente do operador. O site usa URLs públicas e créditos da licença.

O diretório `images-work/` fica fora do git. A evidência que for anexada à entrega
deve registrar os IDs, autores e resultados da revisão, sem credenciais.
