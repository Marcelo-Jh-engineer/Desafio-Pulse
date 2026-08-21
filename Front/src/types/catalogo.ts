import type { Unidade } from '@/types/dominio';

/**
 * Categoria e Produto — docs/models.md secoes 3 e 4.
 * Os nomes de campo sao exatamente os que o backend Spring devolve.
 */

export interface Categoria {
  id: string;
  /** Texto de exibicao, com acento: "Hortifruti". */
  nome: string;
  /** Sem acento, usado na URL do filtro: "hortifruti". Gerado pelo backend. */
  slug: string;
  descricao?: string;
  urlIcone?: string;
  /** Ordenacao crescente no filtro do catalogo. */
  ordem: number;
  ativa: boolean;
}

/** Leitura: a categoria vem aninhada. */
export interface Produto {
  id: string;
  sku: string;
  slug: string;
  nome: string;
  descricao: string;
  /** Inteiro em centavos. Nunca ponto flutuante. */
  precoEmCentavos: number;
  unidade: Unidade;
  urlImagem: string;
  categoria: Categoria;
  quantidadeEstoque: number;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

/** Escrita (F5): so o id da categoria, nao o objeto. */
export interface RequisicaoProduto {
  sku: string;
  nome: string;
  descricao: string;
  precoEmCentavos: number;
  unidade: Unidade;
  urlImagem: string;
  categoriaId: string;
  quantidadeEstoque: number;
  ativo: boolean;
}

export interface RequisicaoCategoria {
  nome: string;
  descricao?: string;
  urlIcone?: string;
  ordem: number;
  ativa: boolean;
}

/** Estoque vira rotulo na apresentacao, nunca no modelo. */
export type DisponibilidadeProduto = 'DISPONIVEL' | 'ULTIMAS_UNIDADES' | 'INDISPONIVEL';

/** Abaixo disso o cartao avisa que esta acabando — docs/design.md secao 8.2. */
export const LIMITE_ULTIMAS_UNIDADES = 10;

export function obterDisponibilidade(produto: Produto): DisponibilidadeProduto {
  if (produto.quantidadeEstoque <= 0) return 'INDISPONIVEL';
  if (produto.quantidadeEstoque <= LIMITE_ULTIMAS_UNIDADES) return 'ULTIMAS_UNIDADES';
  return 'DISPONIVEL';
}
