import type { Papel } from '@/types/dominio';

/**
 * Usuario — docs/models.md secao 5.
 *
 * Nunca carrega senha nem hash, em nenhuma resposta.
 */
export interface Usuario {
  id: string;
  /** Nome completo ou razao social. */
  nome: string;
  email: string;
  /**
   * So digitos: 11 = CPF, 14 = CNPJ.
   *
   * **Nao existe campo de tipo de pessoa** — o tipo e inferido pelo
   * comprimento com `detectarTipoDocumento()` e nunca persistido.
   * Formatar e papel exclusivo da view (LGPD, RNF-SEC-03 e RNF-SEC-04).
   */
  documento: string;
  /** So digitos, com DDD. */
  telefone?: string;
  /**
   * Array porque o backend pode conceder mais de um papel. O front sempre
   * trata como conjunto — nunca assume `papeis[0]`.
   */
  papeis: Papel[];
  criadoEm: string;
}
