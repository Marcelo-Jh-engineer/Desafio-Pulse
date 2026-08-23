package com.api.ecommerce.dtos;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.Map;

/**
 * Formato unico de erro da API. TODA excecao sai daqui — o front nunca recebe
 * stack trace, nome de classe ou mensagem interna.
 *
 * Espelha ErroApi de docs/models.md secao 12.
 *
 * @param status        codigo HTTP, repetido no corpo para o cliente que so le JSON
 * @param mensagem      texto exibivel ao usuario, sempre
 * @param errosPorCampo chave EXATA do campo do formulario, para alimentar o
 *                      setError do React Hook Form. Ausente quando nao ha erro
 *                      por campo
 * @param timestamp     ISO 8601
 */
@Schema(name = "Erro", description = "Formato padrao de erro da API")
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErroDto(
        @Schema(example = "409") int status,
        @Schema(example = "Nao foi possivel concluir a operacao.") String mensagem,
        @Schema(example = "{\"email\": \"Este e-mail ja esta cadastrado.\"}")
        Map<String, String> errosPorCampo,
        Instant timestamp) {

    public static ErroDto de(int status, String mensagem) {
        return new ErroDto(status, mensagem, null, Instant.now());
    }

    public static ErroDto de(int status, String mensagem, Map<String, String> errosPorCampo) {
        return new ErroDto(status, mensagem, errosPorCampo, Instant.now());
    }
}
