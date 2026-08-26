package com.api.ecommerce.business.gateway;

/**
 * O que o gateway respondeu sobre uma cobranca.
 *
 * Duas posicoes, e nada mais: aprovou ou nao, e por que nao. Nao ha campo de
 * identificador de transacao, bandeira ou autorizacao — nada disso e devolvido
 * por um gateway simulado, e um campo sempre nulo so cria a duvida de quando
 * ele deveria estar preenchido.
 *
 * @param aprovado passou
 * @param motivo   por que nao passou. Nulo quando aprovado
 */
public record ResultadoDoPagamento(boolean aprovado, String motivo) {

    /**
      * Nomes no feminino de proposito: `aprovado()` colidiria com o acessor do
      * proprio componente `aprovado`, que o record ja gera.
      */
    public static ResultadoDoPagamento aprovacao() {
        return new ResultadoDoPagamento(true, null);
    }

    public static ResultadoDoPagamento recusa(String motivo) {
        return new ResultadoDoPagamento(false, motivo);
    }
}
