package com.api.ecommerce.config;

import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

/**
 * O refresh token vive num cookie HttpOnly, nunca no corpo da resposta.
 *
 * Essa e a diferenca entre a sessao sobreviver ao F5 e o token ficar ao alcance
 * de qualquer script da pagina: `localStorage` seria legivel por qualquer XSS, e
 * um cookie sem HttpOnly nao seria melhor. Como o JavaScript nao consegue nem
 * criar nem ler este cookie, quem o emite e o apaga so pode ser o servidor.
 *
 * O access token continua fora daqui: ele vive em memoria no front, dura cinco
 * minutos e e trocado silenciosamente enquanto o cookie valer.
 */
@Component
public class CookieDeSessao {

    /** Nome tecnico do provedor, nao termo de dominio: e o que trafega na rede. */
    public static final String NOME = "refresh_token";

    /**
     * Escopo estreito de proposito: o cookie so e enviado para as rotas que
     * realmente precisam dele. As rotas de catalogo e pedido nunca o veem.
     */
    private static final String CAMINHO = "/api/autenticacao";

    private final boolean seguro;

    public CookieDeSessao(@Value("${app.cookie-seguro}") boolean seguro) {
        this.seguro = seguro;
    }

    public ResponseCookie criar(String refreshToken, long duracaoEmSegundos) {
        return base(refreshToken).maxAge(Duration.ofSeconds(duracaoEmSegundos)).build();
    }

    /**
     * Apagar um cookie e reemitir o mesmo par nome/caminho com validade zero —
     * nao existe verbo de remocao em HTTP. Um caminho diferente do usado na
     * criacao deixaria o cookie original de pe.
     */
    public ResponseCookie limpar() {
        return base("").maxAge(0).build();
    }

    private ResponseCookie.ResponseCookieBuilder base(String valor) {
        return ResponseCookie.from(NOME, valor)
                .httpOnly(true)
                // Falso em desenvolvimento porque http://localhost nao e HTTPS e
                // o navegador descartaria o cookie em silencio. Verdadeiro em
                // producao, via COOKIE_SEGURO.
                .secure(seguro)
                // Lax, nao Strict: o retorno de um fluxo externo — a volta de um
                // pagamento, por exemplo — chega como navegacao de outro site, e
                // com Strict o usuario voltaria deslogado.
                .sameSite("Lax")
                .path(CAMINHO);
    }
}
