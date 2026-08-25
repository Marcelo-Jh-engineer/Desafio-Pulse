import { clienteHttp } from '@/lib/http';
import type { Categoria, Produto } from '@/types/catalogo';
import type { Pagina } from '@/types/api';
import type { ParametrosCatalogo } from '@/types/api-parametros';

/**
 * Unico ponto que conhece os caminhos da API do catalogo. Componente e hook
 * nunca montam URL — assim a F6 troca a fonte sem tocar em tela.
 */

/**
 * Paginacao e filtro de categoria, comuns as duas rotas. O que esta vazio fica
 * de fora, para a URL nao encher de `&categoria=`.
 */
function montarConsulta(parametros: ParametrosCatalogo): Record<string, string> {
  const consulta: Record<string, string> = {};
  if (parametros.categoria) consulta.categoria = parametros.categoria;
  if (parametros.pagina !== undefined) consulta.pagina = String(parametros.pagina);
  if (parametros.tamanho !== undefined) consulta.tamanho = String(parametros.tamanho);
  return consulta;
}

/** RF-CAT-05: lista curta e estavel, devolvida como array puro. */
export function buscarCategorias(): Promise<Categoria[]> {
  return clienteHttp.obter<Categoria[]>('/categorias');
}

/**
 * O catalogo — RF-CAT-01 a RF-CAT-04 e RF-CAT-09.
 *
 * Duas rotas, uma funcao. A API separa listar de procurar: `/produtos` lista e
 * nao conhece `busca`; `/catalogo/busca` procura por `nome` e aceita o mesmo
 * filtro de categoria. Mandar `busca` para a listagem nao da erro — o servidor
 * descarta parametro que nao conhece — e devolve o catalogo inteiro como se
 * ninguem tivesse procurado nada. Escolher a rota aqui e o que impede isso.
 *
 * A tela nao sabe da diferenca: continua chamando `buscarProdutos` com os
 * mesmos parametros.
 */
export function buscarProdutos(parametros: ParametrosCatalogo): Promise<Pagina<Produto>> {
  const termo = parametros.busca?.trim();

  if (termo) {
    return clienteHttp.obter<Pagina<Produto>>('/catalogo/busca', {
      params: { ...montarConsulta(parametros), nome: termo },
    });
  }

  return clienteHttp.obter<Pagina<Produto>>('/produtos', {
    params: montarConsulta(parametros),
  });
}

/** RF-CAT-07. */
export function buscarProdutoPorId(id: string): Promise<Produto> {
  return clienteHttp.obter<Produto>(`/produtos/${encodeURIComponent(id)}`);
}
