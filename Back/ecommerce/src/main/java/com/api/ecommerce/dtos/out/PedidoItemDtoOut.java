package com.api.ecommerce.dtos.out;

import com.api.ecommerce.infrastructure.entities.ItemPedido;
import com.api.ecommerce.infrastructure.enums.Unidade;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Linha do pedido — docs/models.md secao 9, RF-PED-03.
 *
 * Todos os campos exibidos sao copia congelada na compra, e nenhum e lido do
 * produto de hoje: alterar o preco no catalogo nao pode reescrever a historia
 * de um pedido que ja aconteceu. So o `produtoId` vem da referencia viva, e ele
 * existe para o link "comprar de novo", nao para exibir valor.
 *
 * Sem `urlImagem` de proposito: a foto e derivada do produto atual, e o pedido
 * e um registro do que foi comprado — nao uma vitrine.
 */
@Schema(name = "ItemPedido")
public record PedidoItemDtoOut(
        @Schema(description = "Id publico do produto") String produtoId,
        @Schema(example = "Banana Prata") String nome,
        @Schema(description = "Rotulo de venda, congelado na compra") Unidade unidade,
        @Schema(example = "2") int quantidade,
        @Schema(description = "Preco unitario congelado na compra", example = "649")
        long precoEmCentavos,
        @Schema(description = "precoEmCentavos * quantidade", example = "1298")
        long totalLinhaEmCentavos) {

    public static PedidoItemDtoOut fromEntityToDto(ItemPedido item) {
        return new PedidoItemDtoOut(
                item.getProduto().getIdPublico().toString(),
                item.getNome(),
                item.getUnidade(),
                item.getQuantidade(),
                item.getPrecoEmCentavos(),
                item.getTotalLinhaEmCentavos());
    }
}
