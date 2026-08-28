package com.api.ecommerce.dtos.out;

import com.api.ecommerce.infrastructure.entities.Pedido;
import com.api.ecommerce.infrastructure.enums.StatusPedido;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.List;

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

    public static PedidoDtoOut fromEntityToDto(Pedido pedido) {
        return new PedidoDtoOut(
                pedido.getIdPublico().toString(),
                pedido.getStatus(),
                pedido.getTotalEmCentavos(),
                pedido.getCriadoEm(),
                pedido.getPagoEm(),
                pedido.getMotivoRecusa(),
                pedido.getItens().stream().map(PedidoItemDtoOut::fromEntityToDto).toList());
    }
}
