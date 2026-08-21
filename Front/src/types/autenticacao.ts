import type { Papel } from '@/types/dominio';
import type { Usuario } from '@/types/usuario';

/** Derivados de UI — docs/models.md secao 6. Nenhum dos dois e persistido. */
export type TipoDocumento = 'CPF' | 'CNPJ';
export type TipoIdentificador = 'EMAIL' | 'CPF' | 'CNPJ';

export interface RequisicaoLogin {
  /** O `login` do usuario ou o e-mail dele. Ja normalizado. */
  identificador: string;
  senha: string;
}

/**
 * Cadastro — cinco campos, nada alem disso.
 *
 * `login` e `email` sao campos separados de proposito: o login pode ser um
 * documento, e mesmo quando e um e-mail nao precisa ser o mesmo de contato.
 */
export interface RequisicaoCadastro {
  /** CPF, CNPJ (so digitos) ou e-mail. */
  login: string;
  email: string;
  nome: string;
  senha: string;
}

export interface RespostaAutenticacao {
  /**
   * Token simulado da fase mockada — ver `lib/token-simulado.ts`. Na F6 vira um
   * JWT de verdade, emitido e conferido pelo backend.
   */
  token: string;
  usuario: Usuario;
}

/** Estado de cliente. Vive no Zustand e **nao** e persistido. */
export interface Sessao {
  token: string | null;
  usuario: Usuario | null;
  papeis: Papel[];
  autenticado: boolean;
}
