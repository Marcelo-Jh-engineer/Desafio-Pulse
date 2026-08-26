import { clienteHttp } from '@/lib/http';
import type { Pagina } from '@/types/api';
import type { Pagamento, Pedido, RequisicaoPagamento } from '@/types/pedido';

/**
 * Unico ponto que conhece os caminhos de pedido e pagamento.
 *
 * O backend recebe somente o metodo escolhido. Dados de cartao nao fazem parte
 * do contrato, nao entram em cache e nao sao enviados pela aplicacao.
 */

export function criarPedido(chaveIdempotencia: string): Promise<Pedido> {
  return clienteHttp.criar<Pedido>('/pedidos', undefined, {
    headers: { 'Idempotency-Key': chaveIdempotencia },
  });
}

export function buscarPedido(id: string): Promise<Pedido> {
  return clienteHttp.obter<Pedido>(`/pedidos/${encodeURIComponent(id)}`);
}

export function listarPedidos(pagina: number, tamanho: number): Promise<Pagina<Pedido>> {
  return clienteHttp.obter<Pagina<Pedido>>('/pedidos', {
    params: { pagina: String(pagina), tamanho: String(tamanho) },
  });
}

export function pagar({ pedidoId, metodo }: RequisicaoPagamento): Promise<Pagamento> {
  return clienteHttp.criar<Pagamento>(`/pedidos/${encodeURIComponent(pedidoId)}/pagamentos`, {
    metodo,
  });
}

export function listarPagamentos(pedidoId: string): Promise<Pagamento[]> {
  return clienteHttp.obter<Pagamento[]>(`/pedidos/${encodeURIComponent(pedidoId)}/pagamentos`);
}
