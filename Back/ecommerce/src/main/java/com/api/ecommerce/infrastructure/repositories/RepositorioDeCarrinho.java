package com.api.ecommerce.infrastructure.repositories;

import com.api.ecommerce.infrastructure.entities.Carrinho;
import com.api.ecommerce.infrastructure.enums.StatusCarrinho;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Carrinho do servidor.
 *
 * Um carrinho ABERTO por pessoa — a regra e do indice parcial no banco, e este
 * repositorio so a acompanha: a consulta por usuario devolve no maximo um.
 */
public interface RepositorioDeCarrinho extends JpaRepository<Carrinho, Long> {

    /**
     * As linhas vem junto porque quem pede o carrinho quer o carrinho inteiro:
     * buscar o cabecalho e depois os itens seria duas idas para uma tela so.
     */
    @EntityGraph(attributePaths = {"itens", "itens.produto"})
    Optional<Carrinho> findByUsuarioKeycloakSubAndStatus(UUID keycloakSub, StatusCarrinho status);

    @EntityGraph(attributePaths = {"itens", "itens.produto"})
    Optional<Carrinho> findByIdPublico(UUID idPublico);

    default Optional<Carrinho> abertoDe(UUID keycloakSub) {
        return findByUsuarioKeycloakSubAndStatus(keycloakSub, StatusCarrinho.ABERTO);
    }
}
