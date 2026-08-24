package com.api.ecommerce.infrastructure.enums;

/**
 * Status do pedido — docs/models.md secao 9.
 *
 * Transicoes validas: PENDENTE para PAGO, PENDENTE para FALHOU, PENDENTE para
 * CANCELADO. Nenhuma outra. FALHOU e recuperavel: o cliente tenta pagar de
 * novo sem perder o pedido.
 */
public enum StatusPedido {
    PENDENTE,
    PAGO,
    FALHOU,
    CANCELADO;

    public boolean podeIrPara(StatusPedido destino) {
        return this == PENDENTE && destino != PENDENTE;
    }
}
