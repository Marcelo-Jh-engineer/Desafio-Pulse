-- ---------------------------------------------------------------
-- Pagamento assincrono
--
-- Ate aqui o pagamento era um registro de DESFECHO: a linha nascia ja aprovada
-- ou recusada, no mesmo instante em que alguem a criava. Com a cobranca saindo
-- por fila, a tentativa passa a nascer PENDENTE e so ganha desfecho quando o
-- consumidor a processa — o que muda duas coisas no schema.
-- ---------------------------------------------------------------

-- 1. `processado_em` deixa de ser obrigatorio.
--
-- Com NOT NULL DEFAULT now() toda linha nascia "processada", e o consumidor nao
-- teria como distinguir o que ainda espera do que ja foi resolvido. O nulo e o
-- sinal, e e ele que o cliente le para saber que deve continuar consultando.
ALTER TABLE tb_pagamentos
    ALTER COLUMN processado_em DROP NOT NULL,
    ALTER COLUMN processado_em DROP DEFAULT;

-- 2. PENDENTE entra na lista de status permitidos.
--
-- O CHECK da V4 so conhecia APROVADO, RECUSADO e AGUARDANDO — a solicitacao
-- seria recusada pelo banco antes de chegar a fila. AGUARDANDO fica: ele e do
-- Pix, que espera o cliente pagar la fora, enquanto PENDENTE espera o NOSSO
-- consumidor. Sao esperas diferentes.
--
-- 'PENDENTE' tem 8 caracteres e cabe no varchar(11) existente.
ALTER TABLE tb_pagamentos DROP CONSTRAINT ck_pagamentos_status;
ALTER TABLE tb_pagamentos ADD CONSTRAINT ck_pagamentos_status
    CHECK (status IN ('PENDENTE','APROVADO','RECUSADO','AGUARDANDO'));

-- ---------------------------------------------------------------
-- O que NAO precisou entrar aqui, e por que
--
-- `ix_outbox_pendentes`: ja criado na V5, com o mesmo indice parcial sobre
-- (criado_em) WHERE publicado_em IS NULL. O IF NOT EXISTS abaixo existe so para
-- o caso de um banco antigo nao te-lo — em banco novo ele nao faz nada.
--
-- `uk_pagamento_aprovado_por_pedido`: a V4 ja o criou como UNIQUE parcial sobre
-- (pedido_id) WHERE status = 'APROVADO'. E ele que impede a segunda cobranca
-- aprovada do mesmo pedido, e com ela a segunda baixa de estoque — a checagem
-- em codigo e conveniencia para a mensagem sair legivel, nao a garantia.
--
-- `ck_pagamentos_espera` (status <> 'AGUARDANDO' OR metodo = 'PIX') continua
-- valendo sem ajuste: PENDENTE nao e AGUARDANDO, entao cartao pendente passa.
-- ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS ix_outbox_pendentes
    ON tb_outbox_eventos (criado_em) WHERE publicado_em IS NULL;
