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
  estoque: {
    movimentacoes: (produtoId: string) => ['estoque', 'movimentacoes', produtoId] as const,
  },
} as const;
