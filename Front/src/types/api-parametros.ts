/** Parametros de consulta do catalogo — docs/models.md secao 13. */
export interface ParametrosCatalogo {
  /** Slug da categoria. */
  categoria?: string;
  busca?: string;
  /** Indice base 0. */
  pagina?: number;
  /** Padrao 12. */
  tamanho?: number;
  ordenacao?: OrdenacaoCatalogo;
}

export type OrdenacaoCatalogo = 'RELEVANCIA' | 'PRECO_ASC' | 'PRECO_DESC' | 'NOME_ASC';
