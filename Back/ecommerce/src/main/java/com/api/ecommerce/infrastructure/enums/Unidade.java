package com.api.ecommerce.infrastructure.enums;

/**
 * Unidade de venda do produto — docs/models.md secao 2.
 *
 * E rotulo de exibicao, nao fator de conversao: mesmo o produto vendido por
 * peso entra no carrinho em quantidade inteira. O texto que a pessoa le
 * ("quilo", "pacote") vive na camada de apresentacao do front, nunca aqui.
 */
public enum Unidade {
    UN,
    KG,
    G,
    L,
    ML,
    PCT
}
