package com.api.ecommerce.infrastructure.entities;

import com.api.ecommerce.infrastructure.enums.StatusPedido;
import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import lombok.Getter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * Pedido — docs/models.md secao 9.
 *
 * O pedido CONGELA tudo que o comprovante precisa: nome e preco de cada item e
 * os dados de quem comprou. Editar o produto ou o perfil depois nao mexe em
 * pedido passado, entao nada aqui e lido por juncao viva.
 *
 * Nao ha frete, endereco de entrega nem numero legivel: o pedido registra o
 * que foi comprado, por quem e por quanto. Quem o identifica e o `idPublico`,
 * em toda parte — URL, comprovante e suporte.
 *
 * A baixa de estoque NAO acontece na criacao. Ela acontece quando o pagamento
 * e aprovado, na transicao para PAGO — enquanto o pedido esta PENDENTE o
 * estoque continua intocado, e e por isso que o checkout revalida a
 * disponibilidade antes de cobrar.
 */
@Entity
@Table(name = "tb_pedidos")
@Getter
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private UUID idPublico = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    /** De onde o pedido nasceu. Nulo se o carrinho tiver sido apagado depois. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "carrinho_id")
    private Carrinho carrinho;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private StatusPedido status = StatusPedido.PENDENTE;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ItemPedido> itens = new ArrayList<>();

    /**
     * Soma das linhas. Uma coluna so: sem frete, subtotal e total seriam
     * sempre o mesmo numero, e dois campos que nunca discordam sao apenas uma
     * chance a mais de discordarem por engano.
     */
    @Column(nullable = false)
    private long totalEmCentavos;

    @Column(nullable = false, length = 120)
    private String nomeComprador;

    @Column(nullable = false, length = 255)
    private String emailComprador;

    /** Mascarado na exibicao quando e documento; aqui fica so com digitos. */
    @Column(nullable = false, length = 255)
    private String loginComprador;

    /**
     * Repetir o envio do checkout — clique duplo, retomada de rede — devolve o
     * pedido que ja existe em vez de cobrar duas vezes.
     */
    @Column(nullable = false, updatable = false, length = 80)
    private String chaveIdempotencia;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant criadoEm;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant atualizadoEm;

    private Instant pagoEm;

    @Column(length = 160)
    private String motivoRecusa;

    protected Pedido() {
        // Exigido pelo JPA.
    }

    public Pedido(Usuario usuario, Carrinho carrinho, String chaveIdempotencia) {
        this.usuario = usuario;
        this.carrinho = carrinho;
        this.chaveIdempotencia = chaveIdempotencia;
        // Retrato do comprador: o pedido nao depende do usuario atual.
        this.nomeComprador = usuario.getNome();
        this.emailComprador = usuario.getEmail();
        this.loginComprador = usuario.getLogin();
        recalcularTotais();
    }

    /**
     * Copia uma linha do carrinho para dentro do pedido (D2, RF-PED-03).
     *
     * O parametro e a LINHA, e nao o produto: e a linha que guarda o preco que
     * a pessoa viu ao adicionar o item. Um `adicionar(Produto, int)` existiria
     * ao lado deste como um segundo caminho — o que cobra o preco de hoje — e
     * bastaria alguem chamar o errado para o cliente pagar valor que nunca lhe
     * foi mostrado.
     */
    public void adicionar(ItemCarrinho linhaDoCarrinho) {
        itens.add(new ItemPedido(this, linhaDoCarrinho));
        recalcularTotais();
    }

    /**
     * Transicao para PAGO. Quem chama e responsavel por baixar o estoque dos
     * itens na mesma transacao — as duas coisas sao um fato so.
     */
    public void marcarPago(Instant quando) {
        exigirTransicaoPara(StatusPedido.PAGO);
        this.status = StatusPedido.PAGO;
        this.pagoEm = quando;
        this.motivoRecusa = null;
    }

    /** Recuperavel: o cliente tenta pagar de novo sem perder o pedido. */
    public void marcarFalhou(String motivo) {
        exigirTransicaoPara(StatusPedido.FALHOU);
        this.status = StatusPedido.FALHOU;
        this.motivoRecusa = motivo;
    }

    public void cancelar() {
        exigirTransicaoPara(StatusPedido.CANCELADO);
        this.status = StatusPedido.CANCELADO;
    }

    /**
     * Um pedido FALHOU volta para PENDENTE quando a pessoa tenta de novo. E a
     * unica volta permitida, e existe porque o contrato chama FALHOU de
     * recuperavel.
     */
    public void reabrirParaNovaTentativa() {
        if (status != StatusPedido.FALHOU) {
            throw new IllegalStateException("So pedido em FALHOU aceita nova tentativa");
        }
        this.status = StatusPedido.PENDENTE;
        this.motivoRecusa = null;
    }

    private void exigirTransicaoPara(StatusPedido destino) {
        if (!status.podeIrPara(destino)) {
            throw new IllegalStateException(
                    "Transicao invalida de " + status + " para " + destino);
        }
    }

    private void recalcularTotais() {
        this.totalEmCentavos = itens.stream()
                .mapToLong(ItemPedido::getTotalLinhaEmCentavos)
                .sum();
    }

    @Override
    public boolean equals(Object outro) {
        return outro instanceof Pedido pedido && idPublico.equals(pedido.idPublico);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(idPublico);
    }
}
