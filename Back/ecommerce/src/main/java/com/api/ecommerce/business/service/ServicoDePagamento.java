package com.api.ecommerce.business.service;

import com.api.ecommerce.business.gateway.GatewayDePagamento;
import com.api.ecommerce.business.gateway.ResultadoDoPagamento;
import com.api.ecommerce.business.outbox.RegistradorDeEventos;
import com.api.ecommerce.dtos.BaixaEstoque;
import com.api.ecommerce.dtos.eventos.PagamentoSolicitado;
import com.api.ecommerce.dtos.out.PagamentoDtoOut;
import com.api.ecommerce.infrastructure.entities.ItemPedido;
import com.api.ecommerce.infrastructure.entities.Pagamento;
import com.api.ecommerce.infrastructure.entities.Pedido;
import com.api.ecommerce.infrastructure.entities.Produto;
import com.api.ecommerce.infrastructure.enums.MetodoPagamento;
import com.api.ecommerce.infrastructure.enums.StatusPagamento;
import com.api.ecommerce.infrastructure.enums.StatusPedido;
import com.api.ecommerce.infrastructure.enums.TipoDeEvento;
import com.api.ecommerce.infrastructure.exception.ExcecaoDeConflito;
import com.api.ecommerce.infrastructure.exception.ExcecaoDeNaoEncontrado;
import com.api.ecommerce.infrastructure.repositories.RepositorioDePagamento;
import com.api.ecommerce.infrastructure.repositories.RepositorioDePedido;
import com.api.ecommerce.infrastructure.repositories.RepositorioDeProduto;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 *
 * Duas metades que nunca se encontram na mesma requisicao:
 *
 * 1. **solicitar** roda no thread do cliente. Grava a tentativa PENDENTE e o
 *    evento no outbox, na mesma transacao, e devolve. Nao publica no broker,
 *    nao chama o gateway, nao toca em estoque (D1, D6).
 * 2. **processar** roda no consumidor da fila. Chama o gateway, decide o
 *    desfecho e, se aprovou, baixa o estoque sob trava.
 *
 * O estoque so se mexe na aprovacao — nunca no checkout, nunca na solicitacao.
 * E o unico caminho de saida, e ele passa por `travarParaBaixa`.
 */
@Service
public class ServicoDePagamento {

    private static final Logger LOG = LoggerFactory.getLogger(ServicoDePagamento.class);

    private static final String AGREGADO_PAGAMENTO = "PAGAMENTO";

    private final RepositorioDePedido pedidos;
    private final RepositorioDePagamento pagamentos;
    private final RepositorioDeProduto produtos;
    private final RegistradorDeEventos eventos;
    private final GatewayDePagamento gateway;

    public ServicoDePagamento(RepositorioDePedido pedidos,
                              RepositorioDePagamento pagamentos,
                              RepositorioDeProduto produtos,
                              RegistradorDeEventos eventos,
                              GatewayDePagamento gateway) {
        this.pedidos = pedidos;
        this.pagamentos = pagamentos;
        this.produtos = produtos;
        this.eventos = eventos;
        this.gateway = gateway;
    }

    /**
     * O cliente pede para cobrar um pedido seu
     */
    @Transactional
    public PagamentoDtoOut solicitar(UUID sub, UUID idPublicoDoPedido, MetodoPagamento metodo) {
        Pedido pedido = exigirPedidoDoCliente(sub, idPublicoDoPedido);

        exigirPedidoCobravel(pedido);

        Optional<Pagamento> emAberto = pagamentos.findByPedidoIdPublicoAndStatus(
                idPublicoDoPedido, StatusPagamento.PENDENTE);
        if (emAberto.isPresent()) {
            return PagamentoDtoOut.de(emAberto.get());
        }

        Pagamento pagamento = Pagamento.solicitado(pedido, metodo);

        // saveAndFlush: salva o pagamento com status pendente
        pagamentos.saveAndFlush(pagamento);

        // Na MESMA transacao do fato. Se o commit voltar atras, o evento volta
        // com ele — e a API nunca publica direto no broker.
        eventos.registrar(AGREGADO_PAGAMENTO, pagamento.getId(),
                TipoDeEvento.PAGAMENTO_SOLICITADO,
                new PagamentoSolicitado(pagamento.getIdPublico().toString()));

        return PagamentoDtoOut.de(pagamento);
    }

    /** As tentativas de um pedido do proprio cliente, recentes primeiro. */
    @Transactional(readOnly = true)
    public List<PagamentoDtoOut> listar(UUID sub, UUID idPublicoDoPedido) {
        exigirPedidoDoCliente(sub, idPublicoDoPedido);

        return pagamentos.findByPedidoIdPublicoOrderByCriadoEmDesc(idPublicoDoPedido).stream()
                .map(PagamentoDtoOut::de)
                .toList();
    }



    //Ocorre após o rabbit mq receber os eventos publicados pelo worker schedule
    @Transactional
    public void processar(UUID idPublicoDoPagamento) {
        Optional<Pagamento> encontrado = pagamentos.travarParaProcessamento(idPublicoDoPagamento);

        if (encontrado.isEmpty()) {
            // Evento orfao: a linha nao existe mais. Reentregar nao vai
            // fazer ela aparecer, entao a mensagem morre aqui, com ack.
            LOG.warn("Pagamento {} nao existe; mensagem ignorada", idPublicoDoPagamento);
            return;
        }

        Pagamento pagamento = encontrado.get();

        if (pagamento.getStatus() != StatusPagamento.PENDENTE) {
            LOG.info("Pagamento {} ja esta {}; nada a fazer",
                    idPublicoDoPagamento, pagamento.getStatus());
            return;
        }

        Instant agora = Instant.now();
        ResultadoDoPagamento resultado = gateway.processar(pagamento.getValorEmCentavos());

        if (!resultado.aprovado()) {
            // O pedido continua PENDENTE: o cliente tenta de novo.
            pagamento.recusar(resultado.motivo(), agora);
            pagamentos.save(pagamento);
            return;
        }

        aprovar(pagamento, agora);
    }

    /**
     * Aprovacao: revalida o estoque sob trava, debita e move o pedido.
     *
     * Os produtos sao travados **em ordem de . Dois pedidos com
     * os mesmos produtos em ordens diferentes travariam em ordens opostas e
     * formariam ciclo — cada transacao segurando o que a outra espera. A ordem
     * unica desfaz o ciclo antes de ele existir.
     *
     * A revalidacao acontece aqui, e nao no checkout, porque e aqui que o
     * estoque sai: entre uma coisa e outra outra pessoa pode ter levado a
     * ultima unidade.
     */
    private void aprovar(Pagamento pagamento, Instant agora) {
        Pedido pedido = pagamento.getPedido();

        List<ItemPedido> linhasItensPedido = pedido.getItens().stream()
                .sorted(Comparator.comparing(item -> item.getProduto().getId()))
                .toList();

        List<BaixaEstoque> baixasEstoque = new ArrayList<>();

        for (ItemPedido item : linhasItensPedido) {

            Optional<Produto> produto =
                    produtos.travarParaBaixa(item.getProduto().getId());

            if (produto.isEmpty() ||
                    !cobreAQuantidade(produto.get(), item.getQuantidade())) {

                recusarPorEstoque(pagamento, pedido, item, agora);
                return;
            }

            baixasEstoque.add(
                    new BaixaEstoque(produto.get(), item.getQuantidade())
            );
        }

        for (BaixaEstoque baixa : baixasEstoque) {
            baixa.produto().baixarEstoque(baixa.quantidade());
        }

        pagamento.aprovar(agora);
        pedido.marcarPago(agora);

        pagamentos.save(pagamento);
        pedidos.save(pedido);

    }

    private void recusarPorEstoque(Pagamento pagamento, Pedido pedido, ItemPedido linha,
                                   Instant agora) {
        String motivo = "Estoque insuficiente para " + linha.getNome();

        pagamento.recusar(motivo, agora);
        pedido.cancelar(motivo);

        pagamentos.save(pagamento);
        pedidos.save(pedido);
    }

    private boolean cobreAQuantidade(Produto produto, int quantidade) {
        return produto.isAtivo() && produto.getQuantidadeEstoque() >= quantidade;
    }

   

    /** Pedido de outro dono responde igual a id inventado: 404, nunca 403. */
    private Pedido exigirPedidoDoCliente(UUID sub, UUID idPublicoDoPedido) {
        return pedidos.findByIdPublicoAndUsuarioKeycloakSub(idPublicoDoPedido, sub)
                .orElseThrow(() -> new ExcecaoDeNaoEncontrado("Pedido não encontrado."));
    }

    /**
     * So pedido PENDENTE aceita cobranca.
     */
    private void exigirPedidoCobravel(Pedido pedido) {
        if (pedido.getStatus() == StatusPedido.PAGO) {
            throw new ExcecaoDeConflito("Este pedido já foi pago.");
        }
        if (pedido.getStatus() == StatusPedido.CANCELADO) {
            throw new ExcecaoDeConflito("Este pedido foi cancelado.");
        }
        if (pedido.getStatus() != StatusPedido.PENDENTE) {
            throw new ExcecaoDeConflito("Este pedido não está aguardando pagamento.");
        }

        pagamentos.findByPedidoIdPublicoAndStatus(
                        pedido.getIdPublico(), StatusPagamento.APROVADO)
                .ifPresent(aprovado -> {
                    throw new ExcecaoDeConflito("Este pedido já foi pago.");
                });
    }
}
