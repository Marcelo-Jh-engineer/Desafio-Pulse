-- ---------------------------------------------------------------
-- Pedido, itens e pagamento
--
-- O pedido CONGELA tudo que o comprovante precisa: nome e preco de cada item e
-- os dados de quem comprou. Editar o produto ou o perfil depois nao pode mexer
-- em pedido passado (docs/models.md secao 9), entao aqui nada e apontado por
-- juncao viva — e copia.
--
-- O que o pedido NAO guarda: frete, endereco de entrega e numero legivel. O
-- valor e a soma das linhas; a identidade e o `id_publico`, e nada mais.
-- ---------------------------------------------------------------

CREATE TABLE tb_pedidos (
    id                    BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    -- Identifica o pedido em toda parte: URL, comprovante e suporte.
    id_publico            UUID         NOT NULL DEFAULT gen_random_uuid(),
    usuario_id            BIGINT       NOT NULL REFERENCES tb_usuarios (id),
    -- De onde o pedido nasceu. Fica nulo se o carrinho for apagado; o pedido
    -- nao depende dele para nada depois de criado.
    carrinho_id           BIGINT       REFERENCES tb_carrinhos (id) ON DELETE SET NULL,
    status                VARCHAR(10)  NOT NULL DEFAULT 'PENDENTE',

    -- Uma coluna so para o valor. Com o frete fora, subtotal e total seriam
    -- sempre o mesmo numero, e duas colunas que nunca discordam sao uma
    -- oportunidade de discordarem por engano.
    total_em_centavos     BIGINT       NOT NULL,

    -- Retrato do comprador. O pedido nao depende do usuario atual.
    nome_comprador        VARCHAR(120) NOT NULL,
    email_comprador       VARCHAR(255) NOT NULL,
    login_comprador       VARCHAR(255) NOT NULL,

    -- Repetir o envio do checkout — clique duplo, retomada de rede — devolve o
    -- pedido que ja existe em vez de cobrar duas vezes.
    chave_idempotencia    VARCHAR(80)  NOT NULL,

    criado_em             TIMESTAMPTZ  NOT NULL DEFAULT now(),
    atualizado_em         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    pago_em               TIMESTAMPTZ,
    motivo_recusa         VARCHAR(160),

    CONSTRAINT uk_pedidos_publico      UNIQUE (id_publico),
    CONSTRAINT uk_pedidos_idempotencia UNIQUE (usuario_id, chave_idempotencia),
    CONSTRAINT ck_pedidos_status       CHECK (status IN ('PENDENTE','PAGO','FALHOU','CANCELADO')),
    CONSTRAINT ck_pedidos_total        CHECK (total_em_centavos >= 0),
    -- `pago_em` so existe em pedido pago, e pedido pago nao existe sem ele.
    CONSTRAINT ck_pedidos_pago_em      CHECK ((status = 'PAGO') = (pago_em IS NOT NULL))
);

CREATE INDEX ix_pedidos_usuario ON tb_pedidos (usuario_id, criado_em DESC);

CREATE TABLE tb_pedido_itens (
    id                      BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pedido_id               BIGINT       NOT NULL REFERENCES tb_pedidos (id) ON DELETE CASCADE,
    -- Referencia mantida para o link "comprar de novo". O nome e o preco
    -- abaixo sao copia: se o produto mudar, o pedido nao muda.
    produto_id              BIGINT       NOT NULL REFERENCES tb_produtos (id),
    nome                    VARCHAR(160) NOT NULL,
    unidade                 VARCHAR(3)   NOT NULL,
    quantidade              INTEGER      NOT NULL,
    preco_em_centavos       BIGINT       NOT NULL,
    total_linha_em_centavos BIGINT       NOT NULL,
    CONSTRAINT ck_pedido_item_qtd   CHECK (quantidade > 0),
    CONSTRAINT ck_pedido_item_total CHECK (total_linha_em_centavos = preco_em_centavos * quantidade),
    CONSTRAINT uk_item_por_pedido   UNIQUE (pedido_id, produto_id)
);

-- ---------------------------------------------------------------
-- Pagamento
--
-- Esta tabela guarda o DESFECHO, nao o meio de pagamento. Numero de cartao,
-- parcelamento e codigo de cobranca Pix sao assunto do gateway; aqui fica
-- apenas o que o pedido precisa saber para mudar de estado: por qual caminho
-- foi tentado, quanto, quando e como terminou.
--
-- Cartao resolve na mesma requisicao: aprova ou recusa. Pix nao — a cobranca
-- nasce na hora e quem paga e o aplicativo do banco, depois. Dai o terceiro
-- estado, AGUARDANDO, e o prazo em `expira_em`, que e o unico dado do Pix que
-- interessa deste lado: sem ele a cobranca ficaria pendente para sempre.
-- ---------------------------------------------------------------
CREATE TABLE tb_pagamentos (
    id                BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_publico        UUID         NOT NULL DEFAULT gen_random_uuid(),
    pedido_id         BIGINT       NOT NULL REFERENCES tb_pedidos (id) ON DELETE CASCADE,
    metodo            VARCHAR(6)   NOT NULL,
    status            VARCHAR(11)  NOT NULL,
    valor_em_centavos BIGINT       NOT NULL,
    expira_em         TIMESTAMPTZ,
    motivo_recusa     VARCHAR(160),
    processado_em     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    criado_em         TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT uk_pagamentos_publico UNIQUE (id_publico),
    CONSTRAINT ck_pagamentos_metodo  CHECK (metodo IN ('CARTAO','PIX')),
    CONSTRAINT ck_pagamentos_status  CHECK (status IN ('APROVADO','RECUSADO','AGUARDANDO')),
    CONSTRAINT ck_pagamentos_valor   CHECK (valor_em_centavos > 0),
    -- Prazo so faz sentido em cobranca que espera, e cobranca que espera so
    -- existe no Pix: cartao aprova ou recusa na mesma resposta.
    CONSTRAINT ck_pagamentos_espera  CHECK (status <> 'AGUARDANDO' OR metodo = 'PIX'),
    CONSTRAINT ck_pagamentos_prazo   CHECK (expira_em IS NULL OR metodo = 'PIX'),
    CONSTRAINT ck_pagamentos_recusa  CHECK (status = 'RECUSADO' OR motivo_recusa IS NULL)
);

-- Um pagamento aprovado por pedido, no maximo. E esta linha que impede a
-- segunda cobranca de um pedido ja pago, e com ela a segunda baixa de estoque.
CREATE UNIQUE INDEX uk_pagamento_aprovado_por_pedido
    ON tb_pagamentos (pedido_id) WHERE status = 'APROVADO';

CREATE INDEX ix_pagamentos_pedido ON tb_pagamentos (pedido_id, criado_em DESC);
