package com.api.ecommerce.dtos;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class NovoUsuarioDoKeycloakTest {

    @Test
    void enviaSobrenomeVazioQuandoUsuarioTemNomeDeUmaPalavra() {
        NovoUsuarioDoKeycloak usuario = NovoUsuarioDoKeycloak.de(
                "marcelo@exemplo.com", "marcelo@exemplo.com", "Marcelo", "", "Senha123");

        assertThat(usuario.firstName()).isEqualTo("Marcelo");
        assertThat(usuario.lastName()).isEmpty();
    }

    @Test
    void preservaSobrenomeInformado() {
        NovoUsuarioDoKeycloak usuario = NovoUsuarioDoKeycloak.de(
                "maria@exemplo.com", "maria@exemplo.com", "Maria", "Souza", "Senha123");

        assertThat(usuario.lastName()).isEqualTo("Souza");
    }
}
