import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  buscarPedido,
  criarPedido,
  listarPagamentos,
  listarPedidos,
  pagar,
} from '@/features/checkout/servicos/checkout-servico';
import { chavesQuery } from '@/lib/chaves-query';

export function useCriarPedido() {
  const clienteQuery = useQueryClient();

  return useMutation({
    mutationFn: criarPedido,
    onSuccess: () => clienteQuery.invalidateQueries({ queryKey: chavesQuery.pedidos.raiz() }),
  });
}

export function usePedido(id: string, acompanhar = false) {
  return useQuery({
    queryKey: chavesQuery.pedidos.porId(id),
    queryFn: () => buscarPedido(id),
    enabled: id.length > 0,
    staleTime: 0,
    refetchInterval: (consulta) =>
      acompanhar && consulta.state.data?.status === 'PENDENTE' ? 1_000 : false,
  });
}

export function usePedidos(pagina: number, tamanho: number) {
  return useQuery({
    queryKey: chavesQuery.pedidos.lista(pagina, tamanho),
    queryFn: () => listarPedidos(pagina, tamanho),
    placeholderData: keepPreviousData,
    // O pagamento e processado de forma assincrona: ao voltar para esta tela,
    // a lista precisa consultar o status atual em vez de reaproveitar o anterior.
    staleTime: 0,
  });
}

export function usePagamentos(pedidoId: string, acompanhar = false, habilitado = true) {
  return useQuery({
    queryKey: chavesQuery.pagamentos.doPedido(pedidoId),
    queryFn: () => listarPagamentos(pedidoId),
    enabled: habilitado && pedidoId.length > 0,
    staleTime: 0,
    refetchInterval: (consulta) => {
      const status = consulta.state.data?.[0]?.status;
      return acompanhar && (status === 'PENDENTE' || status === 'AGUARDANDO') ? 1_000 : false;
    },
  });
}

/**
 * Solicitar pagamento e mutation; acompanhar as tentativas e query.
 */
export function usePagar() {
  return useMutation({ mutationFn: pagar });
}
