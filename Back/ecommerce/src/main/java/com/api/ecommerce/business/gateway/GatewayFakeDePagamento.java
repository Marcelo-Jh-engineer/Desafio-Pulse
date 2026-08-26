package com.api.ecommerce.business.gateway;

import org.springframework.stereotype.Component;

/**
 * Gateway simulado: decide pelo ultimo digito do valor.
 *
 * | Ultimo digito | Resultado | Motivo               |
 * |---------------|-----------|----------------------|
 * | 3             | recusado  | Saldo insuficiente   |
 * | 7             | recusado  | Cartao bloqueado     |
 * | qualquer      | aprovado  | —                    |
 *
 * DETERMINISTICO de proposito, nunca aleatorio (RF-PAG-12). Um sorteio faria a
 * mesma compra dar resultados diferentes a cada tentativa: o teste ficaria
 * instavel e a demonstracao, impossivel de reproduzir. Do jeito que esta, para
 * mostrar uma recusa basta montar um carrinho cujo total termine em 3 ou 7 — 7
 * unidades de detergente a R$ 2,89 dao R$ 20,23.
 *
 * Nao ha rede aqui dentro, e isso importa: a chamada acontece dentro da
 * transacao do consumidor.
 */
@Component
public class GatewayFakeDePagamento implements GatewayDePagamento {

    @Override
    public ResultadoDoPagamento processar(long valorEmCentavos) {
        return switch ((int) Math.abs(valorEmCentavos % 10)) {
            case 3 -> ResultadoDoPagamento.recusa("Saldo insuficiente");
            case 8 -> ResultadoDoPagamento.recusa("Cartão bloqueado");
            default -> ResultadoDoPagamento.aprovacao();
        };
    }
}
