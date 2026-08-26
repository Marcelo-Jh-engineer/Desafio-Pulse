package com.api.ecommerce.business.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.api.ecommerce.business.gateway.GatewayDePagamento;
import com.api.ecommerce.business.gateway.GatewayFakeDePagamento;
import com.api.ecommerce.business.outbox.RegistradorDeEventos;
import com.api.ecommerce.dtos.out.PagamentoDtoOut;
import com.api.ecommerce.infrastructure.entities.Carrinho;
import com.api.ecommerce.infrastructure.entities.Categoria;
import com.api.ecommerce.infrastructure.entities.EventoOutbox;
import com.api.ecommerce.infrastructure.entities.Pagamento;
import com.api.ecommerce.infrastructure.entities.Pedido;
import com.api.ecommerce.infrastructure.entities.Produto;
import com.api.ecommerce.infrastructure.entities.Usuario;
import com.api.ecommerce.infrastructure.enums.MetodoPagamento;
import com.api.ecommerce.infrastructure.enums.StatusPagamento;
import com.api.ecommerce.infrastructure.enums.StatusPedido;
import com.api.ecommerce.infrastructure.enums.Unidade;
import com.api.ecommerce.infrastructure.exception.ExcecaoDeConflito;
import com.api.ecommerce.infrastructure.exception.ExcecaoDeNaoEncontrado;
import com.api.ecommerce.infrastructure.repositories.RepositorioDeEventoOutbox;
import com.api.ecommerce.infrastructure.repositories.RepositorioDePagamento;
import com.api.ecommerce.infrastructure.repositories.RepositorioDePedido;
import com.api.ecommerce.infrastructure.repositories.RepositorioDeProduto;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.lang.reflect.Field;
import java.time.Instant;
import java.util.List;
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
 * O pagamento assincrono, sem banco e sem broker.
 *
 * As duas metades sao exercitadas separadamente, que e como elas rodam de
 * verdade: `solicitar` no thread do cliente, `processar` no consumidor da fila.
 *
 * O gateway e dublado, mas responde delegando ao fake de verdade: o teste
 * continua deterministico e ainda da para verificar que ele NAO foi chamado —
 * que e o coracao da prova de idempotencia.
 *
 * O RegistradorDeEventos entra de verdade sobre um repositorio dublado: o que
 * interessa e a linha que chega ao outbox, com o tipo e o corpo certos.
 *
 * Fora de cobertura, e registrado: o FOR UPDATE do pagamento, o lock
 * pessimista dos produtos, a ordenacao que evita deadlock, os CHECK e o
 * roteamento real do RabbitMQ.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("Servico de pagamento")
class ServicoDePagamentoTest {

    private static final UUID SUB = UUID.randomUUID();

    @Mock private RepositorioDePedido pedidos;
    @Mock private RepositorioDePagamento pagamentos;
    @Mock private RepositorioDeProduto produtos;
    @Mock private RepositorioDeEventoOutbox outbox;
    @Mock private GatewayDePagamento gateway;

    private ServicoDePagamento servico;
    private Usuario maria;
    private Categoria hortifruti;

    @BeforeEach
    void preparar() {
        servico = new ServicoDePagamento(pedidos, pagamentos, produtos,
                new RegistradorDeEventos(outbox, new ObjectMapper()), gateway);

        maria = new Usuario(SUB, "Maria Souza", "maria@exemplo.com", "11144477735");
        hortifruti = new Categoria("Hortifruti", "Frutas", null, (short) 1, true);

        // O gateway responde pela regra real: deterministico, e ainda da para
        // verificar que nao foi chamado.
        GatewayFakeDePagamento regraReal = new GatewayFakeDePagamento();
        when(gateway.processar(anyLong()))
                .thenAnswer(chamada -> regraReal.processar(chamada.getArgument(0)));

        when(pagamentos.saveAndFlush(any(Pagamento.class)))
                .thenAnswer(chamada -> chamada.getArgument(0));
        when(pagamentos.findByPedidoIdPublicoAndStatus(any(), any())).thenReturn(Optional.empty());
    }

    /**
     * O `id` gerado pelo banco nao existe sem banco, e o servico precisa dele:
     * o evento do outbox referencia o id do agregado, e a trava de produto e
     * pedida por id. Preencher por reflexao e o preco de nao usar Testcontainers.
     */
    private static void definirId(Object entidade, long id) {
        try {
            Field campo = entidade.getClass().getDeclaredField("id");
            campo.setAccessible(true);
            campo.set(entidade, id);
        } catch (ReflectiveOperationException excecao) {
            throw new IllegalStateException(excecao);
        }
    }

    private Produto produto(long id, String nome, long preco, int estoque) {
        Produto produto = new Produto(nome, "Descricao", preco, Unidade.UN, null,
                hortifruti, estoque, true);
        definirId(produto, id);
        return produto;
    }

    /** Um pedido PENDENTE de Maria, nascido de um carrinho com aquelas linhas. */
    private Pedido pedidoCom(Produto produto, int quantidade) {
        Carrinho carrinho = new Carrinho(maria);
        carrinho.adicionar(produto, quantidade);

        Pedido pedido = new Pedido(maria, carrinho, "checkout-1");
        carrinho.getItens().forEach(pedido::adicionar);
        definirId(pedido, 10L);

        when(pedidos.findByIdPublicoAndUsuarioKeycloakSub(pedido.getIdPublico(), SUB))
                .thenReturn(Optional.of(pedido));

        return pedido;
    }

    /** A tentativa PENDENTE daquele pedido, ja travada para o consumidor. */
    private Pagamento pagamentoPendenteDe(Pedido pedido) {
        Pagamento pagamento = Pagamento.solicitado(pedido, MetodoPagamento.CARTAO);
        definirId(pagamento, 20L);

        when(pagamentos.travarParaProcessamento(pagamento.getIdPublico()))
                .thenReturn(Optional.of(pagamento));

        return pagamento;
    }

    private EventoOutbox eventoGravado() {
        ArgumentCaptor<EventoOutbox> capturado = ArgumentCaptor.forClass(EventoOutbox.class);
        verify(outbox).save(capturado.capture());
        return capturado.getValue();
    }

    // T3
    @Test
    @DisplayName("solicitar grava a tentativa PENDENTE e o evento, na mesma transacao")
    void solicitarGravaPagamentoEEvento() {
        // 2 x 649 = 1298, final 8: o gateway aprovaria — mas nao e chamado aqui.
        Pedido pedido = pedidoCom(produto(1L, "Banana Prata", 649, 84), 2);

        PagamentoDtoOut dto = servico.solicitar(SUB, pedido.getIdPublico(), MetodoPagamento.CARTAO);

        assertThat(dto.status()).isEqualTo(StatusPagamento.PENDENTE);
        assertThat(dto.metodo()).isEqualTo(MetodoPagamento.CARTAO);
        assertThat(dto.valorEmCentavos()).isEqualTo(pedido.getTotalEmCentavos());
        // Nulo e o sinal de que o consumidor ainda nao pegou.
        assertThat(dto.processadoEm()).isNull();

        EventoOutbox evento = eventoGravado();
        assertThat(evento.getTipo()).isEqualTo("PAGAMENTO_SOLICITADO");
        assertThat(evento.getAgregado()).isEqualTo("PAGAMENTO");
        assertThat(evento.getConteudo()).contains(dto.id());

        // A API nao publica no broker: aqui nao existe RabbitTemplate nenhum, e
        // mesmo assim a solicitacao completa (RF-PAG-05).
        verify(gateway, never()).processar(anyLong());
    }

    // T4
    @Test
    @DisplayName("o corpo do evento leva so a referencia, nenhum dado do comprador")
    void eventoSoComReferencia() {
        Pedido pedido = pedidoCom(produto(1L, "Banana Prata", 649, 84), 2);

        servico.solicitar(SUB, pedido.getIdPublico(), MetodoPagamento.CARTAO);

        String conteudo = eventoGravado().getConteudo();

        assertThat(conteudo).contains("pagamentoId");
        assertThat(conteudo)
                .doesNotContain("Maria")
                .doesNotContain("maria@exemplo.com")
                .doesNotContain("11144477735")
                // Nem o estado: o consumidor rele do banco, que e a fonte da
                // verdade. Mensagem com valor dentro envelhece na fila.
                .doesNotContain("valorEmCentavos")
                .doesNotContain("PENDENTE");
    }

    // T5
    @Test
    @DisplayName("com tentativa ja pendente devolve aquela, sem segunda linha nem segundo evento")
    void naoDuplicaTentativaPendente() {
        Pedido pedido = pedidoCom(produto(1L, "Banana Prata", 649, 84), 2);
        Pagamento existente = Pagamento.solicitado(pedido, MetodoPagamento.CARTAO);

        when(pagamentos.findByPedidoIdPublicoAndStatus(
                pedido.getIdPublico(), StatusPagamento.PENDENTE))
                .thenReturn(Optional.of(existente));

        PagamentoDtoOut dto = servico.solicitar(SUB, pedido.getIdPublico(), MetodoPagamento.CARTAO);

        assertThat(dto.id()).isEqualTo(existente.getIdPublico().toString());
        verify(pagamentos, never()).saveAndFlush(any());
        verify(outbox, never()).save(any());
    }

    // T6
    @Test
    @DisplayName("pedido ja pago recusa nova solicitacao")
    void pedidoPagoRecusaSolicitacao() {
        Pedido pedido = pedidoCom(produto(1L, "Banana Prata", 649, 84), 2);
        pedido.marcarPago(Instant.now());

        assertThatThrownBy(() ->
                servico.solicitar(SUB, pedido.getIdPublico(), MetodoPagamento.CARTAO))
                .isInstanceOf(ExcecaoDeConflito.class)
                .hasMessageContaining("já foi pago");

        verify(pagamentos, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("pedido cancelado tambem recusa, com texto proprio")
    void pedidoCanceladoRecusaSolicitacao() {
        Pedido pedido = pedidoCom(produto(1L, "Banana Prata", 649, 84), 2);
        pedido.cancelar("Estoque insuficiente para Banana Prata");

        assertThatThrownBy(() ->
                servico.solicitar(SUB, pedido.getIdPublico(), MetodoPagamento.CARTAO))
                .isInstanceOf(ExcecaoDeConflito.class)
                .hasMessageContaining("cancelado");
    }

    @Test
    @DisplayName("pedido de outro dono nao e encontrado")
    void pedidoDeOutroDonoNaoAceitaPagamento() {
        UUID doOutro = UUID.randomUUID();
        when(pedidos.findByIdPublicoAndUsuarioKeycloakSub(doOutro, SUB))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> servico.solicitar(SUB, doOutro, MetodoPagamento.CARTAO))
                .isInstanceOf(ExcecaoDeNaoEncontrado.class);
    }

    // T9 — o mais importante da lista.
    @Test
    @DisplayName("reentrega de tentativa ja resolvida nao processa nada")
    void reentregaNaoReprocessa() {
        Produto banana = produto(1L, "Banana Prata", 649, 84);
        Pedido pedido = pedidoCom(banana, 2);
        Pagamento pagamento = pagamentoPendenteDe(pedido);

        // Primeira entrega: aprova e baixa o estoque.
        when(produtos.travarParaBaixa(1L)).thenReturn(Optional.of(banana));
        servico.processar(pagamento.getIdPublico());

        assertThat(pagamento.getStatus()).isEqualTo(StatusPagamento.APROVADO);
        assertThat(banana.getQuantidadeEstoque()).isEqualTo(82);

        // Segunda entrega da MESMA mensagem — o RabbitMQ entrega ao menos uma
        // vez. Sem a checagem de status, o estoque sairia duas vezes para uma
        // venda so.
        servico.processar(pagamento.getIdPublico());

        assertThat(banana.getQuantidadeEstoque()).isEqualTo(82);
        verify(gateway, org.mockito.Mockito.times(1)).processar(anyLong());
    }

    // T10
    @Test
    @DisplayName("mensagem de pagamento inexistente e ignorada, sem estourar")
    void pagamentoInexistenteEIgnorado() {
        UUID orfao = UUID.randomUUID();
        when(pagamentos.travarParaProcessamento(orfao)).thenReturn(Optional.empty());

        servico.processar(orfao);

        verify(gateway, never()).processar(anyLong());
        verify(pagamentos, never()).save(any());
    }

    // T11 e T14
    @Test
    @DisplayName("aprovacao debita o estoque, paga o pedido e enfileira PEDIDO_PAGO")
    void aprovacaoDebitaEPagaOPedido() {
        // 4 x 649 = 2596, final 6: o gateway aprova.
        Produto banana = produto(1L, "Banana Prata", 649, 84);
        Pedido pedido = pedidoCom(banana, 4);
        Pagamento pagamento = pagamentoPendenteDe(pedido);
        when(produtos.travarParaBaixa(1L)).thenReturn(Optional.of(banana));

        servico.processar(pagamento.getIdPublico());

        // Exatamente a quantidade do pedido, nem uma a mais.
        assertThat(banana.getQuantidadeEstoque()).isEqualTo(80);
        assertThat(pagamento.getStatus()).isEqualTo(StatusPagamento.APROVADO);
        assertThat(pagamento.getProcessadoEm()).isNotNull();
        assertThat(pedido.getStatus()).isEqualTo(StatusPedido.PAGO);
        assertThat(pedido.getPagoEm()).isNotNull();

        EventoOutbox evento = eventoGravado();
        assertThat(evento.getTipo()).isEqualTo("PEDIDO_PAGO");
        assertThat(evento.getConteudo()).contains(pedido.getIdPublico().toString());
    }

    // T12 e T13
    @Test
    @DisplayName("recusa nao toca o estoque e mantem o pedido PENDENTE")
    void recusaNaoMexeNoEstoque() {
        // 2023 centavos, final 3: o gateway recusa por saldo.
        Produto detergente = produto(2L, "Detergente", 2023, 50);
        Pedido pedido = pedidoCom(detergente, 1);
        Pagamento pagamento = pagamentoPendenteDe(pedido);

        servico.processar(pagamento.getIdPublico());

        assertThat(pagamento.getStatus()).isEqualTo(StatusPagamento.RECUSADO);
        assertThat(pagamento.getMotivoRecusa()).isEqualTo("Saldo insuficiente");
        assertThat(pagamento.getProcessadoEm()).isNotNull();

        assertThat(detergente.getQuantidadeEstoque()).isEqualTo(50);
        // O cliente tenta de novo sem perder a compra.
        assertThat(pedido.getStatus()).isEqualTo(StatusPedido.PENDENTE);

        verify(produtos, never()).travarParaBaixa(anyLong());
        verify(outbox, never()).save(any());
    }

    // T15
    @Test
    @DisplayName("estoque insuficiente na aprovacao recusa a tentativa e cancela o pedido")
    void faltaDeEstoqueCancelaOPedido() {
        Produto picanha = produto(3L, "Picanha", 8990, 5);
        Pedido pedido = pedidoCom(picanha, 2);
        Pagamento pagamento = pagamentoPendenteDe(pedido);

        // Entre o checkout e a aprovacao, outra pessoa levou quase tudo.
        picanha.baixarEstoque(4);
        when(produtos.travarParaBaixa(3L)).thenReturn(Optional.of(picanha));

        servico.processar(pagamento.getIdPublico());

        assertThat(pagamento.getStatus()).isEqualTo(StatusPagamento.RECUSADO);
        assertThat(pagamento.getMotivoRecusa()).isEqualTo("Estoque insuficiente para Picanha");
        assertThat(pedido.getStatus()).isEqualTo(StatusPedido.CANCELADO);
        // O motivo do pedido diz por que a COMPRA acabou; o da tentativa, por
        // que aquela cobranca nao passou (D11).
        assertThat(pedido.getMotivoRecusa()).isEqualTo("Estoque insuficiente para Picanha");

        // Nada saiu do estoque: o que restou continua onde estava.
        assertThat(picanha.getQuantidadeEstoque()).isEqualTo(1);
        verify(outbox, never()).save(any());
    }

    // T16
    @Test
    @DisplayName("depois da recusa, uma nova solicitacao cria a segunda tentativa")
    void novaTentativaDepoisDaRecusa() {
        Pedido pedido = pedidoCom(produto(2L, "Detergente", 2023, 50), 1);
        Pagamento recusado = Pagamento.solicitado(pedido, MetodoPagamento.CARTAO);
        recusado.recusar("Saldo insuficiente", Instant.now());

        // Nao ha mais tentativa em aberto, e o pedido segue PENDENTE.
        when(pagamentos.findByPedidoIdPublicoAndStatus(any(), any())).thenReturn(Optional.empty());

        PagamentoDtoOut segunda =
                servico.solicitar(SUB, pedido.getIdPublico(), MetodoPagamento.CARTAO);

        assertThat(segunda.status()).isEqualTo(StatusPagamento.PENDENTE);
        assertThat(segunda.id()).isNotEqualTo(recusado.getIdPublico().toString());
        verify(pagamentos).saveAndFlush(any(Pagamento.class));
    }

    // T17
    @Test
    @DisplayName("as tentativas de um pedido alheio nao sao encontradas")
    void tentativasDePedidoAlheio() {
        UUID doOutro = UUID.randomUUID();
        when(pedidos.findByIdPublicoAndUsuarioKeycloakSub(doOutro, SUB))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> servico.listar(SUB, doOutro))
                .isInstanceOf(ExcecaoDeNaoEncontrado.class)
                .hasMessageContaining("não encontrado");

        verify(pagamentos, never()).findByPedidoIdPublicoOrderByCriadoEmDesc(any());
    }

    @Test
    @DisplayName("a lista traz as tentativas do pedido, recentes primeiro")
    void listaAsTentativas() {
        Pedido pedido = pedidoCom(produto(2L, "Detergente", 2023, 50), 1);

        Pagamento recusado = Pagamento.solicitado(pedido, MetodoPagamento.CARTAO);
        recusado.recusar("Saldo insuficiente", Instant.now());
        Pagamento pendente = Pagamento.solicitado(pedido, MetodoPagamento.CARTAO);

        when(pagamentos.findByPedidoIdPublicoOrderByCriadoEmDesc(pedido.getIdPublico()))
                .thenReturn(List.of(pendente, recusado));

        List<PagamentoDtoOut> tentativas = servico.listar(SUB, pedido.getIdPublico());

        assertThat(tentativas).hasSize(2);
        assertThat(tentativas.get(0).status()).isEqualTo(StatusPagamento.PENDENTE);
        assertThat(tentativas.get(1).motivoRecusa()).isEqualTo("Saldo insuficiente");
    }
}
