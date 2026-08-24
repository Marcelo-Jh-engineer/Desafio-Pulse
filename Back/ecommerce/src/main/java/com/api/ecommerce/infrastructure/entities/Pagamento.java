package com.api.ecommerce.infrastructure.entities;

import com.api.ecommerce.infrastructure.enums.MetodoPagamento;
import com.api.ecommerce.infrastructure.enums.StatusPagamento;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import lombok.Getter;
import org.hibernate.annotations.CreationTimestamp;

/**
 * Desfecho de uma tentativa de pagamento — docs/models.md secao 10.
 *
 * Guarda o RESULTADO, nao o meio. Numero de cartao, parcelamento e codigo de
 * cobranca Pix sao assunto do gateway; do lado de ca fica apenas o que o pedido
 * precisa para mudar de estado: por qual caminho foi tentado, quanto, quando e
 * como terminou.
 *
 * Essa divisao tambem e a medida de seguranca sobre o cartao. Nao existe aqui
 * campo onde caiba numero, validade ou CVV — e a ausencia e proposital, nao
 * esquecimento: sem gateway proprio nao ha tokenizacao, e a unica forma segura
 * de guardar o numero e nao guardar.
 *
 * Cartao resolve na mesma requisicao: aprova ou recusa. Pix nao — a cobranca
 * nasce na hora e quem paga e o aplicativo do banco, depois. Dai AGUARDANDO e
 * o prazo em `expiraEm`, o unico dado do Pix que interessa deste lado: sem ele
 * a cobranca ficaria pendente para sempre.
 */
@Entity
@Table(name = "tb_pagamentos")
@Getter
public class Pagamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private UUID idPublico = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pedido_id", nullable = false)
    private Pedido pedido;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 6)
    private MetodoPagamento metodo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 11)
    private StatusPagamento status;

    @Column(nullable = false)
    private long valorEmCentavos;

    /** Prazo da cobranca Pix. Nulo no cartao, que nao espera. */
    private Instant expiraEm;

    @Column(length = 160)
    private String motivoRecusa;

    @Column(nullable = false)
    private Instant processadoEm;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant criadoEm;

    protected Pagamento() {
        // Exigido pelo JPA.
    }

    private Pagamento(Pedido pedido, MetodoPagamento metodo, StatusPagamento status,
                      Instant processadoEm) {
        this.pedido = pedido;
        this.metodo = metodo;
        this.status = status;
        this.valorEmCentavos = pedido.getTotalEmCentavos();
        this.processadoEm = processadoEm;
    }

    public static Pagamento aprovado(Pedido pedido, MetodoPagamento metodo, Instant quando) {
        return new Pagamento(pedido, metodo, StatusPagamento.APROVADO, quando);
    }

    public static Pagamento recusado(Pedido pedido, MetodoPagamento metodo,
                                     String motivo, Instant quando) {
        Pagamento pagamento = new Pagamento(pedido, metodo, StatusPagamento.RECUSADO, quando);
        pagamento.motivoRecusa = motivo;
        return pagamento;
    }

    /** Cobranca Pix criada: existe, tem prazo, e ninguem pagou ainda. */
    public static Pagamento aguardandoPix(Pedido pedido, Instant expiraEm, Instant quando) {
        Pagamento pagamento = new Pagamento(pedido, MetodoPagamento.PIX,
                StatusPagamento.AGUARDANDO, quando);
        pagamento.expiraEm = expiraEm;
        return pagamento;
    }

    /** O aplicativo do banco confirmou dentro do prazo. */
    public void confirmar(Instant quando) {
        exigirEspera();
        this.status = StatusPagamento.APROVADO;
        this.processadoEm = quando;
    }

    public void expirar(Instant quando) {
        exigirEspera();
        this.status = StatusPagamento.RECUSADO;
        this.motivoRecusa = "O prazo do Pix expirou";
        this.processadoEm = quando;
    }

    public boolean venceu(Instant agora) {
        return expiraEm != null && agora.isAfter(expiraEm);
    }

    private void exigirEspera() {
        if (status != StatusPagamento.AGUARDANDO) {
            throw new IllegalStateException("Pagamento ja resolvido: " + status);
        }
    }

    @Override
    public boolean equals(Object outro) {
        return outro instanceof Pagamento pagamento && idPublico.equals(pagamento.idPublico);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(idPublico);
    }
}
