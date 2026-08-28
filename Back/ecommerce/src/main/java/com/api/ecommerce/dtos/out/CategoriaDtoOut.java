package com.api.ecommerce.dtos.out;

import com.api.ecommerce.infrastructure.entities.Categoria;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Categoria como o front espera — docs/models.md secao 3.
 *
 * O `id` daqui e o id publico, um UUID, e e por ele que o catalogo filtra: a
 * chave numerica do banco nunca sai da API, porque id sequencial vazado conta
 * quantas categorias existem e convida a varrer de uma em uma.
 */
@Schema(name = "Categoria")
public record CategoriaDtoOut(
        @Schema(example = "c1a2b3c4-0001-4000-8000-000000000001") String id,
        @Schema(description = "Texto de exibicao, com acento", example = "Hortifruti") String nome,
        String descricao,
        String urlIcone,
        @Schema(description = "Ordem crescente no filtro do catalogo", example = "1") int ordem,
        boolean ativa) {

    public static CategoriaDtoOut fromEntityToDto(Categoria categoria) {
        return new CategoriaDtoOut(
                categoria.getIdPublico().toString(),
                categoria.getNome(),
                categoria.getDescricao(),
                categoria.getUrlIcone(),
                categoria.getOrdem(),
                categoria.isAtiva());
    }
}
