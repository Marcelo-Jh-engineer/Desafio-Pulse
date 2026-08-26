package com.api.ecommerce.business.gateway;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/**
 * A regra do gateway simulado.
 *
 * O que se prova aqui e o DETERMINISMO (RF-PAG-12). Um gateway que sorteia
 * deixaria todo teste de pagamento instavel e a demonstracao impossivel de
 * repetir: a mesma compra daria resultados diferentes a cada tentativa.
 */
@DisplayName("Gateway simulado")
class GatewayFakeDePagamentoTest {

    private final GatewayDePagamento gateway = new GatewayFakeDePagamento();

    // T1
    @Test
    @DisplayName("o mesmo valor da sempre o mesmo resultado")
    void mesmoValorMesmoResultado() {
        for (long valor : new long[] {1298, 2023, 8997, 100, 0}) {
            ResultadoDoPagamento primeira = gateway.processar(valor);

            for (int repeticao = 0; repeticao < 20; repeticao++) {
                ResultadoDoPagamento outra = gateway.processar(valor);
                assertThat(outra).isEqualTo(primeira);
            }
        }
    }

    // T2
    @Test
    @DisplayName("total terminado em 3 e em 7 e recusado, com motivos diferentes")
    void recusaPorUltimoDigito() {
        ResultadoDoPagamento semSaldo = gateway.processar(2023);
        ResultadoDoPagamento bloqueado = gateway.processar(8997);

        assertThat(semSaldo.aprovado()).isFalse();
        assertThat(bloqueado.aprovado()).isFalse();

        // Motivos distintos: o texto vai para a tela, e "recusado" sozinho nao
        // diz a ninguem o que fazer a seguir.
        assertThat(semSaldo.motivo()).isEqualTo("Saldo insuficiente");
        assertThat(bloqueado.motivo()).isEqualTo("Cartão bloqueado");
        assertThat(semSaldo.motivo()).isNotEqualTo(bloqueado.motivo());
    }

    @ParameterizedTest
    @ValueSource(longs = {1298, 100, 649, 8990, 2799, 1, 2, 4, 5, 6, 8, 9})
    @DisplayName("qualquer outro final aprova, e sem motivo")
    void demaisAprovam(long valor) {
        ResultadoDoPagamento resultado = gateway.processar(valor);

        assertThat(resultado.aprovado()).isTrue();
        assertThat(resultado.motivo()).isNull();
    }
}
