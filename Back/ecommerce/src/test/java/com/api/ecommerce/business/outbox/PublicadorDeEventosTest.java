package com.api.ecommerce.business.outbox;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

import com.api.ecommerce.config.ConfiguracaoDoRabbit;
import com.api.ecommerce.infrastructure.entities.EventoOutbox;
import com.api.ecommerce.infrastructure.enums.TipoDeEvento;
import com.api.ecommerce.infrastructure.repositories.RepositorioDeEventoOutbox;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.domain.Pageable;

/**
 * O publicador do outbox, sem broker.
 *
 * O RabbitTemplate e dublado, e a confirmacao do broker e simulada completando
 * — ou nao — a CorrelationData que o publicador anexa. O que se prova e a
 * unica regra que importa aqui: **`publicado_em` so e gravado depois do ack**.
 *
 * Fora de cobertura, e registrado: o SKIP LOCKED de verdade, o roteamento pela
 * exchange e a DLQ. Sem banco e sem broker, quem confere isso e o painel em
 * :15672.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("Publicador do outbox")
class PublicadorDeEventosTest {

    @Mock private RepositorioDeEventoOutbox eventos;
    @Mock private RabbitTemplate rabbit;

    private PublicadorDeEventos publicador;
    private EventoOutbox evento;

    @BeforeEach
    void preparar() {
        publicador = new PublicadorDeEventos(eventos, rabbit);

        evento = new EventoOutbox("PAGAMENTO", 1L,
                TipoDeEvento.PAGAMENTO_SOLICITADO.name(),
                "{\"pagamentoId\":\"11111111-1111-1111-1111-111111111111\"}");

        when(eventos.pendentesParaPublicar(any(Pageable.class))).thenReturn(List.of(evento));
    }

    /** O broker respondendo o que o teste mandar. */
    private void brokerResponde(boolean ack, String motivo) {
        doAnswer(chamada -> {
            CorrelationData confirmacao = chamada.getArgument(3);
            confirmacao.getFuture().complete(new CorrelationData.Confirm(ack, motivo));
            return null;
        }).when(rabbit).send(anyString(), anyString(), any(Message.class), any(CorrelationData.class));
    }

    // T8
    @Test
    @DisplayName("publicacao confirmada marca publicado_em")
    void confirmadaMarcaPublicado() {
        brokerResponde(true, null);

        publicador.publicarPendentes();

        assertThat(evento.foiPublicado()).isTrue();
        assertThat(evento.getTentativas()).isZero();
        assertThat(evento.getUltimoErro()).isNull();
    }

    @Test
    @DisplayName("a mensagem sai na exchange de eventos, com a chave do tipo")
    void publicaComAChaveDoTipo() {
        brokerResponde(true, null);

        publicador.publicarPendentes();

        // A chave vem do enum, e nao de concatenacao: chave montada a mao erra
        // em silencio — o broker aceita, nenhuma fila casa, o evento some.
        org.mockito.Mockito.verify(rabbit).send(
                eq(ConfiguracaoDoRabbit.EXCHANGE),
                eq(TipoDeEvento.PAGAMENTO_SOLICITADO.chaveDeRoteamento()),
                any(Message.class),
                any(CorrelationData.class));
    }

    // T7
    @Test
    @DisplayName("broker fora do ar nao marca publicado, e conta a tentativa")
    void falhaNaoMarcaPublicado() {
        doThrow(new AmqpException("Connection refused"))
                .when(rabbit).send(anyString(), anyString(), any(Message.class),
                        any(CorrelationData.class));

        publicador.publicarPendentes();

        // A linha continua pendente: o proximo ciclo tenta de novo, e e por
        // isso que a API pode responder com o RabbitMQ desligado.
        assertThat(evento.foiPublicado()).isFalse();
        assertThat(evento.getTentativas()).isEqualTo((short) 1);
        assertThat(evento.getUltimoErro()).contains("Connection refused");
    }

    @Test
    @DisplayName("nack do broker tambem deixa a linha pendente")
    void nackNaoMarcaPublicado() {
        brokerResponde(false, "NO_ROUTE");

        publicador.publicarPendentes();

        assertThat(evento.foiPublicado()).isFalse();
        assertThat(evento.getTentativas()).isEqualTo((short) 1);
        assertThat(evento.getUltimoErro()).contains("NO_ROUTE");
    }

    @Test
    @DisplayName("tipo desconhecido nao derruba o ciclo: registra e segue")
    void tipoDesconhecido() {
        EventoOutbox estranho = new EventoOutbox("PEDIDO", 9L, "EVENTO_QUE_NAO_EXISTE", "{}");
        when(eventos.pendentesParaPublicar(any(Pageable.class))).thenReturn(List.of(estranho));

        publicador.publicarPendentes();

        assertThat(estranho.foiPublicado()).isFalse();
        assertThat(estranho.getUltimoErro()).contains("EVENTO_QUE_NAO_EXISTE");
        org.mockito.Mockito.verify(rabbit, org.mockito.Mockito.never())
                .send(anyString(), anyString(), any(Message.class), any(CorrelationData.class));
    }
}
