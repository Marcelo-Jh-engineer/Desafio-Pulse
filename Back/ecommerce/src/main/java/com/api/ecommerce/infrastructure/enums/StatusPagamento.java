package com.api.ecommerce.infrastructure.enums;

/**
 * Desfecho de uma tentativa de pagamento — docs/models.md secao 10.
 *
 * PENDENTE e o estado em que a tentativa nasce: a API grava a linha e responde
 * 202 sem esperar ninguem. Quem a resolve e o consumidor da fila, depois. Sem
 * esse estado a tentativa nasceria ja com um desfecho que ninguem apurou.
 *
 * AGUARDANDO existe por causa do Pix: a cobranca nasce na hora, mas quem paga e
 * o aplicativo do banco. Ele ainda nao e usado — esta fatia so tem CARTAO — e
 * fica porque o schema ja o preve.
 *
 * A diferenca entre os dois: PENDENTE espera o NOSSO consumidor; AGUARDANDO
 * espera o cliente pagar la fora.
 */
public enum StatusPagamento {
    PENDENTE,
    APROVADO,
    RECUSADO,
    AGUARDANDO;

    /**
     * Tentativa resolvida nao volta atras.
     *
     * A regra fica no tipo, e nao espalhada no consumidor: e ela que faz uma
     * reentrega do RabbitMQ esbarrar em pedra em vez de aprovar duas vezes.
     */
    public boolean podeIrPara(StatusPagamento destino) {
        return switch (this) {
            case PENDENTE, AGUARDANDO -> destino == APROVADO || destino == RECUSADO;
            case APROVADO, RECUSADO -> false;
        };
    }

    /** Ainda nao tem desfecho: ninguem processou, ou ninguem pagou. */
    public boolean estaEmAberto() {
        return this == PENDENTE || this == AGUARDANDO;
    }
}
