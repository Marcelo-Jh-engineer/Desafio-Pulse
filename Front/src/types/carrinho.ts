import type { Unidade } from '@/types/dominio';

/**
 * Carrinho — docs/models.md secao 7.
 *
 * Os campos de produto sao **snapshot** do momento em que o item entrou: se o
 * produto for editado depois, o carrinho nao quebra. O preco e revalidado no
 * checkout (F4), e divergencia vira aviso antes do pagamento.
 */
export interface ItemCarrinho {
  produtoId: string;
  nome: string;
  precoEmCentavos: number;
  urlImagem: string;
  unidade: Unidade;
  quantidade: number;
  /** Derivado: `precoEmCentavos * quantidade`. Nunca digitado. */
  totalLinhaEmCentavos: number;
  /**
   * Estoque no momento em que o item entrou. Enquanto o carrinho e do lado do
   * cliente, e o unico jeito de o teto de quantidade continuar valendo dentro
   * da tela do carrinho. Na F6 quem passa a impor o teto e o backend.
   */
  estoqueDisponivel: number;
}

export interface Carrinho {
  itens: ItemCarrinho[];
  /** Derivado: soma das linhas. Nao ha frete. */
  totalEmCentavos: number;
  /** Soma das quantidades, nao o numero de linhas. */
  quantidadeItens: number;
}
