package com.api.ecommerce.dtos;

import com.api.ecommerce.infrastructure.enums.Papel;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

/**
 * Usuario como o front espera — docs/models.md secao 5.
 *
 * Nunca carrega senha nem hash. Os papeis vem do token, ja normalizados: o
 * front recebe `CLIENTE` e `ADMIN` e nao sabe de onde saiu.
 */
@Schema(name = "Usuario")
public record UsuarioDto(
        @Schema(example = "8c84cae8-ca95-4250-a38b-6d9d3733e817") String id,
        @Schema(example = "Maria Souza") String nome,
        @Schema(example = "maria@exemplo.com") String email,
        @Schema(description = "CPF, CNPJ (so digitos) ou e-mail", example = "11144477735")
        String login,
        List<Papel> papeis) {
}
