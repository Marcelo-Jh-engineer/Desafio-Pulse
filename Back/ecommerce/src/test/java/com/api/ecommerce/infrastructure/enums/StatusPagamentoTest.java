package com.api.ecommerce.infrastructure.enums;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * A maquina de estados da tentativa de pagamento — T18 do PRD.
 *
 * A regra fica no tipo. E ela que faz uma reentrega do RabbitMQ esbarrar em
 * pedra: a segunda mensagem encontra APROVADO, nao tem para onde ir, e o
 * estoque nao sai duas vezes para uma venda so.
 */
@DisplayName("Status do pagamento")
class StatusPagamentoTest {

    @Test
    @DisplayName("tentativa em aberto vai para aprovado ou recusado")
    void deAbertoSeSai() {
        assertThat(StatusPagamento.PENDENTE.podeIrPara(StatusPagamento.APROVADO)).isTrue();
        assertThat(StatusPagamento.PENDENTE.podeIrPara(StatusPagamento.RECUSADO)).isTrue();
        assertThat(StatusPagamento.AGUARDANDO.podeIrPara(StatusPagamento.APROVADO)).isTrue();
    }

    // T18
    @Test
    @DisplayName("tentativa resolvida nao volta atras")
    void resolvidoNaoVolta() {
        assertThat(StatusPagamento.APROVADO.podeIrPara(StatusPagamento.PENDENTE)).isFalse();
        assertThat(StatusPagamento.APROVADO.podeIrPara(StatusPagamento.RECUSADO)).isFalse();
        assertThat(StatusPagamento.RECUSADO.podeIrPara(StatusPagamento.APROVADO)).isFalse();
        assertThat(StatusPagamento.RECUSADO.podeIrPara(StatusPagamento.PENDENTE)).isFalse();
    }

    @Test
    @DisplayName("PENDENTE espera o nosso consumidor; AGUARDANDO espera o cliente pagar")
    void ambosEstaoEmAberto() {
        assertThat(StatusPagamento.PENDENTE.estaEmAberto()).isTrue();
        assertThat(StatusPagamento.AGUARDANDO.estaEmAberto()).isTrue();
        assertThat(StatusPagamento.APROVADO.estaEmAberto()).isFalse();
        assertThat(StatusPagamento.RECUSADO.estaEmAberto()).isFalse();
    }
}
