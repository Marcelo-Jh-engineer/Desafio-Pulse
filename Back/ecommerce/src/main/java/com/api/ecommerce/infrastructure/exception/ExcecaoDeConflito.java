package com.api.ecommerce.infrastructure.exception;

import java.util.Map;

/**
 * O pedido e valido, mas bate com algo que ja existe — login ou e-mail em uso.
 * Vira 409 com `errosPorCampo`, para o formulario destacar o campo certo em vez
 * de mostrar um aviso solto no topo.
 */
public class ExcecaoDeConflito extends RuntimeException {

    private final transient Map<String, String> errosPorCampo;

    public ExcecaoDeConflito(String mensagem, Map<String, String> errosPorCampo) {
        super(mensagem);
        this.errosPorCampo = errosPorCampo;
    }

    public Map<String, String> getErrosPorCampo() {
        return errosPorCampo;
    }
}
