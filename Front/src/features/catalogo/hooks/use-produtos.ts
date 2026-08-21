import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { buscarProdutos } from '@/features/catalogo/servicos/catalogo-servico';
import { chavesQuery } from '@/lib/chaves-query';
import type { ParametrosCatalogo } from '@/types/api-parametros';

/**
 * `keepPreviousData` mantem a grade anterior visivel enquanto a proxima pagina
 * carrega. Sem isso a lista pisca em branco a cada clique na paginacao, o que
 * conta como salto de layout — RNF-PERF-01.
 */
export function useProdutos(parametros: ParametrosCatalogo) {
  return useQuery({
    queryKey: chavesQuery.produtos.lista(parametros),
    queryFn: () => buscarProdutos(parametros),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
