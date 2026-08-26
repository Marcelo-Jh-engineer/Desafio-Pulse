package com.api.ecommerce.dtos.out;

import com.api.ecommerce.infrastructure.entities.Pagamento;
import com.api.ecommerce.infrastructure.enums.MetodoPagamento;
import com.api.ecommerce.infrastructure.enums.StatusPagamento;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;

/**
 * Uma tentativa de pagamento — docs/models.md secao 10.
 *
 * `processadoEm` NULO e o sinal de que o consumidor ainda nao pegou a mensagem:
 * e por ele que a tela sabe que deve continuar consultando. Um valor sempre
 * preenchido tiraria do cliente a unica forma de distinguir "esperando" de
 * "resolvido agora".
 *
 * Nao ha campo de cartao aqui, e nao ha em lugar nenhum: numero, validade e CVV
 * nao entram pela API, nao viajam na mensagem e nao existem em coluna
 * (RF-PAG-20).
 */
@Schema(name = "Pagamento")
public record PagamentoDtoOut(
        @Schema(description = "Id publico da tentativa") String id,
        MetodoPagamento metodo,
        StatusPagamento status,
        @Schema(description = "Igual ao total do pedido", example = "2023")
        long valorEmCentavos,
        @Schema(description = "Preenchido apenas em tentativa recusada",
                example = "Saldo insuficiente")
        String motivoRecusa,
        Instant criadoEm,
        @Schema(description = "Nulo enquanto a tentativa espera na fila")
        Instant processadoEm) {

    public static PagamentoDtoOut de(Pagamento pagamento) {
        return new PagamentoDtoOut(
                pagamento.getIdPublico().toString(),
                pagamento.getMetodo(),
                pagamento.getStatus(),
                pagamento.getValorEmCentavos(),
                pagamento.getMotivoRecusa(),
                pagamento.getCriadoEm(),
                pagamento.getProcessadoEm());
    }
}
