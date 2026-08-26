package com.api.ecommerce.business.outbox;

import com.api.ecommerce.config.ConfiguracaoDoRabbit;
import com.api.ecommerce.infrastructure.entities.EventoOutbox;
import com.api.ecommerce.infrastructure.enums.TipoDeEvento;
import com.api.ecommerce.infrastructure.repositories.RepositorioDeEventoOutbox;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Leva o outbox ate o broker — a segunda metade do padrao.
 *
 * Roda a cada 2 segundos e varre apenas `publicado_em IS NULL`, com
 * `FOR UPDATE SKIP LOCKED` . O SKIP LOCKED e o que permite duas
 * instancias da aplicacao varrerem a mesma tabela sem entregar o mesmo evento
 * duas vezes: a segunda instancia PULA as linhas que a primeira ja segurou, em
 * vez de esperar por elas .
 *
 * **`publicado_em` so e gravado depois de o broker confirmar**.
 * Marcar antes abriria uma janela em que o evento e dado como publicado e o
 * RabbitMQ nunca o recebeu — e, como nao ha worker de resgate, ninguem
 * descobriria. Falhou, a linha continua pendente, com `tentativas` e
 * `ultimo_erro` gravados, e o proximo ciclo tenta de novo.
 *
 * Broker fora do ar nao perde nada e nao derruba a API : as linhas
 * ficam esperando, e e exatamente para isso que o outbox existe.
 */
@Component
public class PublicadorDeEventos {

    private static final Logger LOG = LoggerFactory.getLogger(PublicadorDeEventos.class);

    /**
     * Lote por ciclo.
     *
     * As linhas ficam travadas ate o fim da transacao, entao um lote grande
     * segura muita coisa por muito tempo. Cinquenta a cada 2 segundos da vazao
     * de sobra para esta aplicacao.
     */
    static final int TAMANHO_DO_LOTE = 50;

    /** Quanto esperar pelo ack do broker antes de tratar como falha. */
    private static final long SEGUNDOS_ATE_A_CONFIRMACAO = 5;

    private final RepositorioDeEventoOutbox eventos;
    private final RabbitTemplate rabbit;

    public PublicadorDeEventos(RepositorioDeEventoOutbox eventos, RabbitTemplate rabbit) {
        this.eventos = eventos;
        this.rabbit = rabbit;
    }

    /**
     * Um ciclo: pega o lote pendente e tenta publicar cada linha.
     *
     * `fixedDelay`, e nao `fixedRate`: o proximo ciclo comeca depois que este
     * termina. Com `fixedRate`, um ciclo lento sobreporia o seguinte, e dois
     * ciclos da mesma instancia disputariam as mesmas linhas.
     *
     * A transacao abrange o lote inteiro porque e ela que segura os locks do
     * SKIP LOCKED. Uma falha isolada nao a desfaz — o erro vira `ultimo_erro`
     * naquela linha, e as demais seguem.
     */
    @Scheduled(fixedDelayString = "${app.outbox.intervalo-ms:2000}")
    @Transactional
    public void publicarPendentes() {
        List<EventoOutbox> pendentes =
                eventos.pendentesParaPublicar(PageRequest.of(0, TAMANHO_DO_LOTE));

        for (EventoOutbox evento : pendentes) {
            publicar(evento);
        }
    }

    private void publicar(EventoOutbox evento) {
        Optional<TipoDeEvento> tipo = TipoDeEvento.porNome(evento.getTipo());
        if (tipo.isEmpty()) {
            evento.registrarFalha("Tipo de evento desconhecido: " + evento.getTipo());
            return;
        }

        try {
            CorrelationData confirmacao =
                    new CorrelationData(evento.getIdPublico().toString());

            rabbit.send(ConfiguracaoDoRabbit.EXCHANGE,
                    tipo.get().chaveDeRoteamento(),
                    mensagemDe(evento),
                    confirmacao);

            CorrelationData.Confirm ack = confirmacao.getFuture()
                    .get(SEGUNDOS_ATE_A_CONFIRMACAO, TimeUnit.SECONDS);

            if (ack != null && ack.isAck()) {
                evento.marcarPublicado(Instant.now());
                return;
            }

            evento.registrarFalha(motivoDaRecusa(ack));

        } catch (InterruptedException excecao) {
            Thread.currentThread().interrupt();
            evento.registrarFalha("Publicacao interrompida");
        } catch (Exception excecao) {
            // Broker fora do ar cai aqui. A linha continua pendente e o
            // proximo ciclo tenta de novo.
            LOG.warn("Falha ao publicar o evento {}: {}", evento.getIdPublico(),
                    excecao.getMessage());
            evento.registrarFalha(resumir(excecao.getMessage()));
        }
    }

    /**
     * O corpo vai como JSON cru, do jeito que foi gravado no outbox.
     *
     * Sem conversor de mensagem no caminho: o que esta na coluna ja e o
     * contrato, e reserializar daria a chance de o que sai do banco e o que
     * chega na fila deixarem de ser a mesma coisa.
     *
     * PERSISTENT porque fila duravel com mensagem transiente perde tudo quando
     * o broker reinicia — a durabilidade da fila sozinha nao basta (RNF-PAG-04).
     */
    private Message mensagemDe(EventoOutbox evento) {
        MessageProperties propriedades = new MessageProperties();
        propriedades.setContentType(MessageProperties.CONTENT_TYPE_JSON);
        propriedades.setDeliveryMode(MessageDeliveryMode.PERSISTENT);
        propriedades.setType(evento.getTipo());
        propriedades.setMessageId(evento.getIdPublico().toString());

        return new Message(evento.getConteudo().getBytes(StandardCharsets.UTF_8), propriedades);
    }

    private String motivoDaRecusa(CorrelationData.Confirm ack) {
        if (ack == null) {
            return "O broker nao confirmou dentro do prazo";
        }
        return resumir("Publicacao recusada pelo broker: " + ack.getReason());
    }

    /** A coluna `ultimo_erro` e VARCHAR(255): mensagem longa nao pode estourar. */
    private String resumir(String mensagem) {
        if (mensagem == null) {
            return "Falha sem mensagem";
        }
        return mensagem.length() <= 255 ? mensagem : mensagem.substring(0, 255);
    }
}
