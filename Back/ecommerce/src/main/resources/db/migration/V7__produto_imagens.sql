-- ---------------------------------------------------------------
-- Imagem do produto guardada no banco
--
-- Passa a haver duas origens possiveis para a foto de um produto:
--
--   1. um caminho externo, em tb_produtos.url_imagem — arquivo servido por
--      outro lugar, como os /produtos/*.jpg da carga inicial;
--   2. os bytes aqui, nesta tabela.
--
-- url_imagem ja nasce opcional na V2, justamente por isso: produto com imagem
-- gravada nao tem caminho externo nenhum a declarar. Quem resolve qual das duas
-- vale e a API, num ponto so — e para o front nada muda, porque ele continua
-- recebendo o campo `urlImagem` como sempre (docs/models.md secao 4). O que
-- muda e para onde essa URL aponta.
--
-- Tabela separada, e nao coluna em tb_produtos, porque a listagem do catalogo
-- le o produto inteiro a cada pagina: com os bytes na mesma linha, montar uma
-- grade de doze miniaturas traria doze imagens do banco junto. Aqui os bytes so
-- saem quando alguem pede exatamente esta imagem.
-- ---------------------------------------------------------------

CREATE TABLE tb_produto_imagens (
    id                BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_publico        UUID        NOT NULL DEFAULT gen_random_uuid(),
    -- Uma imagem por produto: o contrato expoe um `urlImagem`, no singular.
    -- Trocar a foto substitui a linha, nao acumula versoes.
    produto_id        BIGINT      NOT NULL REFERENCES tb_produtos (id) ON DELETE CASCADE,
    -- bytea, e nao large object (OID): o large object vive fora da tabela, num
    -- catalogo proprio, nao some junto com a linha e obriga a rotina de limpeza
    -- que o ON DELETE CASCADE faz de graca aqui.
    conteudo          BYTEA       NOT NULL,
    -- Vai no cabecalho Content-Type ao servir. Guardado, e nao adivinhado pela
    -- extensao do arquivo: extensao e o que quem envia diz, nao o que o arquivo
    -- e.
    tipo_conteudo     VARCHAR(40) NOT NULL,
    tamanho_em_bytes  INTEGER     NOT NULL,
    nome_arquivo      VARCHAR(255),
    -- SHA-256 do conteudo, em hexadecimal. Serve de ETag: o navegador guarda a
    -- imagem e so a baixa de novo quando ela muda de verdade. Sem isso, cada
    -- visita ao catalogo puxaria as fotos inteiras do banco outra vez.
    hash_sha256       VARCHAR(64) NOT NULL,
    criado_em         TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uk_produto_imagens_publico UNIQUE (id_publico),
    CONSTRAINT uk_produto_imagens_produto UNIQUE (produto_id),

    -- Formatos de imagem que o navegador desenha, e so eles.
    --
    -- SVG fica de fora de proposito: SVG e XML, aceita <script> dentro, e servir
    -- um arquivo enviado por terceiro na mesma origem da loja e dar a ele o
    -- mesmo poder que o codigo da propria pagina tem. Nao ha ganho que pague
    -- isso — foto de produto e imagem de pixels.
    CONSTRAINT ck_produto_imagens_tipo CHECK (
        tipo_conteudo IN ('image/jpeg','image/png','image/webp','image/avif')),

    -- Teto de 2 MB. Foto de produto passa longe disso; o limite existe para uma
    -- imagem enviada por engano nao virar uma linha de dezenas de megabytes que
    -- toda copia de seguranca vai carregar para sempre.
    CONSTRAINT ck_produto_imagens_tamanho CHECK (
        tamanho_em_bytes > 0 AND tamanho_em_bytes <= 2097152),

    -- O tamanho declarado e o tamanho real sao a mesma coisa, e o banco confere.
    -- Dois campos que descrevem o mesmo fato so servem se nunca discordarem.
    CONSTRAINT ck_produto_imagens_coerencia CHECK (
        tamanho_em_bytes = octet_length(conteudo)),

    CONSTRAINT ck_produto_imagens_hash CHECK (hash_sha256 ~ '^[0-9a-f]{64}$')
);
