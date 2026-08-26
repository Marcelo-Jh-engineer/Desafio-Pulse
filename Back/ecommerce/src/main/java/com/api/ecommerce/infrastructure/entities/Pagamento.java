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

    /**
     * Quando o consumidor deu o desfecho. NULO enquanto a tentativa espera na
     * fila — e e por esse nulo que o cliente sabe que ainda nao ha resposta.
     */
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


    public static Pagamento solicitado(Pedido pedido, MetodoPagamento metodo) {
        return new Pagamento(pedido, metodo, StatusPagamento.PENDENTE, null);
    }

    /** O gateway aprovou. Quem chama baixa o estoque na mesma transacao. */
    public void aprovar(Instant quando) {
        exigirTransicaoPara(StatusPagamento.APROVADO);
        this.status = StatusPagamento.APROVADO;
        this.processadoEm = quando;
        this.motivoRecusa = null;
    }

    /**
     * O gateway recusou, ou o estoque nao cobriu a compra.
     *
     * O motivo gravado aqui e o DESTA tentativa. O do pedido, quando ele e
     * cancelado, e outro campo e outro fato: um diz por que esta cobranca nao
     * passou, o outro por que a compra acabou.
     */
    public void recusar(String motivo, Instant quando) {
        exigirTransicaoPara(StatusPagamento.RECUSADO);
        this.status = StatusPagamento.RECUSADO;
        this.motivoRecusa = motivo;
        this.processadoEm = quando;
    }

    /** Ainda sem desfecho: o consumidor nao pegou, ou o Pix nao foi pago. */
    public boolean estaEmAberto() {
        return status.estaEmAberto();
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
        aprovar(quando);
    }

    public void expirar(Instant quando) {
        exigirEspera();
        recusar("O prazo do Pix expirou", quando);
    }

    public boolean venceu(Instant agora) {
        return expiraEm != null && agora.isAfter(expiraEm);
    }

    private void exigirEspera() {
        if (status != StatusPagamento.AGUARDANDO) {
            throw new IllegalStateException("Pagamento ja resolvido: " + status);
        }
    }

    /**
     * A transicao passa pelo enum, e nao por um `if` aqui dentro.
     *
     * E esta guarda que torna a reentrega do broker inofensiva: uma segunda
     * entrega da mesma mensagem encontra APROVADO e nao tem para onde ir.
     */
    private void exigirTransicaoPara(StatusPagamento destino) {
        if (!status.podeIrPara(destino)) {
            throw new IllegalStateException(
                    "Transicao invalida de " + status + " para " + destino);
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
