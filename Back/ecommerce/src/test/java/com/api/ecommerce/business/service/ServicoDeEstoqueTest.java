package com.api.ecommerce.business.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.api.ecommerce.infrastructure.entities.Categoria;
import com.api.ecommerce.infrastructure.entities.Produto;
import com.api.ecommerce.infrastructure.enums.Unidade;
import com.api.ecommerce.infrastructure.exception.ExcecaoDeEstoqueInsuficiente;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

/**
 * A regra de estoque, sozinha. Sem Spring e sem banco: e uma decisao sobre dois
 * numeros inteiros, e testa-la com um PostgreSQL de pe seria pagar segundos por
 * nada.
 *
 * <h2>O que "estoque" e "unidade" significam aqui</h2>
 *
 * `quantidadeEstoque` conta UNIDADES DE VENDA, sempre inteiro. `unidade` diz
 * apenas qual e o nome dessa unidade na etiqueta — ela NAO converte nada e NAO
 * entra em conta nenhuma.
 *
 * Para a Banana Prata, vendida por quilo:
 *
 * <pre>
 *   precoEmCentavos    649   ->  R$ 6,49 por QUILO
 *   quantidadeEstoque   84   ->  84 quilos disponiveis
 *   comprar 3           ->  3 quilos, 3 x 649 = 1947 centavos
 * </pre>
 *
 * Ou seja: nao existe "por cem gramas". Quem quer meio quilo nao tem como
 * pedir — a menor compra e 1 quilo. Isso e uma limitacao real do modelo atual,
 * herdada de docs/models.md secao 4 ("a unidade e so rotulo"), e nao um detalhe
 * de implementacao. Vender fracao de quilo exige mudar o tipo da quantidade no
 * banco e no dominio, nao ajustar este teste.
 */
@DisplayName("Servico de estoque")
class ServicoDeEstoqueTest {

    /** R$ 6,49. Por QUILO, porque a Banana Prata e vendida em Unidade.KG. */
    private static final long PRECO_POR_QUILO_EM_CENTAVOS = 649;

    private final ServicoDeEstoque servico = new ServicoDeEstoque();

    /**
     * Banana vendida por quilo. `quilosEmEstoque` sao quilos inteiros: 84
     * significa 84 quilos na prateleira, e nao 84 pacotes nem 8,4 kg.
     */
    private Produto bananaCom(int quilosEmEstoque) {
        return bananaCom(quilosEmEstoque, true);
    }

    private Produto bananaCom(int quilosEmEstoque, boolean ativo) {
        Categoria hortifruti = new Categoria("Hortifruti", "Frutas", null, (short) 1, true);

        return new Produto(
                "Banana Prata",
                "Banana madura",
                PRECO_POR_QUILO_EM_CENTAVOS,
                Unidade.KG,
                null,
                hortifruti,
                quilosEmEstoque,
                ativo);
    }

    @Test
    @DisplayName("a unidade e rotulo: KG e UN passam pela mesma regra, com os mesmos numeros")
    void unidadeNaoEntraNaConta() {
        Categoria mercearia = new Categoria("Mercearia", null, null, (short) 5, true);

        Produto porQuilo = bananaCom(3);
        Produto porPacote = new Produto("Arroz Tipo 1", "Pacote de 5 kg", 2799,
                Unidade.PCT, null, mercearia, 3, true);

        // Este teste existe para fixar a semantica, nao para exercitar um `if`:
        // se um dia a unidade passar a converter alguma coisa, ele quebra e
        // obriga a decisao a ser tomada de novo, no lugar certo.
        assertThat(servico.temDisponibilidade(porQuilo, 3)).isTrue();
        assertThat(servico.temDisponibilidade(porPacote, 3)).isTrue();

        assertThat(servico.temDisponibilidade(porQuilo, 4)).isFalse();
        assertThat(servico.temDisponibilidade(porPacote, 4)).isFalse();
    }

    @Nested
    @DisplayName("deixa passar")
    class DeixaPassar {

        @Test
        @DisplayName("3 quilos pedidos, 84 quilos na prateleira")
        void comFolga() {
            assertThat(servico.temDisponibilidade(bananaCom(84), 3)).isTrue();
        }

        @Test
        @DisplayName("1 quilo pedido, 1 quilo na prateleira — a ultima unidade e vendavel")
        void ultimaUnidade() {
            Produto ultimoQuilo = bananaCom(1);

            // Esta e a razao de a comparacao ser `>=` e nao `>`. Com `>`, um
            // produto de estoque 1 nunca sairia da prateleira.
            servico.exigirDisponibilidade(ultimoQuilo, 1);

            assertThat(servico.temDisponibilidade(ultimoQuilo, 1)).isTrue();
        }
    }

    @Nested
    @DisplayName("recusa")
    class Recusa {

        @Test
        @DisplayName("3 quilos pedidos, 2 na prateleira — e diz que restam 2")
        void acimaDoEstoque() {
            assertThatThrownBy(() -> servico.exigirDisponibilidade(bananaCom(2), 3))
                    .isInstanceOf(ExcecaoDeEstoqueInsuficiente.class)
                    .hasMessageContaining("2")
                    .extracting(erro -> ((ExcecaoDeEstoqueInsuficiente) erro).getDisponivel())
                    .isEqualTo(2);
        }

        @Test
        @DisplayName("prateleira vazia")
        void estoqueZerado() {
            assertThatThrownBy(() -> servico.exigirDisponibilidade(bananaCom(0), 1))
                    .isInstanceOf(ExcecaoDeEstoqueInsuficiente.class)
                    .hasMessageContaining("sem estoque");
        }

        @Test
        @DisplayName("produto inativo, mesmo com 12 quilos na prateleira")
        void produtoInativo() {
            // Estoque nao e o problema aqui: o produto saiu de linha. A
            // mensagem tem de dizer isso, senao quem le volta amanha esperando
            // reposicao que nao vem.
            assertThatThrownBy(() -> servico.exigirDisponibilidade(bananaCom(12, false), 1))
                    .isInstanceOf(ExcecaoDeEstoqueInsuficiente.class)
                    .hasMessageContaining("não está mais disponível");

            assertThat(servico.temDisponibilidade(bananaCom(12, false), 1)).isFalse();
        }

        @Test
        @DisplayName("quantidade zero ou negativa nao e pedido, e erro de quem chamou")
        void quantidadeInvalida() {
            assertThatThrownBy(() -> servico.exigirDisponibilidade(bananaCom(84), 0))
                    .isInstanceOf(IllegalArgumentException.class);

            assertThatThrownBy(() -> servico.exigirDisponibilidade(bananaCom(84), -1))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }
}
