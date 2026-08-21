import { clienteHttp } from '@/lib/http';
import type {
  Pedido,
  RequisicaoPagamento,
  RequisicaoPedido,
  ResultadoPagamento,
  ValidacaoCarrinho,
} from '@/types/pedido';
import type { ItemCarrinho } from '@/types/carrinho';

/**
 * Unico ponto que conhece os caminhos de pedido e pagamento.
 *
 * Regra de seguranca (RNF-SEC-02): dado de cartao viaja **so no corpo** do
 * POST de pagamento. Nunca em query string, nunca em chave de cache, nunca em
 * log — por isso o pagamento e mutation, jamais query.
 */

export function validarCarrinho(itens: ItemCarrinho[]): Promise<ValidacaoCarrinho> {
  return clienteHttp.criar<ValidacaoCarrinho>('/carrinho/validacao', {
    itens: itens.map((item) => ({
      produtoId: item.produtoId,
      quantidade: item.quantidade,
      precoEmCentavos: item.precoEmCentavos,
    })),
  });
}

export function criarPedido(dados: RequisicaoPedido): Promise<Pedido> {
  return clienteHttp.criar<Pedido>('/pedidos', dados);
}

export function buscarPedido(id: string): Promise<Pedido> {
  return clienteHttp.obter<Pedido>(`/pedidos/${encodeURIComponent(id)}`);
}

export function pagar(dados: RequisicaoPagamento): Promise<ResultadoPagamento> {
  return clienteHttp.criar<ResultadoPagamento>('/pagamentos', dados);
}

/**
 * Confirmação do Pix. No mundo real quem avisa é o banco, por webhook; aqui o
 * gatilho é explícito para o fluxo ser demonstrável sem serviço externo.
 */
export function confirmarPix(dados: { pedidoId: string }): Promise<ResultadoPagamento> {
  return clienteHttp.criar<ResultadoPagamento>('/pagamentos/pix/confirmacao', dados);
}
