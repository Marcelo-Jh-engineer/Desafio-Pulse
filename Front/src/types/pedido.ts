import type { MetodoPagamento, StatusPagamento, StatusPedido, Unidade } from '@/types/dominio';

/** Linha do pedido — congelada no momento da compra. */
export interface ItemPedido {
  produtoId: string;
  nome: string;
  precoEmCentavos: number;
  unidade: Unidade;
  quantidade: number;
  totalLinhaEmCentavos: number;
}

/**
 * Pedido — docs/models.md secao 9.
 *
 * **Congela** nome e preco dos itens: editar o produto depois nao altera
 * pedidos passados.
 */
export interface Pedido {
  id: string;
  status: StatusPedido;
  itens: ItemPedido[];
  totalEmCentavos: number;
  criadoEm: string;
  pagoEm: string | null;
  /** Presente quando o pagamento foi recusado. */
  motivoRecusa: string | null;
}

export interface RequisicaoPagamento {
  pedidoId: string;
  metodo: MetodoPagamento;
}

/** Tentativa de pagamento devolvida pela API. */
export interface Pagamento {
  id: string;
  metodo: MetodoPagamento;
  status: StatusPagamento;
  valorEmCentavos: number;
  motivoRecusa: string | null;
  criadoEm: string;
  processadoEm: string | null;
}

/** Cobrança Pix gerada pelo servidor, com prazo para pagar. */
export interface CobrancaPix {
  pedidoId: string;
  /** O "copia e cola" que o app do banco aceita. */
  codigoCopiaECola: string;
  /** ISO 8601. Passou disso, a cobrança não vale mais. */
  expiraEm: string;
  /** Segundos de validade, para o contador da tela não depender do relógio local. */
  validadeEmSegundos: number;
}

export type ResultadoPagamento = Pagamento;

/** Divergencia encontrada ao revalidar o carrinho no checkout — RF-CHK-08. */
export interface DivergenciaCarrinho {
  produtoId: string;
  nome: string;
  tipo: 'PRECO_ALTERADO' | 'ESTOQUE_INSUFICIENTE' | 'INDISPONIVEL';
  precoAnteriorEmCentavos?: number;
  precoAtualEmCentavos?: number;
  quantidadeSolicitada?: number;
  quantidadeDisponivel?: number;
}

export interface ValidacaoCarrinho {
  divergencias: DivergenciaCarrinho[];
}
