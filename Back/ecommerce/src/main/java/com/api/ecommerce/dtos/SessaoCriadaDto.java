package com.api.ecommerce.dtos;

import com.api.ecommerce.dtos.out.AutenticacaoDtoOut;

/**
 * Uso interno, entre servico e controller — nunca vira JSON.
 *
 * O servico produz duas coisas de naturezas diferentes: o que o front pode ler
 * (`corpo`) e o que so o navegador guarda (o refresh token, destinado ao cookie
 * HttpOnly). Devolver os dois juntos num tipo unico deixa o controller montar a
 * resposta sem que o refresh token passe nem perto do JSON.
 *
 * @param corpo                    o que vai no corpo da resposta HTTP
 * @param refreshToken             valor do cookie de sessao
 * @param refreshExpiraEmSegundos  Max-Age do cookie
 */
public record SessaoCriadaDto(
        AutenticacaoDtoOut corpo,
        String refreshToken,
        long refreshExpiraEmSegundos) {
}
