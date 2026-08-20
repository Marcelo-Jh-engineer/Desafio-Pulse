/**
 * Envelopes de API — docs/models.md secao 12.
 * Espelham o que o backend Spring devolve, com os mesmos nomes de campo.
 */

/** Espelha o `Page` do Spring Data. */
export interface Pagina<T> {
  conteudo: T[];
  /** Indice base 0. */
  pagina: number;
  tamanho: number;
  totalElementos: number;
  totalPaginas: number;
  primeira: boolean;
  ultima: boolean;
}

export interface ErroApi {
  status: number;
  /** Sempre exibivel ao usuario: sem stack trace, sem detalhe interno. */
  mensagem: string;
  /** Chave exata do campo do formulario, para alimentar `setError` do RHF. */
  errosPorCampo?: Record<string, string>;
  timestamp: string;
}
