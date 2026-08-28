package com.api.ecommerce.business.mensageria;

import com.api.ecommerce.business.service.ServicoDePagamento;
import com.api.ecommerce.config.ConfiguracaoDoRabbit;
import com.api.ecommerce.dtos.eventos.PagamentoSolicitado;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * Ouve `pagamentos.solicitados` e manda o servico cobrar.
 *
 * Fino de proposito: le o id da mensagem e delega. A decisao — gateway, trava,
 * estoque, desfecho — vive em ServicoDePagamento, onde da para testa-la sem
 * broker nenhum.
 *
 * O corpo e lido como bytes e desserializado aqui, sem conversor de mensagem no
 * meio: o publicador manda o JSON exatamente como esta gravado no outbox, e
 * essa e a unica leitura possivel dele.
 *
 * Excecao que escapa daqui faz a mensagem ser reentregue ate esgotar as
 * tentativas e cair na DLQ — e o comportamento desejado para falha
 * transitoria. O que NAO pode escapar e falha permanente: pagamento inexistente
 * ou ja resolvido o servico trata em silencio, com ack, para a mensagem nao
 * girar para sempre.
 */
@Component
public class ConsumidorDePagamento {

    private final ServicoDePagamento pagamentos;
    private final ObjectMapper json;

    public ConsumidorDePagamento(ServicoDePagamento pagamentos, ObjectMapper json) {
        this.pagamentos = pagamentos;
        this.json = json;
    }

    @RabbitListener(queues = ConfiguracaoDoRabbit.FILA_PAGAMENTOS_SOLICITADOS)
    public void aoReceber(Message mensagem) throws Exception {
        processar(new String(mensagem.getBody(), StandardCharsets.UTF_8));
    }

    public void processar(String conteudo) throws Exception {
        PagamentoSolicitado evento = json.readValue(conteudo, PagamentoSolicitado.class);
        pagamentos.processar(UUID.fromString(evento.pagamentoId()));
    }
}
