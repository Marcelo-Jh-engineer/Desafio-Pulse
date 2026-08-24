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
import java.util.Objects;
import java.util.UUID;
import lombok.Getter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * Produto do catalogo — docs/models.md secao 4.
 *
 * O estoque mora aqui porque so tem um caminho de escrita: a baixa na
 * aprovacao do pagamento. Nao existe entrada, ajuste manual nem tela de
 * movimentacao — e por isso tambem nao existe historico para guardar.
 */
@Entity
@Table(name = "tb_produtos")
@Getter
public class Produto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private UUID idPublico = UUID.randomUUID();

    @Column(nullable = false, length = 40)
    private String sku;

    @Column(nullable = false, length = 180)
    private String slug;

    @Column(nullable = false, length = 160)
    private String nome;

    @Column(nullable = false, columnDefinition = "text")
    private String descricao;

    /** Inteiro em centavos, sempre. Ponto flutuante para dinheiro nao entra. */
    @Column(nullable = false)
    private long precoEmCentavos;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 3)
    private Unidade unidade = Unidade.UN;

    /**
     * Caminho para a foto servida em outro lugar — os /produtos/*.jpg da carga
     * inicial, por exemplo. Fica nulo quando a imagem esta gravada no banco,
     * em ImagemDeProduto: sao duas origens possiveis para a mesma foto, e
     * nenhum produto precisa das duas.
     *
     * Nulo aqui nao chega ao front. A API sempre devolve `urlImagem` como
     * texto, apontando para o arquivo externo ou para o endereco que serve os
     * bytes guardados — quem resolve isso e um ponto so, na montagem do DTO.
     */
    @Column(length = 255)
    private String urlImagem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "categoria_id", nullable = false)
    private Categoria categoria;

    @Column(nullable = false)
    private int quantidadeEstoque;

    @Column(nullable = false)
    private boolean ativo = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant criadoEm;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant atualizadoEm;

    protected Produto() {
        // Exigido pelo JPA.
    }

    public Produto(String sku, String slug, String nome, String descricao,
                   long precoEmCentavos, Unidade unidade, String urlImagem,
                   Categoria categoria, int quantidadeEstoque, boolean ativo) {
        this.sku = sku;
        this.slug = slug;
        this.nome = nome;
        this.descricao = descricao;
        this.precoEmCentavos = precoEmCentavos;
        this.unidade = unidade;
        this.urlImagem = urlImagem;
        this.categoria = categoria;
        this.quantidadeEstoque = quantidadeEstoque;
        this.ativo = ativo;
    }

    /** Produto sem estoque continua listado; o que some e o botao de compra. */
    public boolean estaDisponivel() {
        return ativo && quantidadeEstoque > 0;
    }

    /**
     * Unico caminho de saida do estoque, chamado na transicao do pedido para
     * PAGO. Recusa em vez de gravar negativo: a constraint do banco tambem
     * barraria, mas com uma mensagem que nao serve para mostrar a ninguem.
     */
    public void baixarEstoque(int quantidade) {
        if (quantidade <= 0) {
            throw new IllegalArgumentException("Quantidade da baixa precisa ser positiva");
        }
        if (quantidade > quantidadeEstoque) {
            throw new IllegalStateException(
                    "Estoque insuficiente para o produto " + sku);
        }
        this.quantidadeEstoque -= quantidade;
    }

    /** O admin ajusta preco; pedido ja feito guarda o preco antigo congelado. */
    public void alterarPreco(long precoEmCentavos) {
        if (precoEmCentavos <= 0) {
            throw new IllegalArgumentException("Preco precisa ser inteiro positivo em centavos");
        }
        this.precoEmCentavos = precoEmCentavos;
    }

    public void alterarDados(String nome, String slug, String descricao, Unidade unidade,
                             String urlImagem, Categoria categoria, boolean ativo) {
        this.nome = nome;
        this.slug = slug;
        this.descricao = descricao;
        this.unidade = unidade;
        this.urlImagem = urlImagem;
        this.categoria = categoria;
        this.ativo = ativo;
    }

    @Override
    public boolean equals(Object outro) {
        return outro instanceof Produto produto && idPublico.equals(produto.idPublico);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(idPublico);
    }
}
