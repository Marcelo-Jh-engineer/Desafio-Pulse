import type { ParametrosCatalogo } from '@/types/api-parametros';

/**
 * Fonte unica das chaves do TanStack Query. Nenhuma chave literal espalhada
 * pelo codigo — invalidar cache passa por aqui.
 *
 * Regra de LGPD: documento, email ou qualquer dado pessoal **nunca** entra numa
 * chave de cache. Ver docs/prd.md secao 5.4.
 */
export const chavesQuery = {
  categorias: {
    todas: () => ['categorias'] as const,
  },
  produtos: {
    raiz: () => ['produtos'] as const,
    lista: (parametros: ParametrosCatalogo) => ['produtos', 'lista', parametros] as const,
    porSlug: (slug: string) => ['produtos', 'slug', slug] as const,
  },
  pedidos: {
    raiz: () => ['pedidos'] as const,
    porId: (id: string) => ['pedidos', id] as const,
  },
  /**
   * A validacao depende do conteudo do carrinho, entao a chave carrega os ids e
   * as quantidades — nunca preco de cartao nem dado pessoal.
   */
  checkout: {
    validacao: (assinatura: string) => ['checkout', 'validacao', assinatura] as const,
  },
  admin: {
    produtos: (parametros: object) => ['admin', 'produtos', parametros] as const,
    produto: (id: string) => ['admin', 'produto', id] as const,
    categorias: () => ['admin', 'categorias'] as const,
  },
  estoque: {
    movimentacoes: (produtoId: string) => ['estoque', 'movimentacoes', produtoId] as const,
  },
} as const;
