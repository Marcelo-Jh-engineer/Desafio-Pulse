-- ---------------------------------------------------------------
-- Carrinho do servidor
--
-- Ate a F5 o carrinho vive no cliente. A partir da F6 ele passa a ser do
-- servidor, e e o servidor quem impoe o teto de quantidade — docs/prd.md.
--
-- A linha guarda um retrato do produto no instante em que ele entrou. Nao e
-- desnormalizacao gratuita: e o unico jeito de o checkout perceber que o preco
-- mudou desde que a pessoa colocou o item no carrinho e avisar antes de cobrar
-- (RF-CHK-08).
--
-- O retrato NAO inclui a imagem. Ela nao e um dado do produto que possa mudar
-- de valor: e derivada do id, que a linha ja guarda em produto_id. Copiar
-- tb_produtos.url_imagem seria copiar nulo, porque a foto vive em
-- tb_produto_imagens desde a V7.
-- ---------------------------------------------------------------
CREATE TABLE tb_carrinhos (
    id            BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_publico    UUID        NOT NULL DEFAULT gen_random_uuid(),
    usuario_id    BIGINT      NOT NULL REFERENCES tb_usuarios (id),
    status        VARCHAR(12) NOT NULL DEFAULT 'ABERTO',
    criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_carrinhos_publico UNIQUE (id_publico),
    CONSTRAINT ck_carrinhos_status  CHECK (status IN ('ABERTO','CONVERTIDO','ABANDONADO'))
);

-- Um carrinho aberto por pessoa. O indice parcial deixa o historico de
-- carrinhos convertidos e abandonados conviver com essa regra.
CREATE UNIQUE INDEX uk_carrinho_aberto_por_usuario
    ON tb_carrinhos (usuario_id) WHERE status = 'ABERTO';

CREATE TABLE tb_carrinho_itens (
    id                       BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    carrinho_id              BIGINT       NOT NULL REFERENCES tb_carrinhos (id) ON DELETE CASCADE,
    produto_id               BIGINT       NOT NULL REFERENCES tb_produtos (id),
    quantidade               INTEGER      NOT NULL,
    -- Retrato do produto na hora em que entrou.
    nome                     VARCHAR(160) NOT NULL,
    unidade                  VARCHAR(3)   NOT NULL,
    preco_em_centavos        BIGINT       NOT NULL,
    total_linha_em_centavos  BIGINT       NOT NULL,
    adicionado_em            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    -- Quantidade e positiva, e so isso: nao ha teto por linha. O limite real e
    -- o estoque, conferido no servico contra o estoque do momento — e nao
    -- contra o retrato guardado aqui.
    CONSTRAINT ck_carrinho_item_qtd   CHECK (quantidade > 0),
    CONSTRAINT ck_carrinho_item_total CHECK (total_linha_em_centavos = preco_em_centavos * quantidade),
    -- Adicionar de novo o mesmo produto soma na linha existente; nao cria
    -- uma segunda.
    CONSTRAINT uk_item_por_carrinho   UNIQUE (carrinho_id, produto_id)
);
