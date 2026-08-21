import type { Papel } from '@/types/dominio';

/**
 * Usuario — docs/models.md secao 5.
 *
 * Nunca carrega senha nem hash, em nenhuma resposta.
 */
export interface Usuario {
  id: string;
  /** Nome completo. */
  nome: string;
  email: string;
  /**
   * Credencial de acesso escolhida no cadastro: **CPF, CNPJ ou e-mail**.
   *
   * Quando e documento, guarda **so digitos** — a pontuacao nunca entra no
   * modelo nem na rede (LGPD, RNF-SEC-03). O tipo e inferido pelo formato com
   * `detectarTipoIdentificador()` e nunca persistido.
   */
  login: string;
  /**
   * Array porque o backend pode conceder mais de um papel. O front sempre
   * trata como conjunto — nunca assume `papeis[0]`.
   */
  papeis: Papel[];
  criadoEm: string;
}
