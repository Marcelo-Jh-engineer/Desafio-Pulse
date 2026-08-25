package com.api.ecommerce.dtos.out;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import java.util.function.Function;
import org.springframework.data.domain.Page;

/**
 * Envelope de paginacao — docs/models.md secao 12.
 *
 * Espelha o `Page` do Spring Data com os nomes em portugues. Existe justamente
 * para o `Page` NAO ser serializado direto: o JSON que o Spring gera dele traz
 * `pageable`, `sort` e `numberOfElements`, campos internos que virariam
 * contrato sem ninguem ter decidido isso — e que mudam entre versoes do Spring.
 *
 * @param conteudo itens desta pagina
 * @param pagina indice base 0
 */
@Schema(name = "Pagina")
public record PaginaDtoOut<T>(
        List<T> conteudo,
        @Schema(description = "Indice base 0", example = "0") int pagina,
        @Schema(example = "10") int tamanho,
        @Schema(example = "52") long totalElementos,
        @Schema(example = "6") int totalPaginas,
        boolean primeira,
        boolean ultima) {

    public static <E, D> PaginaDtoOut<D> de(Page<E> pagina, Function<E, D> conversor) {
        return new PaginaDtoOut<>(
                pagina.getContent().stream().map(conversor).toList(),
                pagina.getNumber(),
                pagina.getSize(),
                pagina.getTotalElements(),
                pagina.getTotalPages(),
                pagina.isFirst(),
                pagina.isLast());
    }
}
