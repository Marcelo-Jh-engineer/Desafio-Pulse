import { useMutation, useQuery } from '@tanstack/react-query';
import {
  buscarPedido,
  confirmarPix,
  criarPedido,
  pagar,
  validarCarrinho,
} from '@/features/checkout/servicos/checkout-servico';
import { chavesQuery } from '@/lib/chaves-query';
import type { ItemCarrinho } from '@/types/carrinho';

/**
 * A assinatura resume o carrinho para virar chave de cache: ids, quantidades e
 * precos. Nenhum dado pessoal e nenhum dado de cartao entra aqui — RNF-SEC-03.
 */
function assinarCarrinho(itens: ItemCarrinho[]): string {
  return itens
    .map((item) => `${item.produtoId}:${item.quantidade}:${item.precoEmCentavos}`)
    .sort()
    .join('|');
}

/** RF-CHK-08: revalida preco e estoque ao entrar no checkout. */
export function useValidacaoDoCarrinho(itens: ItemCarrinho[]) {
  return useQuery({
    queryKey: chavesQuery.checkout.validacao(assinarCarrinho(itens)),
    queryFn: () => validarCarrinho(itens),
    enabled: itens.length > 0,
    // Sempre buscar de novo ao entrar: o valor de revalidar e ser recente.
    staleTime: 0,
    gcTime: 0,
  });
}

export function useCriarPedido() {
  return useMutation({ mutationFn: criarPedido });
}

export function usePedido(id: string) {
  return useQuery({
    queryKey: chavesQuery.pedidos.porId(id),
    queryFn: () => buscarPedido(id),
    enabled: id.length > 0,
    staleTime: 0,
  });
}

/**
 * Pagamento e **mutation**, nunca query: query guarda o resultado em cache
 * indexado pelos argumentos, e os argumentos aqui sao dados de cartao.
 */
export function usePagar() {
  return useMutation({ mutationFn: pagar });
}

export function useConfirmarPix() {
  return useMutation({ mutationFn: confirmarPix });
}
