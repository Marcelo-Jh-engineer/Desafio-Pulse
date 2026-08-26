package com.api.ecommerce.business.outbox;

import com.api.ecommerce.infrastructure.entities.EventoOutbox;
import com.api.ecommerce.infrastructure.enums.TipoDeEvento;
import com.api.ecommerce.infrastructure.repositories.RepositorioDeEventoOutbox;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

/**
 * Grava o evento na MESMA transacao do fato que o originou — padrao
 * transactional outbox.
.
 */
@Component
public class RegistradorDeEventos {

    private final RepositorioDeEventoOutbox eventos;
    private final ObjectMapper json;

    public RegistradorDeEventos(RepositorioDeEventoOutbox eventos, ObjectMapper json) {
        this.eventos = eventos;
        this.json = json;
    }

    /**
     * @param agregado    qual entidade mudou: "PEDIDO", "PAGAMENTO"
     * @param agregadoId  o id interno dela — a linha precisa dele em NOT NULL
     * @param tipo        o que aconteceu; e ele que decide a chave de roteamento
     * @param conteudo    o corpo da mensagem. So a referencia, nunca o estado (D4)
     */
    public EventoOutbox registrar(String agregado, Long agregadoId, TipoDeEvento tipo,
                                  Object conteudo) {
        return eventos.save(
                new EventoOutbox(agregado, agregadoId, tipo.name(), serializar(conteudo)));
    }

    private String serializar(Object conteudo) {
        try {
            return json.writeValueAsString(conteudo);
        } catch (JsonProcessingException excecao) {
            // Sem evento nao ha commit: o outbox so vale se o evento e o fato
            // caem juntos.
            throw new IllegalStateException("Nao foi possivel serializar o evento", excecao);
        }
    }
}
