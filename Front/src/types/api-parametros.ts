/**
 * Parametros de consulta do catalogo — docs/models.md secao 13.
 *
 * Dois filtros, e so dois: categoria e nome. Nao ha escolha de ordenacao — o
 * catalogo vem sempre na mesma ordem, decidida pelo servidor.
 */
export interface ParametrosCatalogo {
  /** Slug da categoria. */
  categoria?: string;
  busca?: string;
  /** Indice base 0. */
  pagina?: number;
  /** Padrao 10. */
  tamanho?: number;
}
