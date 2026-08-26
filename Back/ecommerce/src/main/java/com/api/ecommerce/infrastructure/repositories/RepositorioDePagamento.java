package com.api.ecommerce.infrastructure.repositories;

import com.api.ecommerce.infrastructure.entities.Pagamento;
import com.api.ecommerce.infrastructure.enums.StatusPagamento;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RepositorioDePagamento extends JpaRepository<Pagamento, Long> {

    Optional<Pagamento> findByIdPublico(UUID idPublico);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"pedido", "pedido.itens", "pedido.itens.produto"})
    @Query("SELECT p FROM Pagamento p WHERE p.idPublico = :idPublico")
    Optional<Pagamento> travarParaProcessamento(@Param("idPublico") UUID idPublico);

    List<Pagamento> findByPedidoIdPublicoOrderByCriadoEmDesc(UUID idPublicoDoPedido);

    Optional<Pagamento> findByPedidoIdPublicoAndStatus(UUID idPublicoDoPedido, StatusPagamento status);


    List<Pagamento> findByStatusAndExpiraEmBefore(StatusPagamento status, Instant limite);
}
