package com.api.ecommerce.business.gateway;


public interface GatewayDePagamento {

    ResultadoDoPagamento processar(long valorEmCentavos);
}
