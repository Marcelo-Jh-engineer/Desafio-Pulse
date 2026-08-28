package com.api.ecommerce.business.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.api.ecommerce.dtos.out.PedidoDtoOut;
import com.api.ecommerce.dtos.out.PedidoItemDtoOut;
import com.api.ecommerce.infrastructure.entities.Carrinho;
import com.api.ecommerce.infrastructure.entities.Categoria;
import com.api.ecommerce.infrastructure.entities.Pedido;
import com.api.ecommerce.infrastructure.entities.Produto;
import com.api.ecommerce.infrastructure.entities.Usuario;
import com.api.ecommerce.infrastructure.enums.StatusCarrinho;
import com.api.ecommerce.infrastructure.enums.StatusPedido;
import com.api.ecommerce.infrastructure.enums.Unidade;
import com.api.ecommerce.infrastructure.exception.ExcecaoDeConflito;
import com.api.ecommerce.infrastructure.exception.ExcecaoDeNaoEncontrado;
import com.api.ecommerce.infrastructure.repositories.RepositorioDeCarrinho;
import com.api.ecommerce.infrastructure.repositories.RepositorioDeEventoOutbox;
import com.api.ecommerce.infrastructure.repositories.RepositorioDePedido;
import com.api.ecommerce.infrastructure.repositories.RepositorioDeUsuario;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/**
 * O checkout com os repositorios dublados.
 *
 * Sem banco e sem Spring — decisao registrada no CLAUDE.md. O que se prova aqui
 * e a DECISAO: quando o carrinho vira pedido, quando nao vira, de onde sai o
 * preco cobrado, e o que a chave de idempotencia impede.
 *
 * ServicoDeEstoque entra de verdade, nao dublado: e logica pura, e substitui-lo
 * por mock provaria que o servico chama o mock, nao que o estoque foi
 * conferido. O mesmo vale para as entidades — Carrinho, Pedido e
 * as linhas sao objetos comuns aqui, e e neles que a conta do total acontece.
 *
 * Fora de cobertura, e registrado: os CHECK do banco, o indice parcial do
 * carrinho aberto e a UNIQUE (usuario_id, chave_idempotencia). Sem
 * Testcontainers, quem os confere e a subida da aplicacao.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("Servico de pedido")
class ServicoDePedidoTest {

    private static final UUID SUB = UUID.randomUUID();
    private static final String CHAVE = "checkout-1";

    @Mock private RepositorioDePedido pedidos;
    @Mock private RepositorioDeCarrinho carrinhos;
    @Mock private RepositorioDeUsuario usuarios;
    @Mock private RepositorioDeEventoOutbox eventos;

    private ServicoDePedido servico;
    private Usuario maria;
    private Produto banana;
    private Categoria hortifruti;

    @BeforeEach
    void preparar() {
        // O repositorio do outbox segue dublado, mas agora para provar o
        // contrario: o checkout nao encosta nele.
        servico = new ServicoDePedido(pedidos, carrinhos, usuarios, new ServicoDeEstoque());

        maria = new Usuario(SUB, "Maria Souza", "maria@exemplo.com", "11144477735");

        hortifruti = new Categoria("Hortifruti", "Frutas", null, (short) 1, true);
        banana = new Produto("Banana Prata", "Banana madura", 649, Unidade.KG,
                null, hortifruti, 84, true);

        when(usuarios.findByKeycloakSub(SUB)).thenReturn(Optional.of(maria));
        when(pedidos.findByUsuarioKeycloakSubAndChaveIdempotencia(any(), anyString()))
                .thenReturn(Optional.empty());
        when(pedidos.saveAndFlush(any(Pedido.class))).thenAnswer(chamada -> chamada.getArgument(0));
    }

    private Produto produto(String nome, long preco, int estoque, boolean ativo) {
        return new Produto(nome, "Descricao", preco, Unidade.UN, null, hortifruti, estoque, ativo);
    }

    /** Um carrinho ABERTO de Maria, ja com as linhas pedidas. */
    private Carrinho carrinhoCom(Produto produto, int quantidade) {
        Carrinho carrinho = new Carrinho(maria);
        carrinho.adicionar(produto, quantidade);
        when(carrinhos.abertoDe(SUB)).thenReturn(Optional.of(carrinho));
        return carrinho;
    }

    
    
    @Test
    @DisplayName("sem carrinho aberto nao ha o que fechar")
    void semCarrinhoNaoViraPedido() {
        when(carrinhos.abertoDe(SUB)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> servico.criar(SUB, CHAVE))
                .isInstanceOf(ExcecaoDeConflito.class)
                .hasMessageContaining("carrinho");

        verify(pedidos, never()).saveAndFlush(any());
    }

    
    @Test
    @DisplayName("produto inativo bloqueia o checkout, e o aviso diz que ele saiu de linha")
    void produtoInativoBloqueia() {
        Produto saiuDeLinha = produto("Iogurte de cupuacu", 599, 40, false);
        carrinhoCom(saiuDeLinha, 2);

        assertThatThrownBy(() -> servico.criar(SUB, CHAVE))
                .isInstanceOf(ExcecaoDeConflito.class)
                .satisfies(erro -> {
                    var porCampo = ((ExcecaoDeConflito) erro).getErrosPorCampo();
                    assertThat(porCampo).containsOnlyKeys(saiuDeLinha.getIdPublico().toString());
                    assertThat(porCampo.values().iterator().next())
                            .contains("não está mais disponível");
                });

        verify(pedidos, never()).saveAndFlush(any());
    }

    
    @Test
    @DisplayName("estoque insuficiente bloqueia, e o erro lista TODOS os itens com problema")
    void estoqueInsuficienteListaTodos() {
        Produto picanha = produto("Picanha", 8990, 1, true);
        Produto cafe = produto("Cafe torrado", 1899, 0, true);
        Produto arroz = produto("Arroz Tipo 1", 2799, 200, true);

        Carrinho carrinho = new Carrinho(maria);
        carrinho.adicionar(picanha, 3);
        carrinho.adicionar(cafe, 1);
        carrinho.adicionar(arroz, 2);
        when(carrinhos.abertoDe(SUB)).thenReturn(Optional.of(carrinho));

        assertThatThrownBy(() -> servico.criar(SUB, CHAVE))
                .isInstanceOf(ExcecaoDeConflito.class)
                .satisfies(erro -> {
                    var porCampo = ((ExcecaoDeConflito) erro).getErrosPorCampo();
                    // Os dois problemas juntos, e nao so o primeiro: corrigir um
                    // de cada vez faria a pessoa descobrir o seguinte depois.
                    assertThat(porCampo).containsOnlyKeys(
                            picanha.getIdPublico().toString(),
                            cafe.getIdPublico().toString());
                    assertThat(porCampo.get(picanha.getIdPublico().toString()))
                            .contains("Picanha").contains("3").contains("1");
                });

        // O que esta disponivel tambem nao passa: ou o pedido inteiro nasce, ou
        // nenhum nasce.
        verify(pedidos, never()).saveAndFlush(any());
    }

    
    @Test
    @DisplayName("o total do pedido e a soma dos totais das linhas")
    void totalSomaAsLinhas() {
        Produto arroz = produto("Arroz Tipo 1", 2799, 200, true);

        Carrinho carrinho = new Carrinho(maria);
        carrinho.adicionar(banana, 3);
        carrinho.adicionar(arroz, 2);
        when(carrinhos.abertoDe(SUB)).thenReturn(Optional.of(carrinho));

        PedidoDtoOut dto = servico.criar(SUB, CHAVE);

        assertThat(dto.totalEmCentavos()).isEqualTo(649L * 3 + 2799L * 2);
        assertThat(dto.totalEmCentavos()).isEqualTo(
                dto.itens().stream().mapToLong(PedidoItemDtoOut::totalLinhaEmCentavos).sum());
        // O total do pedido e exatamente o que o carrinho mostrava (RF-PED-04).
        assertThat(dto.totalEmCentavos()).isEqualTo(carrinho.totalEmCentavos());
        assertThat(dto.status()).isEqualTo(StatusPedido.PENDENTE);
    }

    
    @Test
    @DisplayName("o item do pedido copia nome, unidade e preco do item do carrinho")
    void itemCopiaDoCarrinho() {
        Carrinho carrinho = carrinhoCom(banana, 2);

        PedidoDtoOut dto = servico.criar(SUB, CHAVE);

        PedidoItemDtoOut linha = dto.itens().get(0);
        var doCarrinho = carrinho.getItens().get(0);

        assertThat(linha.produtoId()).isEqualTo(banana.getIdPublico().toString());
        assertThat(linha.nome()).isEqualTo(doCarrinho.getNome());
        assertThat(linha.unidade()).isEqualTo(doCarrinho.getUnidade());
        assertThat(linha.quantidade()).isEqualTo(doCarrinho.getQuantidade());
        assertThat(linha.precoEmCentavos()).isEqualTo(doCarrinho.getPrecoEmCentavos());
        assertThat(linha.totalLinhaEmCentavos()).isEqualTo(doCarrinho.getTotalLinhaEmCentavos());
    }

    @Test
    @DisplayName("o carrinho de origem fica CONVERTIDO, e o pedido aponta para ele")
    void carrinhoFicaConvertido() {
        Carrinho carrinho = carrinhoCom(banana, 1);

        servico.criar(SUB, CHAVE);

        assertThat(carrinho.getStatus()).isEqualTo(StatusCarrinho.CONVERTIDO);
        assertThat(pedidoGravado().getCarrinho()).isSameAs(carrinho);
        verify(carrinhos).save(carrinho);
    }

    @Test
    @DisplayName("o estoque nao se mexe no checkout: quem baixa e a aprovacao do pagamento")
    void checkoutNaoMexeNoEstoque() {
        carrinhoCom(banana, 4);

        servico.criar(SUB, CHAVE);

        assertThat(banana.getQuantidadeEstoque()).isEqualTo(84);
    }

    @Test
    @DisplayName("o checkout nao publica evento nenhum: o outbox so entra no pagamento")
    void checkoutNaoGravaEvento() {
        carrinhoCom(banana, 2);

        servico.criar(SUB, CHAVE);

        verifyNoInteractions(eventos);
    }

    @Test
    @DisplayName("sem header de idempotencia o servidor gera a chave, e o checkout segue")
    void chaveAusenteEGerada() {
        carrinhoCom(banana, 1);

        servico.criar(SUB, null);

        assertThat(pedidoGravado().getChaveIdempotencia()).isNotBlank();
    }

    /** O pedido que chegou ao repositorio, e nao o DTO que voltou ao cliente. */
    private Pedido pedidoGravado() {
        ArgumentCaptor<Pedido> capturado = ArgumentCaptor.forClass(Pedido.class);
        verify(pedidos).saveAndFlush(capturado.capture());
        return capturado.getValue();
    }
}
