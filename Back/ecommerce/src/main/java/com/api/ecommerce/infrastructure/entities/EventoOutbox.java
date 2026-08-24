package com.api.ecommerce.infrastructure.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import lombok.Getter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Evento a caminho do broker — padrao transactional outbox.
 *
 * Gravado na MESMA transacao do fato que o originou. E essa a razao de o
 * padrao existir: se a transacao voltar atras, o evento volta com ela, e nunca
 * se anuncia la fora algo que nao aconteceu aqui dentro.
 *
 * Ainda nao ha mensageria nem publicador. Ate haver, as linhas ficam com
 * publicadoEm nulo e ninguem as le — o que nao torna a tabela inutil agora: a
 * parte trabalhosa do padrao e gravar o evento junto com o fato, e isso e o
 * que fica pronto para quando a fila entrar.
 *
 * O nome do agregado e o id vao soltos, sem relacao JPA, de proposito. Um
 * evento e um registro do que ja passou; se ele apontasse para a entidade viva,
 * apagar um pedido antigo esbarraria no evento que o anunciou.
 */
@Entity
@Table(name = "tb_outbox_eventos")
@Getter
public class EventoOutbox {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private UUID idPublico = UUID.randomUUID();

    /** Qual entidade mudou: "PEDIDO", "PAGAMENTO". */
    @Column(nullable = false, updatable = false, length = 40)
    private String agregado;

    @Column(nullable = false, updatable = false)
    private Long agregadoId;

    /** O que aconteceu: "PEDIDO_PAGO", "PAGAMENTO_RECUSADO". */
    @Column(nullable = false, updatable = false, length = 60)
    private String tipo;

    /** Corpo da mensagem, ja serializado, pronto para ir ao broker. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, updatable = false, columnDefinition = "jsonb")
    private String conteudo;

    @Column(nullable = false)
    private short tentativas;

    @Column(length = 255)
    private String ultimoErro;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant criadoEm;

    private Instant publicadoEm;

    protected EventoOutbox() {
        // Exigido pelo JPA.
    }

    public EventoOutbox(String agregado, Long agregadoId, String tipo, String conteudo) {
        this.agregado = agregado;
        this.agregadoId = agregadoId;
        this.tipo = tipo;
        this.conteudo = conteudo;
    }

    public void marcarPublicado(Instant quando) {
        this.publicadoEm = quando;
        this.ultimoErro = null;
    }

    /**
     * A entrega falhou. A linha continua pendente e sera tentada de novo — o
     * contador existe para que uma mensagem que nunca passa possa ser separada
     * em vez de ocupar o publicador para sempre.
     */
    public void registrarFalha(String erro) {
        this.tentativas++;
        this.ultimoErro = erro;
    }

    public boolean foiPublicado() {
        return publicadoEm != null;
    }

    @Override
    public boolean equals(Object outro) {
        return outro instanceof EventoOutbox evento && idPublico.equals(evento.idPublico);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(idPublico);
    }
}
