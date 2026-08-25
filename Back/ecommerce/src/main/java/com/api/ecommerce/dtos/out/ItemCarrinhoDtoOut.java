package com.api.ecommerce.dtos.out;

import com.api.ecommerce.infrastructure.entities.ItemCarrinho;
import com.api.ecommerce.infrastructure.enums.Unidade;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Linha do carrinho — docs/models.md secao 7.
 *
 * `urlImagem` NAO e retrato: ela chega pronta de ServicoDeImagemDeProduto, o
 * unico lugar que decide entre os bytes no banco e um caminho externo. A linha
 * nao guarda esse endereco em coluna — ele e derivado do produto, e guardar
 * seria copiar nulo para todo produto cuja foto vive em tb_produto_imagens.
 *
 * `precoEmCentavos` e `unidade` sao o retrato do produto no instante em que o
 * item entrou, e nao uma leitura do catalogo de agora. E o que faz o carrinho
 * mostrar o valor que a pessoa viu ao adicionar, e o que permite ao checkout
 * perceber que o preco mudou desde entao (RF-CHK-08).
 */
@Schema(name = "ItemCarrinho")
public record ItemCarrinhoDtoOut(
        @Schema(description = "Id publico do produto") String produtoId,
        @Schema(example = "Banana Prata") String nome,
        @Schema(description = "Endereco da foto, resolvido na leitura") String urlImagem,
        @Schema(description = "Rotulo de venda, congelado na adicao") Unidade unidade,
        @Schema(example = "3") int quantidade,
        @Schema(description = "Preco unitario congelado na adicao", example = "649")
        long precoEmCentavos,
        @Schema(description = "precoEmCentavos * quantidade", example = "1947")
        long totalLinhaEmCentavos,
        @Schema(description = "Estoque do produto agora — nao e reserva", example = "84")
        int estoqueDisponivel,
        @Schema(description = "O preco do catalogo andou desde que o item entrou")
        boolean precoDivergiu) {

    public static ItemCarrinhoDtoOut de(ItemCarrinho item, String urlImagem) {
        return new ItemCarrinhoDtoOut(
                item.getProduto().getIdPublico().toString(),
                item.getNome(),
                urlImagem,
                item.getUnidade(),
                item.getQuantidade(),
                item.getPrecoEmCentavos(),
                item.getTotalLinhaEmCentavos(),
                item.getProduto().getQuantidadeEstoque(),
                item.precoDivergiu());
    }
}
