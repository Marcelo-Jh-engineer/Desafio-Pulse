package com.api.ecommerce.infrastructure.enums;

/**
 * Desfecho do pagamento — docs/models.md secao 10.
 *
 * AGUARDANDO existe por causa do Pix: a cobranca nasce na hora, mas quem paga
 * e o aplicativo do banco, depois. Sem um terceiro estado o Pix teria que
 * mentir que foi aprovado ou que foi recusado.
 */
public enum StatusPagamento {
    APROVADO,
    RECUSADO,
    AGUARDANDO
}
