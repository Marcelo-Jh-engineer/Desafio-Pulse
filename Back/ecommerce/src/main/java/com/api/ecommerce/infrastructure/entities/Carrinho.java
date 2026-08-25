package com.api.ecommerce.infrastructure.entities;

import com.api.ecommerce.infrastructure.enums.StatusCarrinho;
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
import java.util.Optional;
import java.util.UUID;
import lombok.Getter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;


@Entity
@Table(name = "tb_carrinhos")
@Getter
public class Carrinho {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private UUID idPublico = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private StatusCarrinho status = StatusCarrinho.ABERTO;

    @OneToMany(mappedBy = "carrinho", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ItemCarrinho> itens = new ArrayList<>();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant criadoEm;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant atualizadoEm;

    protected Carrinho() {
        // Exigido pelo JPA.
    }

    public Carrinho(Usuario usuario) {
        this.usuario = usuario;
    }

    /**
     * Adicionar um produto que ja esta no carrinho SOMA na linha existente, em
     * vez de criar uma segunda — e o que o contrato pede, e tambem o que a
     * unique (carrinho_id, produto_id) exige.
     */
    public ItemCarrinho adicionar(Produto produto, int quantidade) {
        Optional<ItemCarrinho> existente = jaExisteItem(produto);
        if (existente.isPresent()) {
            ItemCarrinho item = existente.get();
            item.alterarQuantidade(item.getQuantidade() + quantidade);
            return item;
        }
        ItemCarrinho item = new ItemCarrinho(this, produto, quantidade);
        itens.add(item);
        return item;
    }

    /** Chegar a zero remove a linha, em vez de guardar um item de quantidade 0. */
    public void alterarQuantidade(Produto produto, int quantidade) {
        Optional<ItemCarrinho> linha = jaExisteItem(produto);
        if (linha.isEmpty()) {
            return;
        }
        if (quantidade <= 0) {
            itens.remove(linha.get());
            return;
        }
        linha.get().alterarQuantidade(quantidade);
    }

    public void remover(Produto produto) {
        jaExisteItem(produto).ifPresent(itens::remove);
    }

    public void esvaziar() {
        itens.clear();
    }

    public void converter() {
        this.status = StatusCarrinho.CONVERTIDO;
    }

    public void abandonar() {
        this.status = StatusCarrinho.ABANDONADO;
    }

    /**
     * Total do carrinho: `preco * quantidade` de cada linha, somado.
     *
     * Calculado aqui, e nao gravado em coluna nem somado pelo banco. Gravado,
     * seria um numero capaz de discordar das linhas que o formam. Somado pelo
     * banco — o @Formula do Hibernate faria isso — sairia certo na leitura e
     * desatualizado logo depois de adicionar um item, porque so recalcula no
     * SELECT seguinte; para a resposta sair correta seria preciso um flush e um
     * refresh a cada mudanca.
     *
     * Do jeito que esta, o valor acompanha a lista em memoria e nao depende de
     * ida ao banco. O preco usado e o da LINHA, congelado quando o item entrou,
     * e nao o do produto hoje: o carrinho mostra o valor que a pessoa viu ao
     * adicionar, e a divergencia com o catalogo e assunto do checkout
     * (RF-CHK-08).
     *
     * Carrinho sem item soma zero, nao nulo.
     */
    public long totalEmCentavos() {
        return itens.stream().mapToLong(ItemCarrinho::getTotalLinhaEmCentavos).sum();
    }

    /** Soma das quantidades, nao o numero de linhas. */
    public int quantidadeItens() {
        return itens.stream().mapToInt(ItemCarrinho::getQuantidade).sum();
    }

    private Optional<ItemCarrinho> jaExisteItem(Produto produto) {
        return itens.stream().filter(item -> item.getProduto().equals(produto)).findFirst();
    }

    @Override
    public boolean equals(Object outro) {
        return outro instanceof Carrinho carrinho && idPublico.equals(carrinho.idPublico);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(idPublico);
    }
}
