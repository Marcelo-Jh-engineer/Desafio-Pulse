import type { Unidade } from '@/types/dominio';

/**
 * Carrinho — docs/models.md secao 7.
 *
 * **O carrinho e do servidor.** Estes tipos espelham o que a API devolve em
 * `/api/carrinho`; nada aqui e montado no cliente.
 *
 * Nome, preco e unidade sao **retrato** do momento em que o item entrou: se o
 * produto for editado depois, o carrinho nao muda de valor sozinho. O servidor
 * marca `precoDivergiu` quando o catalogo andou.
 */
export interface ItemCarrinho {
  produtoId: string;
  nome: string;
  /** Resolvido pelo backend: aponta para a rota que serve a foto. */
  urlImagem: string;
  unidade: Unidade;
  quantidade: number;
  /** Congelado quando o item entrou, nao o preco do catalogo agora. */
  precoEmCentavos: number;
  /** Derivado: `precoEmCentavos * quantidade`. Nunca digitado. */
  totalLinhaEmCentavos: number;
  /** Estoque do produto AGORA. Nao e reserva — quem decide e o pagamento. */
  estoqueDisponivel: number;
  /** O preco do catalogo andou desde que o item entrou. */
  precoDivergiu: boolean;
}

export interface Carrinho {
  /** Id publico do carrinho no servidor. */
  id: string;
  status: StatusCarrinho;
  itens: ItemCarrinho[];
  /** Somado pelo servidor a partir das linhas. Nao ha frete. */
  totalEmCentavos: number;
  /** Soma das quantidades, nao o numero de linhas. */
  quantidadeItens: number;
}

export type StatusCarrinho = 'ABERTO' | 'CONVERTIDO' | 'ABANDONADO';
