package com.api.ecommerce.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Tudo que o backend precisa saber sobre o provedor de identidade fica aqui, e
 * so aqui. Nenhum destes valores chega ao navegador — o front nao fala com o
 * Keycloak em momento nenhum.
 *
 * @param url          raiz do Keycloak, ex. http://localhost:8081
 * @param realm        realm do projeto
 * @param clientId     client confidencial do backend
 * @param clientSecret segredo do client; nunca sai desta JVM
 */
@ConfigurationProperties(prefix = "keycloak")
public record KeycloakConfig(String url, String realm, String clientId, String clientSecret) {

    /** Endpoints que qualquer client OpenID Connect usa. */
    public String urlDeToken() {
        return url + "/realms/" + realm + "/protocol/openid-connect/token";
    }

    public String urlDeEncerramentoDeSessao() {
        return url + "/realms/" + realm + "/protocol/openid-connect/logout";
    }

    /**
     * API administrativa. Exige token de service account, nao de usuario — e por
     * isso que o cadastro precisa de um segundo token, obtido com
     * client_credentials.
     */
    public String urlDeUsuarios() {
        return url + "/admin/realms/" + realm + "/users";
    }
}
