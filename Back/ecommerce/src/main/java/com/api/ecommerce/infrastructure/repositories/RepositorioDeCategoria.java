package com.api.ecommerce.infrastructure.repositories;

import com.api.ecommerce.infrastructure.entities.Categoria;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Categorias do catalogo.
 *
 * A lista e curta e estavel, entao sai como array puro, sem paginacao
 * (docs/models.md secao 3). O front nunca codifica essa lista: ela vem daqui.
 *
 * A categoria e identificada pelo idPublico, e por nada mais — nao ha slug.
 */
public interface RepositorioDeCategoria extends JpaRepository<Categoria, Long> {

    /** O filtro publico so enxerga categoria ativa, na ordem definida pelo admin. */
    List<Categoria> findByAtivaTrueOrderByOrdemAsc();

    List<Categoria> findAllByOrderByOrdemAsc();

    /** Filtro do catalogo e formulario do admin: os dois chegam pelo id. */
    Optional<Categoria> findByIdPublico(UUID idPublico);
}
