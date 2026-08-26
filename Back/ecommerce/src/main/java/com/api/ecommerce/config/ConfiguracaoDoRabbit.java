package com.api.ecommerce.config;

import com.api.ecommerce.infrastructure.enums.TipoDeEvento;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.FanoutExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * A topologia do broker, declarada em codigo.
 *
 * Declarar aqui, e nao no painel do RabbitMQ, e o que faz a aplicacao subir
 * igual em qualquer maquina: o RabbitAdmin cria exchange, filas e bindings no
 * arranque se ainda nao existirem. Topologia feita a mao no painel some no
 * primeiro `docker compose down -v` e ninguem lembra de refazer.
 *
 * <pre>
 * exchange ecommerce.eventos (topic, durable)
 *   pagamento.solicitado -> pagamentos.solicitados
 *   pedido.pago          -> pedidos.pagos
 *
 * exchange ecommerce.eventos.dlx (fanout, durable)
 *   -> pagamentos.solicitados.dlq
 *   -> pedidos.pagos.dlq
 * </pre>
 *
 * **Topic e nao direct** porque a chave de roteamento e hierarquica
 * (`pagamento.solicitado`, `pedido.pago`): o dia em que alguem quiser ouvir
 * `pedido.*` inteiro, basta um binding — sem mexer em quem publica.
 *
 * **A DLX e fanout** porque ela nao decide nada: o que chega la ja falhou, e
 * cada fila de trabalho aponta para a sua propria DLQ pelo binding. Rotear de
 * novo por chave seria repetir, no caminho do erro, uma decisao que ja foi
 * tomada no caminho feliz.
 *
 * Tudo duravel; as mensagens saem PERSISTENT do publicador (RNF-PAG-04).
 */
@Configuration
public class ConfiguracaoDoRabbit {

    public static final String EXCHANGE = "ecommerce.eventos";
    public static final String EXCHANGE_DE_ERRO = "ecommerce.eventos.dlx";

    public static final String FILA_PAGAMENTOS_SOLICITADOS = "pagamentos.solicitados";
    public static final String FILA_PEDIDOS_PAGOS = "pedidos.pagos";

    private static final String SUFIXO_DE_ERRO = ".dlq";

    @Bean
    public TopicExchange exchangeDeEventos() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    @Bean
    public FanoutExchange exchangeDeErro() {
        return new FanoutExchange(EXCHANGE_DE_ERRO, true, false);
    }

    /**
     * As filas de trabalho apontam para a DLX.
     *
     * Junto com `default-requeue-rejected=false` no application.properties, e
     * isso que faz a mensagem que esgotou as tentativas ir para a DLQ em vez de
     * voltar para a fila e girar para sempre (RF-PAG-18). Sem uma das duas
     * pecas, o consumidor entra em laco de reentrega e o problema fica
     * invisivel.
     */
    @Bean
    public Queue filaDePagamentosSolicitados() {
        return filaDeTrabalho(FILA_PAGAMENTOS_SOLICITADOS);
    }

    @Bean
    public Queue filaDePedidosPagos() {
        return filaDeTrabalho(FILA_PEDIDOS_PAGOS);
    }

    @Bean
    public Queue filaDeErroDePagamentos() {
        return QueueBuilder.durable(FILA_PAGAMENTOS_SOLICITADOS + SUFIXO_DE_ERRO).build();
    }

    @Bean
    public Queue filaDeErroDePedidosPagos() {
        return QueueBuilder.durable(FILA_PEDIDOS_PAGOS + SUFIXO_DE_ERRO).build();
    }

    @Bean
    public Binding ligacaoDePagamentosSolicitados() {
        return BindingBuilder.bind(filaDePagamentosSolicitados())
                .to(exchangeDeEventos())
                .with(TipoDeEvento.PAGAMENTO_SOLICITADO.chaveDeRoteamento());
    }

    @Bean
    public Binding ligacaoDePedidosPagos() {
        return BindingBuilder.bind(filaDePedidosPagos())
                .to(exchangeDeEventos())
                .with(TipoDeEvento.PEDIDO_PAGO.chaveDeRoteamento());
    }

    @Bean
    public Binding ligacaoDeErroDePagamentos() {
        return BindingBuilder.bind(filaDeErroDePagamentos()).to(exchangeDeErro());
    }

    @Bean
    public Binding ligacaoDeErroDePedidosPagos() {
        return BindingBuilder.bind(filaDeErroDePedidosPagos()).to(exchangeDeErro());
    }

    private Queue filaDeTrabalho(String nome) {
        return QueueBuilder.durable(nome)
                .deadLetterExchange(EXCHANGE_DE_ERRO)
                .build();
    }
}
