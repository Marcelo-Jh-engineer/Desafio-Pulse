package com.api.ecommerce.infrastructure.repositories;

import com.api.ecommerce.infrastructure.entities.Pagamento;
import com.api.ecommerce.infrastructure.enums.StatusPagamento;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Tentativas de pagamento.
 *
 * O historico fica: um pedido pode ter varias tentativas recusadas antes da
 * que aprova, e o cliente precisa poder tentar de novo sem perder o pedido.
 * Aprovada, porem, so pode existir uma — quem garante isso e o indice unico
 * parcial em tb_pagamentos, nao uma verificacao em codigo.
 */
public interface RepositorioDePagamento extends JpaRepository<Pagamento, Long> {

    Optional<Pagamento> findByIdPublico(UUID idPublico);

    List<Pagamento> findByPedidoIdPublicoOrderByCriadoEmDesc(UUID idPublicoDoPedido);

    Optional<Pagamento> findByPedidoIdPublicoAndStatus(UUID idPublicoDoPedido, StatusPagamento status);

    /**
     * Cobrancas de Pix que passaram do prazo sem confirmacao.
     *
     * O Pix nao avisa que expirou: ele simplesmente nao e pago. Sem alguem
     * varrendo por tempo, a cobranca ficaria AGUARDANDO para sempre e o pedido
     * nunca chegaria a um desfecho.
     */
    List<Pagamento> findByStatusAndExpiraEmBefore(StatusPagamento status, Instant limite);
}
