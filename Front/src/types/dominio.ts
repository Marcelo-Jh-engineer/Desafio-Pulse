/**
 * Enums e tipos base do dominio — docs/models.md secao 2.
 * Nomes em portugues, espelhados pelo backend Spring. Sem camada de traducao.
 */

/** Papel do usuario no RBAC. Vem da claim `papeis` do JWT. */
export type Papel = 'CLIENTE' | 'ADMIN';

/** Unidade de venda do produto. */
export type Unidade = 'UN' | 'KG' | 'G' | 'L' | 'ML' | 'PCT';

/** Status do pedido. */
export type StatusPedido = 'PENDENTE' | 'PAGO' | 'FALHOU' | 'CANCELADO';

/**
 * Desfecho do pagamento simulado.
 *
 * `PENDENTE` espera o consumidor da fila; `AGUARDANDO` fica reservado ao Pix
 * quando houver confirmacao externa do banco.
 */
export type StatusPagamento = 'PENDENTE' | 'APROVADO' | 'RECUSADO' | 'AGUARDANDO';

/** Forma de pagamento escolhida no checkout — RF-CHK-10. */
export type MetodoPagamento = 'CARTAO' | 'PIX';

export const ROTULO_METODO_PAGAMENTO: Record<MetodoPagamento, string> = {
  CARTAO: 'Cartão de crédito',
  PIX: 'Pix',
};

/** Rotulos ficam na apresentacao, nunca no modelo. */
export const ROTULO_UNIDADE: Record<Unidade, string> = {
  UN: 'unidade',
  KG: 'quilo',
  G: 'grama',
  L: 'litro',
  ML: 'mililitro',
  PCT: 'pacote',
};

export const ROTULO_PAPEL: Record<Papel, string> = {
  CLIENTE: 'Cliente',
  ADMIN: 'Administrador',
};
