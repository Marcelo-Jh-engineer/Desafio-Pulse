package com.api.ecommerce.dtos.in;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

/**
 * Credenciais de acesso — espelha `RequisicaoLogin` de docs/models.md.
 *
 * `identificador` e um so: pode ser CPF, CNPJ (apenas digitos) ou e-mail. Nao
 * existe campo de tipo de pessoa; o formato e inferido, e o Keycloak aceita
 * tanto username quanto e-mail no mesmo campo.
 */
@Schema(name = "RequisicaoLogin")
public record LoginDtoIn(
        @NotBlank @Schema(example = "11144477735") String identificador,
        @NotBlank String senha) {
}
