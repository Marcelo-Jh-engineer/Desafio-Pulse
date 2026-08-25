package com.api.ecommerce.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

/**
 * O que o front manda para colocar um produto no carrinho.
 *
 * Nao ha id de carrinho aqui: o carrinho e o aberto de quem apresentou o token.
 * Aceitar o id no corpo abriria a porta para pedir o carrinho de outra pessoa, e
 * a defesa seria conferir o dono a cada chamada — uma conferencia que so precisa
 * existir porque o campo existe.
 *
 * Nao ha teto de quantidade: o unico limite e o estoque, e quem o confere e
 * ServicoDeEstoque, dentro do servico. Aqui so se barra quantidade que nem
 * chega a ser um pedido — zero ou negativa.
 */
@Schema(name = "ItemParaOCarrinho")
public record RequisicaoDeItemDoCarrinho(
        @NotNull(message = "Informe o produto.")
        @Schema(description = "Id publico do produto",
                example = "187f774c-4d3a-48ab-921e-e7fa7fdda55b")
        UUID produtoId,

        @Min(value = 1, message = "A quantidade precisa ser pelo menos 1.")
        @Schema(example = "3")
        int quantidade) {
}
