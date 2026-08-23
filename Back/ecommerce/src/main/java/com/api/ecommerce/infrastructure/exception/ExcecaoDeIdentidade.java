package com.api.ecommerce.infrastructure.exception;

/**
 * Falha na conversa com o provedor de identidade: fora do ar, segredo errado,
 * resposta que nao da para interpretar. Vira 502 — o problema e nosso, nao de
 * quem esta tentando entrar.
 */
public class ExcecaoDeIdentidade extends RuntimeException {

    public ExcecaoDeIdentidade(String mensagem, Throwable causa) {
        super(mensagem, causa);
    }

    public ExcecaoDeIdentidade(String mensagem) {
        super(mensagem);
    }
}
