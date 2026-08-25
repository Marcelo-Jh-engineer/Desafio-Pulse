package com.api.ecommerce.business.mapper;

import com.api.ecommerce.dtos.out.UsuarioDtoOut;
import com.api.ecommerce.infrastructure.enums.Papel;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

/**
 * Traduz o token do provedor para o usuario do dominio.
 *
 * Este e o unico lugar que conhece o formato das claims do Keycloak. Nem
 * controller, nem front, nem regra de negocio sabem que existe
 * `realm_access.roles` ou `preferred_username`.
 */
@Component
public class UsuarioMapper {

    public UsuarioDtoOut paraDto(Jwt token) {
        return new UsuarioDtoOut(
                token.getSubject(),
                nomeDe(token),
                token.getClaimAsString("email"),
                token.getClaimAsString("preferred_username"),
                papeisDe(token));
    }

    /** Os papeis saem sempre do token, nunca do corpo de uma resposta. */
    public List<Papel> papeisDe(Jwt token) {
        Map<String, Object> acessoDoRealm = token.getClaimAsMap("realm_access");
        if (acessoDoRealm == null || !(acessoDoRealm.get("roles") instanceof Collection<?> papeis)) {
            return List.of();
        }
        return papeis.stream()
                .map(String::valueOf)
                .map(Papel::de)
                .flatMap(java.util.Optional::stream)
                .toList();
    }

    private String nomeDe(Jwt token) {
        String nomeCompleto = token.getClaimAsString("name");
        if (nomeCompleto != null && !nomeCompleto.isBlank()) {
            return nomeCompleto;
        }
        String primeiro = token.getClaimAsString("given_name");
        String ultimo = token.getClaimAsString("family_name");
        String montado = ((primeiro == null ? "" : primeiro) + " " + (ultimo == null ? "" : ultimo)).trim();
        return montado.isBlank() ? token.getClaimAsString("preferred_username") : montado;
    }
}
