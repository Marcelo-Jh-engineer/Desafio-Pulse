package com.api.ecommerce.dtos;

import com.api.ecommerce.infrastructure.entities.Carrinho;
import com.api.ecommerce.infrastructure.enums.StatusCarrinho;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * O carrinho como a tela precisa dele — docs/models.md secao 7.
 *
 * `totalEmCentavos` vem de `Carrinho.totalEmCentavos()`. Nao e recalculado
 * aqui de proposito — duas somas do mesmo numero, em lugares diferentes, so
 * servem para divergirem um dia.
 */
@Schema(name = "Carrinho")
public record CarrinhoDto(
        @Schema(description = "Id publico do carrinho") String id,
        StatusCarrinho status,
        List<ItemCarrinhoDto> itens,
        @Schema(description = "Soma de preco x quantidade das linhas", example = "1947")
        long totalEmCentavos,
        @Schema(description = "Soma das quantidades, nao o numero de linhas", example = "3")
        int quantidadeItens) {

    /**
     * @param urlsDasImagens endereco da foto por id publico de produto, ja
     *                       resolvido por ServicoDeImagemDeProduto
     */
    public static CarrinhoDto de(Carrinho carrinho, Map<UUID, String> urlsDasImagens) {
        return new CarrinhoDto(
                carrinho.getIdPublico().toString(),
                carrinho.getStatus(),
                carrinho.getItens().stream()
                        .map(item -> ItemCarrinhoDto.de(item,
                                urlsDasImagens.get(item.getProduto().getIdPublico())))
                        .toList(),
                carrinho.totalEmCentavos(),
                carrinho.quantidadeItens());
    }
}
