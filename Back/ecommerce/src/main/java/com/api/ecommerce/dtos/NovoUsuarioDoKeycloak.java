package com.api.ecommerce.dtos;

import java.util.List;

/**
 * Corpo que a API administrativa do Keycloak espera para criar um usuario.
 * Formato dele, com os nomes dele.
 *
 * `emailVerified` sai como verdadeiro porque nao ha servidor de e-mail neste
 * projeto: sem isso, ninguem conseguiria concluir o proprio cadastro.
 */
public record NovoUsuarioDoKeycloak(
        String username,
        String email,
        String firstName,
        String lastName,
        boolean enabled,
        boolean emailVerified,
        List<Credencial> credentials) {

    /**
     * O perfil padrao do Keycloak exige `lastName` para liberar o direct grant.
     * Pessoas com nome de uma palavra continuam validas no dominio; este valor
     * e apenas a representacao interna da ausencia de sobrenome no provedor.
     */
    public static final String SOBRENOME_AUSENTE = "-";

    public static NovoUsuarioDoKeycloak de(
            String login, String email, String primeiroNome, String sobrenome, String senha) {
        String sobrenomeDoProvedor = sobrenome == null || sobrenome.isBlank()
                ? SOBRENOME_AUSENTE
                : sobrenome;
        return new NovoUsuarioDoKeycloak(
                login, email, primeiroNome, sobrenomeDoProvedor,
                true, true, List.of(Credencial.de(senha)));
    }

    /** `temporary=false`: senha definitiva, sem tela de troca no primeiro acesso. */
    public record Credencial(String type, String value, boolean temporary) {

        static Credencial de(String senha) {
            return new Credencial("password", senha, false);
        }
    }
}
