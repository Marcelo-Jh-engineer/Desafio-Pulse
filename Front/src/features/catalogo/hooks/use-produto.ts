import { useQuery } from '@tanstack/react-query';
import { buscarProdutoPorSlug } from '@/features/catalogo/servicos/catalogo-servico';
import { chavesQuery } from '@/lib/chaves-query';

export function useProduto(slug: string) {
  return useQuery({
    queryKey: chavesQuery.produtos.porSlug(slug),
    queryFn: () => buscarProdutoPorSlug(slug),
    staleTime: 60_000,
    enabled: slug.length > 0,
  });
}
