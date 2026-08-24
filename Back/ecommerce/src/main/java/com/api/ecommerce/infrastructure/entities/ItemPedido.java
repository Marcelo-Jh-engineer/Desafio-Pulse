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
import lombok.Getter;

/**
 * Linha do pedido — docs/models.md secao 9.
 *
 * Nome, unidade e preco sao copia, congelados na compra. A referencia ao
 * produto continua ali para o link "comprar de novo", mas nenhum campo exibido
 * e lido dela: alterar o preco no catalogo nao pode reescrever a historia de
 * um pedido que ja aconteceu.
 */
@Entity
@Table(name = "tb_pedido_itens")
@Getter
public class ItemPedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pedido_id", nullable = false)
    private Pedido pedido;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "produto_id", nullable = false)
    private Produto produto;

    @Column(nullable = false, length = 160)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 3)
    private Unidade unidade;

    @Column(nullable = false)
    private int quantidade;

    @Column(nullable = false)
    private long precoEmCentavos;

    @Column(nullable = false)
    private long totalLinhaEmCentavos;

    protected ItemPedido() {
        // Exigido pelo JPA.
    }

    ItemPedido(Pedido pedido, Produto produto, int quantidade) {
        if (quantidade < 1) {
            throw new IllegalArgumentException("Quantidade do item precisa ser positiva");
        }
        this.pedido = pedido;
        this.produto = produto;
        this.nome = produto.getNome();
        this.unidade = produto.getUnidade();
        this.precoEmCentavos = produto.getPrecoEmCentavos();
        this.quantidade = quantidade;
        this.totalLinhaEmCentavos = precoEmCentavos * quantidade;
    }
}
