-- ---------------------------------------------------------------
-- Catalogo: categorias e produtos
--
-- Nomes de coluna sao a versao snake_case exata dos campos de
-- docs/models.md — `preco_em_centavos`, `quantidade_estoque`, `url_imagem`.
-- Assim a entidade JPA nao precisa de uma unica anotacao @Column para
-- renomear campo, e o JSON sai com o nome que o front ja espera.
-- ---------------------------------------------------------------

-- Busca por nome no catalogo tolera erro de digitacao e acento faltando.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Slug de seed. O backend gera o slug dos produtos cadastrados pelo admin;
-- esta funcao existe para a carga inicial nao trazer 50 slugs escritos a mao,
-- cada um uma chance de erro de digitacao que so apareceria na URL.
--
-- O translate vem ANTES do lower, e cobre as duas caixas. A database roda com
-- locale C, e nesse locale lower() nao rebaixa letra acentuada maiuscula: o
-- "Á" de "Agua" sobreviveria ao lower, escaparia de um translate que so
-- mapeasse minusculas e seria descartado como caractere nao-alfanumerico,
-- deixando o slug "gua-mineral-500ml". Traduzindo primeiro, o lower so precisa
-- lidar com ASCII, que ele faz em qualquer locale.
CREATE OR REPLACE FUNCTION gerar_slug(texto TEXT) RETURNS TEXT AS $$
    SELECT trim(BOTH '-' FROM regexp_replace(
        lower(translate(texto,
                  'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÑÇáàâãäéèêëíìîïóòôõöúùûüñç',
                  'AAAAAEEEEIIIIOOOOOUUUUNCaaaaaeeeeiiiiooooouuuunc')),
        '[^a-z0-9]+', '-', 'g'));
$$ LANGUAGE sql IMMUTABLE STRICT;

CREATE TABLE tb_categorias (
    id            BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    -- O que a API expoe como `id`. A chave numerica nunca sai daqui: id
    -- sequencial vazado conta quantas categorias existem e permite varrer.
    id_publico    UUID        NOT NULL DEFAULT gen_random_uuid(),
    nome          VARCHAR(60) NOT NULL,
    -- Sem acento, e o que aparece na URL do filtro.
    slug          VARCHAR(60) NOT NULL,
    descricao     VARCHAR(255),
    url_icone     VARCHAR(255),
    ordem         SMALLINT    NOT NULL,
    ativa         BOOLEAN     NOT NULL DEFAULT TRUE,
    criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_categorias_publico UNIQUE (id_publico),
    CONSTRAINT uk_categorias_slug    UNIQUE (slug),
    CONSTRAINT uk_categorias_nome    UNIQUE (nome),
    CONSTRAINT ck_categorias_slug    CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    CONSTRAINT ck_categorias_ordem   CHECK (ordem >= 0)
);

CREATE TABLE tb_produtos (
    id                BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_publico        UUID         NOT NULL DEFAULT gen_random_uuid(),
    sku               VARCHAR(40)  NOT NULL,
    slug              VARCHAR(180) NOT NULL,
    nome              VARCHAR(160) NOT NULL,
    descricao         TEXT         NOT NULL,
    preco_em_centavos BIGINT       NOT NULL,
    -- Rotulo de venda, nao fator de conversao: mesmo produto vendido por peso
    -- entra no carrinho em quantidade inteira (docs/models.md secao 4).
    unidade           VARCHAR(3)   NOT NULL DEFAULT 'UN',
    url_imagem        VARCHAR(255) NOT NULL,
    -- Categoria e entidade propria, nunca string solta: o filtro do catalogo
    -- precisa de slug, ordem e o estado ativa/inativa.
    categoria_id      BIGINT       NOT NULL REFERENCES tb_categorias (id),
    -- Estoque mora no produto porque so tem um caminho de escrita: a baixa na
    -- aprovacao do pagamento. Nao ha entrada, ajuste nem historico de
    -- movimentacao, entao uma tabela separada seria uma juncao por leitura em
    -- troca de nada.
    quantidade_estoque INTEGER     NOT NULL DEFAULT 0,
    ativo             BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    atualizado_em     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uk_produtos_publico UNIQUE (id_publico),
    CONSTRAINT uk_produtos_sku     UNIQUE (sku),
    CONSTRAINT uk_produtos_slug    UNIQUE (slug),
    CONSTRAINT ck_produtos_preco   CHECK (preco_em_centavos > 0),
    CONSTRAINT ck_produtos_estoque CHECK (quantidade_estoque >= 0),
    CONSTRAINT ck_produtos_slug    CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    CONSTRAINT ck_produtos_unidade CHECK (unidade IN ('UN','KG','G','L','ML','PCT'))
);

-- O catalogo publico lista por categoria e so mostra produto ativo, entao o
-- indice parcial cobre exatamente a consulta que mais roda.
CREATE INDEX ix_produtos_categoria ON tb_produtos (categoria_id) WHERE ativo;
CREATE INDEX ix_produtos_nome_trgm ON tb_produtos USING gin (nome gin_trgm_ops);
