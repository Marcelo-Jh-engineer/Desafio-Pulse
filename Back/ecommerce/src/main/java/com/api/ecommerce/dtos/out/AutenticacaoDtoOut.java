package com.api.ecommerce.dtos.out;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Resposta de login, cadastro e renovacao — sempre a mesma, para que o front
 * trate os tres do mesmo jeito.
 *
 * O refresh token **nao** aparece aqui de proposito: ele sai no cookie
 * HttpOnly montado por CookieDeSessao, fora do alcance do JavaScript.
 *
 * @param token            access token JWT; vai no header Authorization
 * @param expiraEmSegundos validade do access token, em segundos
 */
@Schema(name = "RespostaAutenticacao")
public record AutenticacaoDtoOut(
        String token,
        @Schema(example = "300") long expiraEmSegundos,
        UsuarioDtoOut usuario) {
}
