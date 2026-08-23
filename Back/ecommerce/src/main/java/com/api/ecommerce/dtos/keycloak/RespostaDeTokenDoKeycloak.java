package com.api.ecommerce.dtos.keycloak;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Resposta do endpoint de token do Keycloak. Formato **dele**, em snake_case, e
 * por isso vive num pacote separado: nada aqui e contrato com o front.
 *
 * O que sai daqui e traduzido para RespostaAutenticacaoDto antes de virar
 * resposta HTTP.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record RespostaDeTokenDoKeycloak(
        @JsonProperty("access_token") String accessToken,
        @JsonProperty("refresh_token") String refreshToken,
        @JsonProperty("expires_in") long expiraEm,
        @JsonProperty("refresh_expires_in") long refreshExpiraEm) {
}
