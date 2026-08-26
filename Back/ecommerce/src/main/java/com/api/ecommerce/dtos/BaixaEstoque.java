package com.api.ecommerce.dtos;

import com.api.ecommerce.infrastructure.entities.Produto;

public record BaixaEstoque(Produto produto, int quantidade) {
}
