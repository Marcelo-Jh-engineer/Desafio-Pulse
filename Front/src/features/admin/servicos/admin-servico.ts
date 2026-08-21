import { clienteHttp } from '@/lib/http';
import type { Pagina } from '@/types/api';
import type {
  Categoria,
  Produto,
  RequisicaoCategoria,
  RequisicaoProduto,
} from '@/types/catalogo';

/** Unico ponto que conhece os caminhos administrativos. */

/** Categoria com a contagem que so a listagem administrativa precisa. */
export interface CategoriaAdmin extends Categoria {
  quantidadeProdutos: number;
}

export interface ParametrosAdminProdutos {
  busca?: string;
  categoria?: string;
  situacao?: 'ATIVO' | 'INATIVO';
  ordenacao?: 'ESTOQUE_ASC';
  pagina?: number;
}

export function listarProdutosAdmin(
  parametros: ParametrosAdminProdutos,
): Promise<Pagina<Produto>> {
  const consulta: Record<string, string> = {};
  if (parametros.busca?.trim()) consulta.busca = parametros.busca.trim();
  if (parametros.categoria) consulta.categoria = parametros.categoria;
  if (parametros.situacao) consulta.situacao = parametros.situacao;
  if (parametros.ordenacao) consulta.ordenacao = parametros.ordenacao;
  if (parametros.pagina !== undefined) consulta.pagina = String(parametros.pagina);

  return clienteHttp.obter<Pagina<Produto>>('/admin/produtos', { params: consulta });
}

export function buscarProdutoAdmin(id: string): Promise<Produto> {
  return clienteHttp.obter<Produto>(`/admin/produtos/${encodeURIComponent(id)}`);
}

export function cadastrarProduto(dados: RequisicaoProduto): Promise<Produto> {
  return clienteHttp.criar<Produto>('/produtos', dados);
}

/** RF-ADM-03: só o preço muda por aqui. Estoque baixa pela venda, não à mão. */
export function alterarPreco(id: string, precoEmCentavos: number): Promise<Produto> {
  return clienteHttp.atualizar<Produto>(`/produtos/${encodeURIComponent(id)}`, {
    precoEmCentavos,
  });
}

export function listarCategoriasAdmin(): Promise<CategoriaAdmin[]> {
  return clienteHttp.obter<CategoriaAdmin[]>('/admin/categorias');
}

export function cadastrarCategoria(dados: RequisicaoCategoria): Promise<Categoria> {
  return clienteHttp.criar<Categoria>('/categorias', dados);
}

export function atualizarCategoria(
  id: string,
  dados: Partial<RequisicaoCategoria>,
): Promise<Categoria> {
  return clienteHttp.atualizar<Categoria>(`/categorias/${encodeURIComponent(id)}`, dados);
}
