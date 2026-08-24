package com.api.ecommerce.infrastructure.enums;

/**
 * Estado do carrinho do servidor.
 *
 * O carrinho nao e apagado quando vira pedido: ele fica como CONVERTIDO, para
 * o pedido conseguir apontar de onde veio.
 */
public enum StatusCarrinho {
    ABERTO,
    CONVERTIDO,
    ABANDONADO
}
