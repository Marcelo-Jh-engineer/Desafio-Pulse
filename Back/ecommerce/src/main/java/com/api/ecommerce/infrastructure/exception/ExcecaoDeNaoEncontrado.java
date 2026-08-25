package com.api.ecommerce.infrastructure.exception;

/**
 * O recurso pedido nao existe. Vira 404.
 *
 * A mensagem e sempre exibivel ao usuario e nunca revela o que existe do outro
 * lado: "nao encontramos este produto" vale igual para slug inventado e para
 * produto desativado. Diferenciar os dois casos entregaria, a quem varre a
 * API, a lista do que ja existiu.
 */
public class ExcecaoDeNaoEncontrado extends RuntimeException {

    public ExcecaoDeNaoEncontrado(String mensagem) {
        super(mensagem);
    }
}
