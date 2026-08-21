import { clienteHttp } from '@/lib/http';
import type { Categoria, Produto } from '@/types/catalogo';
import type { Pagina } from '@/types/api';
import type { ParametrosCatalogo } from '@/types/api-parametros';

/**
 * Unico ponto que conhece os caminhos da API do catalogo. Componente e hook
 * nunca montam URL — assim a F6 troca a fonte sem tocar em tela.
 */

/**
 * Converte os parametros do catalogo em query string, omitindo o que esta
 * vazio para a URL nao encher de `&busca=`.
 */
function montarConsulta(parametros: ParametrosCatalogo): Record<string, string> {
  const consulta: Record<string, string> = {};
  if (parametros.categoria) consulta.categoria = parametros.categoria;
  if (parametros.busca?.trim()) consulta.busca = parametros.busca.trim();
  if (parametros.ordenacao) consulta.ordenacao = parametros.ordenacao;
  if (parametros.pagina !== undefined) consulta.pagina = String(parametros.pagina);
  if (parametros.tamanho !== undefined) consulta.tamanho = String(parametros.tamanho);
  return consulta;
}

/** RF-CAT-05: lista curta e estavel, devolvida como array puro. */
export function buscarCategorias(): Promise<Categoria[]> {
  return clienteHttp.obter<Categoria[]>('/categorias');
}

/** RF-CAT-01 a RF-CAT-04, RF-CAT-09, RF-CAT-10. */
export function buscarProdutos(parametros: ParametrosCatalogo): Promise<Pagina<Produto>> {
  return clienteHttp.obter<Pagina<Produto>>('/produtos', {
    params: montarConsulta(parametros),
  });
}

/** RF-CAT-07. */
export function buscarProdutoPorSlug(slug: string): Promise<Produto> {
  return clienteHttp.obter<Produto>(`/produtos/${encodeURIComponent(slug)}`);
}
