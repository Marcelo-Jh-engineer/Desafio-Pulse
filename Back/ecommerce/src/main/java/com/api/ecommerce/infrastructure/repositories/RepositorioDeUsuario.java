package com.api.ecommerce.infrastructure.repositories;

import com.api.ecommerce.infrastructure.entities.Usuario;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Espelho local do usuario.
 *
 * A busca e sempre pelo `sub` do token: e o unico identificador que o Keycloak
 * garante nunca reaproveitar, e o unico que chega em toda requisicao
 * autenticada sem precisar de consulta nenhuma.
 *
 * Nao existe busca por login aqui de proposito. Quem resolve credencial e o
 * Keycloak; procurar por documento nesta tabela colocaria dado pessoal em
 * parametro de consulta e em plano de execucao registrado (LGPD).
 */
public interface RepositorioDeUsuario extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByKeycloakSub(UUID keycloakSub);

    boolean existsByKeycloakSub(UUID keycloakSub);
}
