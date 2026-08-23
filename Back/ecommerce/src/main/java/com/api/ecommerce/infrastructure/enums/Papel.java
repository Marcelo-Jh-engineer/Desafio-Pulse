package com.api.ecommerce.infrastructure.enums;

import java.util.Arrays;
import java.util.Optional;

/**
 * Papeis do dominio. Existem como realm roles no Keycloak com estes mesmos
 * nomes e chegam no token em `realm_access.roles`.
 *
 * O realm traz outros papeis tecnicos (offline_access, uma_authorization); so
 * os daqui interessam ao dominio.
 */
public enum Papel {
    CLIENTE,
    ADMIN;

    public static Optional<Papel> de(String nome) {
        return Arrays.stream(values())
                .filter(papel -> papel.name().equals(nome))
                .findFirst();
    }
}
