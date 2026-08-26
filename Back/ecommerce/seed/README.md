# Imagens do catálogo

As fotografias do catálogo ficam somente neste diretório do backend. O front
não importa esses arquivos: em runtime ele recebe uma URL da API, e o endpoint
de imagem devolve os bytes armazenados em `tb_produto_imagens`.

## Regeneração

1. Instale a dependência: `python -m pip install -r seed/requirements.txt`.
2. Coloque uma imagem PNG ou JPEG para cada entrada de `produtos.json` dentro
   de `seed/imagens`, usando o slug como nome.
3. Execute `python seed/otimizar_imagens.py` para produzir WebPs 800x800.
4. Execute `python seed/gerar_migration.py` para regenerar a migration V11.

Os scripts falham se faltar uma imagem, se houver ambiguidade de fonte, se o
arquivo não for WebP, se a dimensão não for 800x800 ou se o limite de 2 MB do
banco for excedido. Arquivos acima de 300 KB geram aviso.

O SQL grava o WebP diretamente em `BYTEA`; não há SVG nem Base64 em runtime.
