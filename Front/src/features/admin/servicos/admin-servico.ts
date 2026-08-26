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
  pagina?: number;
  tamanho?: number;
}

export function listarProdutosAdmin(
  parametros: ParametrosAdminProdutos,
): Promise<Pagina<Produto>> {
  const consulta: Record<string, string> = {};
  if (parametros.categoria) consulta.categoria = parametros.categoria;
  if (parametros.pagina !== undefined) consulta.pagina = String(parametros.pagina);
  if (parametros.tamanho !== undefined) consulta.tamanho = String(parametros.tamanho);

  const busca = parametros.busca?.trim();
  if (busca) {
    return clienteHttp.obter<Pagina<Produto>>('/catalogo/busca', {
      params: { ...consulta, nome: busca },
    });
  }

  return clienteHttp.obter<Pagina<Produto>>('/produtos', { params: consulta });
}

export function buscarProdutoAdmin(id: string): Promise<Produto> {
  return clienteHttp.obter<Produto>(`/produtos/${encodeURIComponent(id)}`);
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

/** Categorias ativas usadas nos filtros e no cadastro de produto. */
export function listarCategoriasDisponiveis(): Promise<Categoria[]> {
  return clienteHttp.obter<Categoria[]>('/categorias');
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
