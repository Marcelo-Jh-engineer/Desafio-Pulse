package com.api.ecommerce.infrastructure.exception;

/**
 * Falha do lado de quem pede: codigo de troca expirado, `state` desconhecido,
 * retorno adulterado. Vira 401 — sem sessao, o front leva ao login.
 */
public class ExcecaoDeAutenticacao extends RuntimeException {

    public ExcecaoDeAutenticacao(String mensagem) {
        super(mensagem);
    }
}
