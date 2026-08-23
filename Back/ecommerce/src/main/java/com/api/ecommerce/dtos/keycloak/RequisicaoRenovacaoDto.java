package com.api.ecommerce.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

/** Refresh token recebido no login. Serve para renovar e para encerrar a sessao. */
@Schema(name = "RequisicaoRenovacao")
public record RequisicaoRenovacaoDto(@NotBlank String refreshToken) {
}
