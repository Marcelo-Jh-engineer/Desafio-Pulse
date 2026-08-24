-- ---------------------------------------------------------------
-- Caixa de saida de eventos (transactional outbox)
--
-- Publicar direto num broker durante a transacao deixa banco e fila em
-- desacordo quando um dos dois falha: ou o pedido e gravado e o evento se
-- perde, ou o evento sai e a transacao e desfeita. A saida e gravar o evento
-- AQUI, na mesma transacao do fato que o gerou — se a transacao volta atras, o
-- evento volta junto. Um publicador separado varre as linhas ainda nao
-- publicadas e as entrega ao broker.
--
-- A mensageria ainda nao existe. Esta tabela entra agora porque a parte dificil
-- do padrao e escrever o evento junto com o fato: adicionar a coluna depois
-- significaria revisitar cada transacao que ja deveria ter gravado um evento.
-- Enquanto nao houver publicador, as linhas ficam com publicado_em nulo.
--
-- "outbox" fica em ingles por ser nome de padrao de infraestrutura, como
-- indice trigram ou connection pool — nao e vocabulario do supermercado.
-- ---------------------------------------------------------------
CREATE TABLE tb_outbox_eventos (
    id           BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_publico   UUID        NOT NULL DEFAULT gen_random_uuid(),
    -- Qual entidade mudou ("PEDIDO", "PAGAMENTO") e qual delas. Guardado como
    -- texto e id soltos, sem chave estrangeira: o evento sobrevive ao registro
    -- que o originou, e um evento que impede de apagar a linha de origem
    -- deixaria de ser um registro do passado para virar uma amarra do presente.
    agregado     VARCHAR(40) NOT NULL,
    agregado_id  BIGINT      NOT NULL,
    -- O que aconteceu: "PEDIDO_PAGO", "PAGAMENTO_RECUSADO".
    tipo         VARCHAR(60) NOT NULL,
    -- Corpo da mensagem, ja pronto para ir ao broker. JSONB e nao TEXT para o
    -- conteudo poder ser consultado quando for preciso investigar um evento
    -- que nao saiu.
    conteudo     JSONB       NOT NULL,
    -- Quantas vezes o publicador tentou entregar. Serve para parar de tentar e
    -- separar o que precisa de olho humano.
    tentativas   SMALLINT    NOT NULL DEFAULT 0,
    ultimo_erro  VARCHAR(255),
    criado_em    TIMESTAMPTZ NOT NULL DEFAULT now(),
    publicado_em TIMESTAMPTZ,
    CONSTRAINT uk_outbox_publico    UNIQUE (id_publico),
    CONSTRAINT ck_outbox_tentativas CHECK (tentativas >= 0)
);

-- O publicador so olha o que ainda nao saiu, em ordem de chegada. O indice
-- parcial mantem essa varredura barata mesmo quando a tabela ja acumulou
-- milhoes de eventos publicados.
CREATE INDEX ix_outbox_pendentes ON tb_outbox_eventos (criado_em)
    WHERE publicado_em IS NULL;
