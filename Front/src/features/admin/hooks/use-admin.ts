import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  atualizarCategoria,
  cadastrarCategoria,
  buscarProdutoAdmin,
  cadastrarProduto,
  listarCategoriasAdmin,
  listarCategoriasDisponiveis,
  alterarPreco,
  listarProdutosAdmin,
  type ParametrosAdminProdutos,
} from '@/features/admin/servicos/admin-servico';
import { chavesQuery } from '@/lib/chaves-query';

export function useProdutosAdmin(parametros: ParametrosAdminProdutos) {
  return useQuery({
    queryKey: chavesQuery.admin.produtos(parametros),
    queryFn: () => listarProdutosAdmin(parametros),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });
}

export function useProdutoAdmin(id: string) {
  return useQuery({
    queryKey: chavesQuery.admin.produto(id),
    queryFn: () => buscarProdutoAdmin(id),
    enabled: id.length > 0,
    staleTime: 0,
  });
}

export function useCategoriasAdmin() {
  return useQuery({
    queryKey: chavesQuery.admin.categorias(),
    queryFn: listarCategoriasAdmin,
    staleTime: 60_000,
  });
}

export function useCategoriasDisponiveis() {
  return useQuery({
    queryKey: chavesQuery.categorias.todas(),
    queryFn: listarCategoriasDisponiveis,
    staleTime: 10 * 60_000,
  });
}

/**
 * Toda mutacao administrativa invalida as listas que ela afeta.
 *
 * Mexer no estoque muda o produto **e** o catalogo publico, entao a invalidacao
 * alcanca `produtos.raiz` — senao o cliente continuaria vendo o estoque velho
 * ate o cache expirar sozinho.
 */
function useInvalidarCatalogo() {
  const clienteQuery = useQueryClient();
  return () => {
    void clienteQuery.invalidateQueries({ queryKey: ['admin'] });
    void clienteQuery.invalidateQueries({ queryKey: chavesQuery.produtos.raiz() });
    void clienteQuery.invalidateQueries({ queryKey: chavesQuery.categorias.todas() });
  };
}

export function useCadastrarProduto() {
  const invalidar = useInvalidarCatalogo();
  return useMutation({ mutationFn: cadastrarProduto, onSuccess: invalidar });
}

export function useAlterarPreco() {
  const invalidar = useInvalidarCatalogo();
  return useMutation({
    mutationFn: ({ id, precoEmCentavos }: { id: string; precoEmCentavos: number }) =>
      alterarPreco(id, precoEmCentavos),
    onSuccess: invalidar,
  });
}

export function useCadastrarCategoria() {
  const invalidar = useInvalidarCatalogo();
  return useMutation({ mutationFn: cadastrarCategoria, onSuccess: invalidar });
}

export function useAtualizarCategoria() {
  const invalidar = useInvalidarCatalogo();
  return useMutation({
    mutationFn: ({
      id,
      dados,
    }: {
      id: string;
      dados: Parameters<typeof atualizarCategoria>[1];
    }) => atualizarCategoria(id, dados),
    onSuccess: invalidar,
  });
}
