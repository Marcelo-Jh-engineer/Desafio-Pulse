package com.api.ecommerce.infrastructure.repositories;

import com.api.ecommerce.infrastructure.entities.Pedido;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/**
 * Pedidos.
 *
 * Toda leitura de pedido e sempre por dono: a consulta recebe o `sub` de quem
 * pediu e nunca so o id do pedido. Buscar pelo id e conferir o dono depois
 * funciona, mas basta um caminho esquecer a conferencia para o pedido de um
 * cliente aparecer para outro.
 */
public interface RepositorioDePedido extends JpaRepository<Pedido, Long> {

    @EntityGraph(attributePaths = {"itens", "usuario"})
    Optional<Pedido> findByIdPublicoAndUsuarioKeycloakSub(UUID idPublico, UUID keycloakSub);

    @EntityGraph(attributePaths = {"itens", "usuario"})
    Optional<Pedido> findByNumeroAndUsuarioKeycloakSub(String numero, UUID keycloakSub);

    /** Reenvio do checkout: devolve o pedido que ja existe em vez de duplicar. */
    @EntityGraph(attributePaths = {"itens", "usuario"})
    Optional<Pedido> findByUsuarioKeycloakSubAndChaveIdempotencia(UUID keycloakSub, String chave);

    @EntityGraph(attributePaths = "itens")
    Page<Pedido> findByUsuarioKeycloakSubOrderByCriadoEmDesc(UUID keycloakSub, Pageable paginacao);

    /**
     * Proximo valor da sequencia do banco, para montar "PED-2026-000123".
     *
     * Sequencia, e nao MAX(numero) + 1: duas compras simultaneas lendo a
     * contagem da tabela chegariam ao mesmo numero, e o numero e justamente o
     * que o cliente usa para falar do pedido.
     */
    @Query(value = "SELECT nextval('sq_numero_pedido')", nativeQuery = true)
    long proximoNumeroDeSequencia();
}
