import type { StatusPagamento, StatusPedido, Unidade } from '@/types/dominio';

/** Endereço de entrega — docs/models.md secao 8. */
export interface Endereco {
  /** So digitos, 8 caracteres. */
  cep: string;
  logradouro: string;
  /** String de proposito: aceita "s/n". */
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  /** Duas letras maiusculas. */
  uf: string;
}

/** Linha do pedido — congelada no momento da compra. */
export interface ItemPedido {
  produtoId: string;
  nome: string;
  precoEmCentavos: number;
  unidade: Unidade;
  quantidade: number;
  totalLinhaEmCentavos: number;
}

export type MetodoPagamento = 'CARTAO' | 'PIX';

/** O que o comprovante mostra sobre a forma de pagamento. */
export interface ResumoPagamento {
  metodo: MetodoPagamento;
  /** Só em cartão: bandeira fictícia e os quatro últimos dígitos. */
  finalDoCartao?: string;
  parcelas?: number;
  /** Valor de cada parcela, derivado do total. */
  valorParcelaEmCentavos?: number;
  pagoEm: string;
}

/**
 * Pedido — docs/models.md secao 9.
 *
 * **Congela** nome, preco e dados do comprador: editar o produto ou o perfil
 * depois nao altera pedidos passados.
 */
export interface Pedido {
  id: string;
  /** Legivel pelo cliente: "PED-2026-000123". */
  numero: string;
  status: StatusPedido;
  itens: ItemPedido[];
  subtotalEmCentavos: number;
  freteEmCentavos: number;
  totalEmCentavos: number;
  endereco: Endereco;
  nomeComprador: string;
  emailComprador: string;
  /** Snapshot do login do comprador. Exibido mascarado quando é documento. */
  loginComprador: string;
  criadoEm: string;
  pagoEm?: string;
  /** Preenchido quando o pagamento é aprovado — alimenta o comprovante. */
  pagamento?: ResumoPagamento;
  /** Presente quando o pagamento foi recusado. */
  motivoRecusa?: string;
}

export interface RequisicaoPedido {
  itens: { produtoId: string; quantidade: number }[];
  endereco: Endereco;
}

/**
 * Pagamento com cartão — docs/models.md secao 10.
 *
 * **Nunca persistido no front**: vive so no estado do formulario e e descartado
 * no envio. Nao entra em store, storage, cache nem log.
 */
export interface PagamentoComCartao {
  metodo: 'CARTAO';
  pedidoId: string;
  numeroCartao: string;
  nomeTitular: string;
  /** "MM/AA" */
  validade: string;
  cvv: string;
  parcelas: number;
}

/** Pagamento por Pix: nao ha dado sensivel, so a intencao de gerar a cobranca. */
export interface PagamentoComPix {
  metodo: 'PIX';
  pedidoId: string;
}

export type RequisicaoPagamento = PagamentoComCartao | PagamentoComPix;

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

export interface ResultadoPagamento {
  pedidoId: string;
  status: StatusPagamento;
  /** Presente somente quando o status e RECUSADO. */
  motivoRecusa?: string;
  /** Presente somente quando o status e AGUARDANDO e o metodo e Pix. */
  cobrancaPix?: CobrancaPix;
  processadoEm: string;
}

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
