package com.api.ecommerce.infrastructure.enums;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

/**
 * A maquina de estados do pedido — T12 do PRD.
 *
 * A regra fica no TIPO, e nao espalhada nos servicos: quem quiser mudar o
 * status de um pedido passa por aqui, e nao ha um segundo lugar onde a mesma
 * decisao possa divergir.
 *
 * Sai de PENDENTE, e so. Pedido pago, recusado ou cancelado e ponto final desta
 * fatia — a volta de FALHOU para PENDENTE existe, mas e um caminho proprio
 * (`Pedido.reabrirParaNovaTentativa`), justamente para nao virar transicao
 * generica.
 */
@DisplayName("Status do pedido")
class StatusPedidoTest {

    @Test
    @DisplayName("de PENDENTE se sai para qualquer desfecho")
    void dePendenteSeSai() {
        assertThat(StatusPedido.PENDENTE.podeIrPara(StatusPedido.PAGO)).isTrue();
        assertThat(StatusPedido.PENDENTE.podeIrPara(StatusPedido.CANCELADO)).isTrue();
        assertThat(StatusPedido.PENDENTE.podeIrPara(StatusPedido.FALHOU)).isTrue();
    }

    @Test
    @DisplayName("nao ha volta: PAGO para PENDENTE e CANCELADO para PAGO sao recusados")
    void naoHaVolta() {
        assertThat(StatusPedido.PAGO.podeIrPara(StatusPedido.PENDENTE)).isFalse();
        assertThat(StatusPedido.CANCELADO.podeIrPara(StatusPedido.PAGO)).isFalse();
        assertThat(StatusPedido.PAGO.podeIrPara(StatusPedido.CANCELADO)).isFalse();
        assertThat(StatusPedido.CANCELADO.podeIrPara(StatusPedido.PENDENTE)).isFalse();
    }

    @ParameterizedTest
    @EnumSource(StatusPedido.class)
    @DisplayName("nenhum status vai para PENDENTE por esta porta")
    void ninguemVoltaParaPendente(StatusPedido origem) {
        assertThat(origem.podeIrPara(StatusPedido.PENDENTE)).isFalse();
    }
}
