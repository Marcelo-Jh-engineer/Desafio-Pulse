package com.api.ecommerce.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Cadastro — cinco campos no front, quatro na rede: a confirmacao de senha
 * existe so no formulario.
 *
 * `login` e `email` sao separados de proposito: o login pode ser um documento,
 * e mesmo quando e e-mail nao precisa ser o mesmo endereco de contato.
 */
@Schema(name = "RequisicaoCadastro")
public record RequisicaoCadastroDto(
        @NotBlank @Schema(description = "CPF, CNPJ (so digitos) ou e-mail", example = "11144477735")
        String login,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 3, max = 120) String nome,
        @NotBlank @Size(min = 6, max = 100) String senha) {
}
