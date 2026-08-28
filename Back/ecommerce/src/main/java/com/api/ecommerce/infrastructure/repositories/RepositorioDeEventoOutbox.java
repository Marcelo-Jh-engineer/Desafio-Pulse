package com.api.ecommerce.infrastructure.repositories;

import com.api.ecommerce.infrastructure.entities.EventoOutbox;
import jakarta.persistence.LockModeType;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;

/**
 * Caixa de saida de eventos.
 *
 * Escrita agora, leitura quando a mensageria entrar: sem publicador rodando,
 * as linhas so se acumulam com publicadoEm nulo.
 */
public interface RepositorioDeEventoOutbox extends JpaRepository<EventoOutbox, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints(@jakarta.persistence.QueryHint(name = "jakarta.persistence.lock.timeout", value = "-2"))
    @Query("""
            SELECT e FROM EventoOutbox e
             WHERE e.publicadoEm IS NULL
             ORDER BY e.criadoEm ASC
            """)
    List<EventoOutbox> pendentesParaPublicar(Pageable lote);
}
