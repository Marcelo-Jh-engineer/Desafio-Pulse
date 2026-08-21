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

/** Direcao da movimentacao de estoque. */
export type TipoMovimentacao = 'ENTRADA' | 'SAIDA';

/** Desfecho do pagamento simulado. */
export type StatusPagamento = 'APROVADO' | 'RECUSADO';

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
