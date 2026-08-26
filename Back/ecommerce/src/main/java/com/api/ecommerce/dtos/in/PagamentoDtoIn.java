package com.api.ecommerce.dtos.in;

import com.api.ecommerce.infrastructure.enums.MetodoPagamento;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;


public record PagamentoDtoIn(
        @Schema(description = "Unico metodo desta fatia", example = "CARTAO")
        @NotNull(message = "Escolha a forma de pagamento.")
        MetodoPagamento metodo) {
}
