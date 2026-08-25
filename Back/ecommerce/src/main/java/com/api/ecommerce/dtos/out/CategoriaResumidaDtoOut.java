package com.api.ecommerce.dtos.out;

import com.api.ecommerce.infrastructure.entities.Categoria;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * A categoria como ela aparece DENTRO de um produto — docs/models.md secao 4.
 *
 * So o necessario para o cartao do catalogo: o id para o link do filtro, o nome
 * para exibir, a ordem e o estado. `descricao` e `urlIcone` ficam de fora
 * porque numa pagina de dez produtos eles viriam dez vezes, repetidos, para
 * alimentar uma tela que nao os desenha — quem precisa deles e o filtro, e o
 * filtro pede /api/categorias, onde vem a CategoriaDtoOut inteira.
 */
@Schema(name = "CategoriaDoProduto")
public record CategoriaResumidaDtoOut(
        @Schema(example = "c1a2b3c4-0001-4000-8000-000000000001") String id,
        @Schema(example = "Bebidas") String nome,
        @Schema(example = "2") int ordem,
        boolean ativa) {

    public static CategoriaResumidaDtoOut de(Categoria categoria) {
        return new CategoriaResumidaDtoOut(
                categoria.getIdPublico().toString(),
                categoria.getNome(),
                categoria.getOrdem(),
                categoria.isAtiva());
    }
}
