import { useQuery } from '@tanstack/react-query';
import { buscarCategorias } from '@/features/catalogo/servicos/catalogo-servico';
import { chavesQuery } from '@/lib/chaves-query';

/**
 * Categoria muda muito pouco: cache longo evita repetir a chamada a cada
 * navegacao — RNF-PERF-04.
 */
export function useCategorias() {
  return useQuery({
    queryKey: chavesQuery.categorias.todas(),
    queryFn: buscarCategorias,
    staleTime: 10 * 60_000,
  });
}
