package com.api.ecommerce.business.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.api.ecommerce.dtos.CarrinhoDto;
import com.api.ecommerce.dtos.ItemCarrinhoDto;
import com.api.ecommerce.infrastructure.entities.Carrinho;
import com.api.ecommerce.infrastructure.entities.Categoria;
import com.api.ecommerce.infrastructure.entities.Produto;
import com.api.ecommerce.infrastructure.entities.Usuario;
import com.api.ecommerce.infrastructure.enums.StatusCarrinho;
import com.api.ecommerce.infrastructure.enums.Unidade;
import com.api.ecommerce.infrastructure.exception.ExcecaoDeAutenticacao;
import com.api.ecommerce.infrastructure.exception.ExcecaoDeEstoqueInsuficiente;
import com.api.ecommerce.infrastructure.exception.ExcecaoDeNaoEncontrado;
import com.api.ecommerce.infrastructure.repositories.RepositorioDeCarrinho;
import com.api.ecommerce.infrastructure.repositories.RepositorioDeImagemDeProduto;
import com.api.ecommerce.infrastructure.repositories.RepositorioDeProduto;
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
 * O fluxo do carrinho com os repositorios dublados.
 *
 * Repositorios dublados, sem Spring e sem banco: o que se prova e a DECISAO —
 * quem pode mexer no carrinho, quando o estoque recusa, o que acontece ao somar
 * e ao tirar quantidade, e quanto da o total.
 *
 * ServicoDeEstoque entra de verdade, nao dublado: e logica pura, e substitui-lo
 * por um mock testaria que o servico chama o mock, nao que o estoque foi
 * conferido. O mesmo vale para as entidades — Carrinho e ItemCarrinho sao
 * objetos comuns aqui, e e neles que a conta do total acontece.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("Servico de carrinho")
class ServicoDeCarrinhoTest {

    private static final UUID SUB = UUID.randomUUID();

    @Mock private RepositorioDeCarrinho carrinhos;
    @Mock private RepositorioDeProduto produtos;
    @Mock private RepositorioDeUsuario usuarios;
    @Mock private RepositorioDeImagemDeProduto imagens;

    private ServicoDeCarrinho servico;
    private Usuario maria;
    private Produto banana;

    @BeforeEach
    void preparar() {
        // ServicoDeImagemDeProduto entra de verdade sobre um repositorio dublado:
        // ele so decide entre dois enderecos, e o que interessa aqui e que a
        // linha do carrinho saia com um deles — nao qual.
        servico = new ServicoDeCarrinho(carrinhos, produtos, usuarios,
                new ServicoDeEstoque(), new ServicoDeImagemDeProduto(imagens));

        maria = new Usuario(SUB, "Maria Souza", "maria@exemplo.com", "11144477735");

        Categoria hortifruti = new Categoria("Hortifruti", "Frutas", null, (short) 1, true);
        banana = new Produto("Banana Prata", "Banana madura", 649, Unidade.KG,
                null, hortifruti, 84, true);

        when(usuarios.findByKeycloakSub(SUB)).thenReturn(Optional.of(maria));
        when(produtos.findByIdPublico(banana.getIdPublico())).thenReturn(Optional.of(banana));
        when(carrinhos.save(any(Carrinho.class))).thenAnswer(chamada -> chamada.getArgument(0));
        when(carrinhos.saveAndFlush(any(Carrinho.class)))
                .thenAnswer(chamada -> chamada.getArgument(0));
    }

    /** O carrinho que o servico criou e mandou gravar. */
    private Carrinho carrinhoGravado() {
        ArgumentCaptor<Carrinho> capturado = ArgumentCaptor.forClass(Carrinho.class);
        verify(carrinhos).save(capturado.capture());
        return capturado.getValue();
    }

    @Test
    @DisplayName("carrinho pertence a usuario autenticado: sub sem usuario espelhado nao cria nada")
    void exigeUsuarioAutenticado() {
        UUID desconhecido = UUID.randomUUID();
        when(usuarios.findByKeycloakSub(desconhecido)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> servico.criar(desconhecido, banana.getIdPublico(), 1))
                .isInstanceOf(ExcecaoDeAutenticacao.class);

        assertThatThrownBy(() -> servico.ver(desconhecido))
                .isInstanceOf(ExcecaoDeAutenticacao.class);

        // Nem o carrinho chegou a ser criado: a recusa vem antes de qualquer
        // escrita, e nao depois de gravar e descobrir que faltava dono.
        verify(carrinhos, never()).save(any());
    }

    @Test
    @DisplayName("sub nulo tambem e recusado")
    void exigeSubNaoNulo() {
        assertThatThrownBy(() -> servico.criar(null, banana.getIdPublico(), 1))
                .isInstanceOf(ExcecaoDeAutenticacao.class);
    }

    @Test
    @DisplayName("criar deixa o carrinho ABERTO, com dono e ja com o primeiro item")
    void criaAbertoComPrimeiroItem() {
        when(carrinhos.abertoDe(SUB)).thenReturn(Optional.empty());

        CarrinhoDto dto = servico.criar(SUB, banana.getIdPublico(), 3);

        assertThat(dto.status()).isEqualTo(StatusCarrinho.ABERTO);
        assertThat(dto.itens()).hasSize(1);
        assertThat(dto.itens().get(0).quantidade()).isEqualTo(3);
        assertThat(dto.itens().get(0).precoEmCentavos()).isEqualTo(649);
        assertThat(dto.itens().get(0).unidade()).isEqualTo(Unidade.KG);
        assertThat(dto.itens().get(0).totalLinhaEmCentavos()).isEqualTo(649L * 3);
    }

    @Test
    @DisplayName("criar com carrinho ja aberto nao abre um segundo")
    void naoAbreSegundoCarrinho() {
        Carrinho existente = new Carrinho(maria);
        when(carrinhos.abertoDe(SUB)).thenReturn(Optional.of(existente));

        servico.criar(SUB, banana.getIdPublico(), 2);

        verify(carrinhos, never()).save(any());
        assertThat(existente.getItens()).hasSize(1);
    }

    @Test
    @DisplayName("estoque e conferido contra o total da linha, nao contra a quantidade nova")
    void estoqueOlhaOTotalDaLinha() {
        Produto ultimasTres = new Produto("Picanha", "Peca inteira", 8990, Unidade.KG,
                null, new Categoria("Acougue", null, null, (short) 6, true), 3, true);
        when(produtos.findByIdPublico(ultimasTres.getIdPublico()))
                .thenReturn(Optional.of(ultimasTres));

        Carrinho carrinho = new Carrinho(maria);
        carrinho.adicionar(ultimasTres, 2);
        when(carrinhos.abertoDe(SUB)).thenReturn(Optional.of(carrinho));

        // Ja tem 2 e pede mais 2: sao 4 pedidos ao estoque de 3. Conferir so os
        // 2 recem-pedidos deixaria passar.
        assertThatThrownBy(() -> servico.adicionar(SUB, ultimasTres.getIdPublico(), 2))
                .isInstanceOf(ExcecaoDeEstoqueInsuficiente.class);

        // E o que cabe, cabe: 2 + 1 = 3, exatamente o estoque.
        assertThat(servico.adicionar(SUB, ultimasTres.getIdPublico(), 1)
                .itens().get(0).quantidade()).isEqualTo(3);
    }

    @Test
    @DisplayName("o total do carrinho e a soma dos totais das linhas")
    void totalSomaAsLinhas() {
        Produto arroz = new Produto("Arroz Tipo 1", "Pacote de 5 kg", 2799, Unidade.PCT,
                null, new Categoria("Mercearia", null, null, (short) 5, true), 200, true);
        when(produtos.findByIdPublico(arroz.getIdPublico())).thenReturn(Optional.of(arroz));
        when(carrinhos.abertoDe(SUB)).thenReturn(Optional.empty());

        servico.criar(SUB, banana.getIdPublico(), 3);

        Carrinho carrinho = carrinhoGravado();
        when(carrinhos.abertoDe(SUB)).thenReturn(Optional.of(carrinho));

        CarrinhoDto dto = servico.adicionar(SUB, arroz.getIdPublico(), 2);

        assertThat(dto.totalEmCentavos()).isEqualTo(649L * 3 + 2799L * 2);

        // A afirmacao que importa: o total e a soma das linhas, e nao um numero
        // paralelo que pode discordar delas.
        assertThat(dto.totalEmCentavos()).isEqualTo(
                dto.itens().stream().mapToLong(ItemCarrinhoDto::totalLinhaEmCentavos).sum());
    }

    @Test
    @DisplayName("o total acompanha cada mudanca, na mesma resposta")
    void totalAcompanhaAsMudancas() {
        Carrinho carrinho = new Carrinho(maria);
        when(carrinhos.abertoDe(SUB)).thenReturn(Optional.of(carrinho));

        assertThat(servico.adicionar(SUB, banana.getIdPublico(), 1).totalEmCentavos())
                .isEqualTo(649L);
        assertThat(servico.adicionar(SUB, banana.getIdPublico(), 2).totalEmCentavos())
                .isEqualTo(649L * 3);
        assertThat(servico.remover(SUB, banana.getIdPublico(), 1).totalEmCentavos())
                .isEqualTo(649L * 2);
    }

    @Test
    @DisplayName("carrinho sem item soma zero, e nao nulo")
    void carrinhoVazioSomaZero() {
        Carrinho carrinho = new Carrinho(maria);
        carrinho.adicionar(banana, 1);
        when(carrinhos.abertoDe(SUB)).thenReturn(Optional.of(carrinho));

        CarrinhoDto dto = servico.remover(SUB, banana.getIdPublico(), 1);

        assertThat(dto.itens()).isEmpty();
        assertThat(dto.totalEmCentavos()).isZero();
    }

    @Test
    @DisplayName("adicionar sem carrinho aberto avisa que nao ha carrinho")
    void adicionarSemCarrinho() {
        when(carrinhos.abertoDe(SUB)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> servico.adicionar(SUB, banana.getIdPublico(), 1))
                .isInstanceOf(ExcecaoDeNaoEncontrado.class);
    }

    @Test
    @DisplayName("remover tira a quantidade pedida da linha")
    void removeQuantidade() {
        Carrinho carrinho = new Carrinho(maria);
        carrinho.adicionar(banana, 5);
        when(carrinhos.abertoDe(SUB)).thenReturn(Optional.of(carrinho));

        CarrinhoDto dto = servico.remover(SUB, banana.getIdPublico(), 2);

        assertThat(dto.itens().get(0).quantidade()).isEqualTo(3);
        assertThat(dto.itens().get(0).totalLinhaEmCentavos()).isEqualTo(649L * 3);
    }

    @Test
    @DisplayName("remover tudo, ou mais do que tem, apaga a linha")
    void removerTudoApagaALinha() {
        Carrinho carrinho = new Carrinho(maria);
        carrinho.adicionar(banana, 2);
        when(carrinhos.abertoDe(SUB)).thenReturn(Optional.of(carrinho));

        // Pedir mais do que tem significa "tira tudo", e nao erro: o resultado
        // seria o mesmo, e recusar obrigaria quem chama a saber a quantidade
        // exata antes de pedir.
        CarrinhoDto dto = servico.remover(SUB, banana.getIdPublico(), 99);

        assertThat(dto.itens()).isEmpty();
    }

    @Test
    @DisplayName("remover produto que nao esta no carrinho e 404, nao silencio")
    void removerProdutoAusente() {
        when(carrinhos.abertoDe(SUB)).thenReturn(Optional.of(new Carrinho(maria)));

        assertThatThrownBy(() -> servico.remover(SUB, banana.getIdPublico(), 1))
                .isInstanceOf(ExcecaoDeNaoEncontrado.class);
    }

    @Test
    @DisplayName("quantidade nao positiva e recusada ao adicionar e ao remover")
    void quantidadeInvalida() {
        when(carrinhos.abertoDe(SUB)).thenReturn(Optional.of(new Carrinho(maria)));

        assertThatThrownBy(() -> servico.adicionar(SUB, banana.getIdPublico(), 0))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> servico.remover(SUB, banana.getIdPublico(), 0))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
