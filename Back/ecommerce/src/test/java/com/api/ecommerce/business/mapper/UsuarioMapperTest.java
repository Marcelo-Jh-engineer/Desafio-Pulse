package com.api.ecommerce.business.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import com.api.ecommerce.dtos.out.UsuarioDtoOut;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

class UsuarioMapperTest {

    private final UsuarioMapper mapper = new UsuarioMapper();

    @Test
    void mapeiaNomeSemSobrenome() {
        Jwt token = Jwt.withTokenValue("token")
                .header("alg", "none")
                .subject("usuario-id")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60))
                .claim("given_name", "Marcelo")
                .claim("family_name", "")
                .claim("name", "Marcelo")
                .claim("email", "marcelo@exemplo.com")
                .claim("preferred_username", "marcelo@exemplo.com")
                .claim("realm_access", Map.of("roles", List.of("CLIENTE")))
                .build();

        UsuarioDtoOut usuario = mapper.paraDto(token);

        assertThat(usuario.nome()).isEqualTo("Marcelo");
    }
}
