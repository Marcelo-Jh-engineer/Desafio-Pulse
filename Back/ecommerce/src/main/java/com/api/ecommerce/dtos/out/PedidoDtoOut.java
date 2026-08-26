package com.api.ecommerce.dtos.out;

import com.api.ecommerce.infrastructure.entities.Pedido;
import com.api.ecommerce.infrastructure.enums.StatusPedido;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.List;

/**
 * O pedido como a tela precisa dele — docs/models.md secao 9.
 *
 * NAO ha retrato do comprador aqui. As colunas `nome_comprador`,
 * `email_comprador` e `login_comprador` existem para o registro historico; quem
 * consulta o pedido ja e o dono dele, e devolver o proprio login — que pode ser
 * CPF ou CNPJ — em toda leitura seria trafegar documento sem nenhuma tela
 * precisar dele (LGPD, RNF-SEC-03).
 *
 * `totalEmCentavos` vem da entidade, que o calcula somando as linhas. Recalcular
 * aqui daria duas somas do mesmo numero, em lugares diferentes, para divergirem
 * um dia.
 */
@Schema(name = "Pedido")
public record PedidoDtoOut(
        @Schema(description = "Id publico do pedido") String id,
        StatusPedido status,
        @Schema(description = "Soma dos totais das linhas", example = "3995")
        long totalEmCentavos,
        Instant criadoEm,
        @Schema(description = "Preenchido apenas em pedido PAGO") Instant pagoEm,
        @Schema(description = "Preenchido apenas quando o pagamento foi recusado")
        String motivoRecusa,
        List<PedidoItemDtoOut> itens) {

    public static PedidoDtoOut de(Pedido pedido) {
        return new PedidoDtoOut(
                pedido.getIdPublico().toString(),
                pedido.getStatus(),
                pedido.getTotalEmCentavos(),
                pedido.getCriadoEm(),
                pedido.getPagoEm(),
                pedido.getMotivoRecusa(),
                pedido.getItens().stream().map(PedidoItemDtoOut::de).toList());
    }
}
