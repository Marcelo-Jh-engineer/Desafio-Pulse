import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CARRINHO_VAZIO,
  adicionarAoCarrinho,
  buscarCarrinho,
  removerDoCarrinho,
} from '@/lib/carrinho-servico';
import { chavesQuery } from '@/lib/chaves-query';
import { useSessaoStore } from '@/lib/sessao-store';
import type { Carrinho } from '@/types/carrinho';

/**
 * O carrinho é **estado de servidor** — RF-CAR-01 a RF-CAR-09.
 *
 * Por isso vive no TanStack Query e não no Zustand: ele mora no banco, é do
 * usuário autenticado e sobrevive à troca de dispositivo. Copiá-lo para uma
 * store daria duas versões do mesmo carrinho, e a de memória envelheceria
 * silenciosamente (CLAUDE.md, seção Arquitetura).
 *
 * Vive em `hooks/` porque o cabeçalho, o catálogo e a tela do carrinho
 * dependem dele, e nenhuma feature pode importar de outra (RNF-MAN-06).
 */

/**
 * O carrinho de quem está logado. Visitante recebe carrinho vazio sem chamar a
 * API: a rota exige autenticação e responderia 401.
 */
export function useCarrinho() {
  const autenticado = useSessaoStore((estado) => estado.autenticado);
  const restaurando = useSessaoStore((estado) => estado.restaurando);

  const consulta = useQuery({
    queryKey: chavesQuery.carrinho.atual(),
    queryFn: buscarCarrinho,
    // Enquanto a sessão está sendo restaurada, ainda não se sabe se há login.
    // Buscar agora traria um 401 que não significa nada.
    enabled: autenticado && !restaurando,
  });

  const carrinho: Carrinho = consulta.data ?? CARRINHO_VAZIO;

  return { ...consulta, carrinho };
}

/**
 * Põe um produto no carrinho.
 *
 * A resposta da mutação já é o carrinho inteiro e atualizado, então ela é
 * gravada direto no cache — sem uma segunda ida à rede para reler o que o
 * servidor acabou de devolver.
 *
 * Não há atualização otimista de propósito: o servidor é quem confere estoque,
 * e antecipar um item que ele pode recusar mostraria no carrinho algo que não
 * entrou.
 */
export function useAdicionarAoCarrinho() {
  const clienteQuery = useQueryClient();

  return useMutation({
    mutationFn: ({ produtoId, quantidade }: { produtoId: string; quantidade: number }) =>
      adicionarAoCarrinho(produtoId, quantidade),
    onSuccess: (carrinho) => {
      clienteQuery.setQueryData(chavesQuery.carrinho.atual(), carrinho);
      // O estoque mudou na resposta; a listagem do catálogo em cache não sabe.
      void clienteQuery.invalidateQueries({ queryKey: chavesQuery.produtos.raiz() });
    },
  });
}

/** Tira quantidade de uma linha. Chegar a zero remove a linha. */
export function useRemoverDoCarrinho() {
  const clienteQuery = useQueryClient();

  return useMutation({
    mutationFn: ({ produtoId, quantidade }: { produtoId: string; quantidade: number }) =>
      removerDoCarrinho(produtoId, quantidade),
    onSuccess: (carrinho) => {
      clienteQuery.setQueryData(chavesQuery.carrinho.atual(), carrinho);
    },
  });
}
