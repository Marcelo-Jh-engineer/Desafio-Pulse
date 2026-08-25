package com.api.ecommerce.infrastructure.entities;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.api.ecommerce.infrastructure.enums.StatusCarrinho;
import com.api.ecommerce.infrastructure.enums.Unidade;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * As regras que vivem na propria entidade: o retrato do produto na linha, a
 * conta do total da linha e o que acontece ao somar ou tirar quantidade.
 *
 * Sem banco e sem Spring: sao regras de objeto. O que o banco decide — o
 * indice de um carrinho aberto por pessoa, os CHECK — nao tem cobertura
 * automatizada, por decisao registrada no CLAUDE.md.
 */
@DisplayName("Carrinho e suas linhas")
class CarrinhoTest {

    private Usuario maria() {
        return new Usuario(UUID.randomUUID(), "Maria Souza", "maria@exemplo.com", "11144477735");
    }

    private Produto banana() {
        Categoria hortifruti = new Categoria("Hortifruti", "Frutas", null, (short) 1, true);
        return new Produto("Banana Prata", "Banana madura", 649, Unidade.KG,
                null, hortifruti, 84, true);
    }

    @Test
    @DisplayName("nasce ABERTO e pertencendo a quem o criou")
    void nasceAbertoComDono() {
        Usuario dona = maria();

        Carrinho carrinho = new Carrinho(dona);

        assertThat(carrinho.getStatus()).isEqualTo(StatusCarrinho.ABERTO);
        assertThat(carrinho.getUsuario()).isSameAs(dona);
        assertThat(carrinho.getItens()).isEmpty();
    }

    @Test
    @DisplayName("a linha copia preco e unidade do produto, e nao aponta para ele")
    void linhaCongelaPrecoEUnidade() {
        Produto produto = banana();
        Carrinho carrinho = new Carrinho(maria());

        ItemCarrinho item = carrinho.adicionar(produto, 3);

        assertThat(item.getPrecoEmCentavos()).isEqualTo(produto.getPrecoEmCentavos());
        assertThat(item.getUnidade()).isEqualTo(produto.getUnidade());
        assertThat(item.getNome()).isEqualTo(produto.getNome());

        // O congelamento so prova alguma coisa quando o produto muda depois.
        produto.alterarPreco(999);

        assertThat(item.getPrecoEmCentavos()).isEqualTo(649);
        assertThat(item.precoDivergiu()).isTrue();
    }

    @Test
    @DisplayName("total da linha e preco congelado vezes quantidade")
    void totalDaLinha() {
        Carrinho carrinho = new Carrinho(maria());

        ItemCarrinho item = carrinho.adicionar(banana(), 3);

        assertThat(item.getTotalLinhaEmCentavos()).isEqualTo(649L * 3);
    }

    @Test
    @DisplayName("adicionar o mesmo produto soma na linha, em vez de criar outra")
    void somaNaLinhaExistente() {
        Carrinho carrinho = new Carrinho(maria());
        Produto produto = banana();

        carrinho.adicionar(produto, 2);
        carrinho.adicionar(produto, 3);

        assertThat(carrinho.getItens()).hasSize(1);
        assertThat(carrinho.getItens().get(0).getQuantidade()).isEqualTo(5);
        assertThat(carrinho.getItens().get(0).getTotalLinhaEmCentavos()).isEqualTo(649L * 5);
    }

    @Test
    @DisplayName("quantidade zero remove a linha, em vez de guardar um item de zero")
    void zeroRemoveALinha() {
        Carrinho carrinho = new Carrinho(maria());
        Produto produto = banana();
        carrinho.adicionar(produto, 2);

        carrinho.alterarQuantidade(produto, 0);

        assertThat(carrinho.getItens()).isEmpty();
    }

    @Test
    @DisplayName("nao ha teto por linha: quantidade grande passa, o limite e o estoque")
    void semTetoPorLinha() {
        Carrinho carrinho = new Carrinho(maria());

        // Quem barra por estoque e ServicoDeEstoque, antes de chegar aqui. A
        // entidade so recusa o que nem chega a ser um pedido.
        ItemCarrinho item = carrinho.adicionar(banana(), 500);
        assertThat(item.getQuantidade()).isEqualTo(500);

        assertThatThrownBy(() -> carrinho.adicionar(banana(), 0))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("quantidadeItens soma as quantidades, nao conta as linhas")
    void quantidadeItens() {
        Categoria mercearia = new Categoria("Mercearia", null, null, (short) 5, true);
        Produto arroz = new Produto("Arroz", "Arroz tipo 1", 2799, Unidade.PCT,
                null, mercearia, 200, true);

        Carrinho carrinho = new Carrinho(maria());
        carrinho.adicionar(banana(), 3);
        carrinho.adicionar(arroz, 2);

        assertThat(carrinho.getItens()).hasSize(2);
        assertThat(carrinho.quantidadeItens()).isEqualTo(5);
    }
}
