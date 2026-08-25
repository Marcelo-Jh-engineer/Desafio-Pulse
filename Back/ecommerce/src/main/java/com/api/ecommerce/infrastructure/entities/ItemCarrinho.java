package com.api.ecommerce.infrastructure.entities;

import com.api.ecommerce.infrastructure.enums.Unidade;
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
import lombok.Getter;
import org.hibernate.annotations.CreationTimestamp;

/**
 * Linha do carrinho — docs/models.md secao 7.
 *
 * Nome, preco e unidade sao um retrato do produto no instante em que ele
 * entrou.
 *
 * A IMAGEM nao entra no retrato. Ela nao muda de valor como o preco muda: e
 * derivada do id do produto, que esta logo ali em `produto`. Copiar
 * `Produto.urlImagem` seria copiar nulo — a foto mora em tb_produto_imagens — e
 * ainda espalharia por aqui a regra de como montar o endereco dela, que hoje
 * vive num lugar so, em ServicoDeCatalogo. Nao e duplicacao por descuido: e o unico jeito de o checkout
 * perceber que o preco mudou desde entao e avisar antes de cobrar (RF-CHK-08).
 * A quantidade disponivel NAO entra no retrato — o teto e conferido contra o
 * estoque do momento, que e quem manda.
 */
@Entity
@Table(name = "tb_carrinho_itens")
@Getter
public class ItemCarrinho {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "carrinho_id", nullable = false)
    private Carrinho carrinho;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "produto_id", nullable = false)
    private Produto produto;

    @Column(nullable = false)
    private int quantidade;

    @Column(nullable = false, length = 160)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 3)
    private Unidade unidade;

    @Column(nullable = false)
    private long precoEmCentavos;

    /** Derivado, nunca digitado. O banco confere a multiplicacao num CHECK. */
    @Column(nullable = false)
    private long totalLinhaEmCentavos;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant adicionadoEm;

    protected ItemCarrinho() {
        // Exigido pelo JPA.
    }

    ItemCarrinho(Carrinho carrinho, Produto produto, int quantidade) {
        this.carrinho = carrinho;
        this.produto = produto;
        this.nome = produto.getNome();
        this.unidade = produto.getUnidade();
        this.precoEmCentavos = produto.getPrecoEmCentavos();
        alterarQuantidade(quantidade);
    }

    /**
     * Nao ha teto por linha: o unico limite e o estoque, conferido por
     * ServicoDeEstoque antes de esta linha ser tocada. Um teto fixo aqui seria
     * uma segunda regra sobre quantidade, sem nada que a justifique.
     */
    void alterarQuantidade(int quantidade) {
        if (quantidade < 1) {
            throw new IllegalArgumentException("Quantidade precisa ser pelo menos 1");
        }
        this.quantidade = quantidade;
        this.totalLinhaEmCentavos = precoEmCentavos * quantidade;
    }

    /** O preco do catalogo andou desde que o item entrou no carrinho. */
    public boolean precoDivergiu() {
        return precoEmCentavos != produto.getPrecoEmCentavos();
    }
}
