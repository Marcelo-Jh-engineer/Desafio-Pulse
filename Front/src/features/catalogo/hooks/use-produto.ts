import { useQuery } from '@tanstack/react-query';
import { buscarProdutoPorId } from '@/features/catalogo/servicos/catalogo-servico';
import { chavesQuery } from '@/lib/chaves-query';

export function useProduto(id: string) {
  return useQuery({
    queryKey: chavesQuery.produtos.porId(id),
    queryFn: () => buscarProdutoPorId(id),
    staleTime: 60_000,
    enabled: id.length > 0,
  });
}
