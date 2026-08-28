package com.api.ecommerce.infrastructure.enums;

import java.util.Optional;

/**
 * O que aconteceu, e por qual chave de roteamento o broker vai encaminhar.
 *
 * O par nome-chave vive AQUI, e nao em concatenacao de string espalhada pelo
 * publicador. Uma chave montada a mao erra em silencio: a mensagem sai, o
 * broker aceita, nenhuma fila casa com ela, e o evento some sem erro nenhum.
 *
 * Um tipo so, porque so existe um consumidor. PEDIDO_CRIADO viveu aqui e saiu:
 * era gravado no outbox, publicado, e descartado pelo broker por nao haver
 * binding que casasse com `pedido.criado` — evento que ninguem escuta nao e
 * integracao, e trabalho invisivel a cada checkout.
 */
public enum TipoDeEvento {

    PAGAMENTO_SOLICITADO("pagamento.solicitado");

    private final String chaveDeRoteamento;

    TipoDeEvento(String chaveDeRoteamento) {
        this.chaveDeRoteamento = chaveDeRoteamento;
    }

    public String chaveDeRoteamento() {
        return chaveDeRoteamento;
    }

    /**
     * O tipo gravado no outbox e texto — a coluna e VARCHAR, e uma linha antiga
     * pode carregar um tipo que o codigo de hoje nao conhece mais. Devolver
     * vazio deixa o publicador registrar o problema naquela linha em vez de
     * derrubar o ciclo inteiro.
     */
    public static Optional<TipoDeEvento> porNome(String nome) {
        for (TipoDeEvento tipo : values()) {
            if (tipo.name().equals(nome)) {
                return Optional.of(tipo);
            }
        }
        return Optional.empty();
    }
}
