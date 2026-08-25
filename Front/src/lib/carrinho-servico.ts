import { clienteHttp } from '@/lib/http';
import { ErroDeAplicacao } from '@/lib/erros';
import type { Carrinho } from '@/types/carrinho';

/**
 * Único ponto que conhece os caminhos do carrinho na API.
 *
 * Vive em `lib/` e não dentro de `features/carrinho/` porque o cabeçalho e o
 * catálogo também dependem dele, e feature não importa de feature (RNF-MAN-06).
 */

/**
 * Carrinho vazio.
 *
 * Não existe carrinho vazio no servidor — ele nasce quando o primeiro item
 * entra, e antes disso `GET /api/carrinho` responde 404. Para a tela, porém,
 * "ainda não tem carrinho" e "carrinho sem itens" são a mesma coisa: uma lista
 * vazia. Traduzir aqui evita que cada componente precise saber disso.
 */
export const CARRINHO_VAZIO: Carrinho = {
  id: '',
  status: 'ABERTO',
  itens: [],
  totalEmCentavos: 0,
  quantidadeItens: 0,
};

/** O carrinho aberto de quem está logado. 404 vira carrinho vazio. */
export async function buscarCarrinho(): Promise<Carrinho> {
  try {
    return await clienteHttp.obter<Carrinho>('/carrinho');
  } catch (erro) {
    if (erro instanceof ErroDeAplicacao && erro.status === 404) {
      return CARRINHO_VAZIO;
    }
    throw erro;
  }
}

/**
 * Põe um produto no carrinho, criando-o se ainda não existir.
 *
 * Sempre `POST /carrinho`, nunca `/carrinho/itens`: a rota de criação já
 * reaproveita o carrinho aberto quando ele existe. Escolher entre as duas
 * exigiria que o front soubesse de antemão se há carrinho — informação que ele
 * só tem se acabou de lê-lo, e que estaria velha no instante seguinte.
 *
 * A quantidade **soma** na linha existente. Quem confere estoque é o servidor:
 * sem saldo, a resposta é 409 com a quantidade disponível.
 */
export function adicionarAoCarrinho(produtoId: string, quantidade: number): Promise<Carrinho> {
  return clienteHttp.criar<Carrinho>('/carrinho', { produtoId, quantidade });
}

/**
 * Tira uma quantidade da linha. Chegar a zero remove a linha inteira.
 *
 * Pedir mais do que há na linha significa "tira tudo", e não erro.
 */
export function removerDoCarrinho(produtoId: string, quantidade: number): Promise<Carrinho> {
  return clienteHttp.remover<Carrinho>(
    `/carrinho/itens/${encodeURIComponent(produtoId)}?quantidade=${quantidade}`,
  );
}
