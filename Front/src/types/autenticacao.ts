import type { Papel } from '@/types/dominio';
import type { Usuario } from '@/types/usuario';

/** Derivados de UI — docs/models.md secao 6. Nenhum dos dois e persistido. */
export type TipoDocumento = 'CPF' | 'CNPJ';
export type TipoIdentificador = 'EMAIL' | 'CPF' | 'CNPJ';

export interface RequisicaoLogin {
  /** Email, CPF ou CNPJ — ja normalizado. Nenhuma dica de tipo e enviada. */
  identificador: string;
  senha: string;
}

export interface RequisicaoCadastro {
  nome: string;
  email: string;
  /** So digitos, 11 ou 14. */
  documento: string;
  telefone?: string;
  senha: string;
}

export interface RespostaAutenticacao {
  token: string;
  /** ISO 8601, conveniencia. A verdade e a claim `exp`. */
  expiraEm: string;
  usuario: Usuario;
}

/**
 * Claims do JWT — o contrato mais critico do projeto. O mock emite exatamente
 * esta forma, entao a F6 nao altera nada no consumo.
 */
export interface ClaimsJwt {
  /** Registradas pela RFC 7519 — permanecem em ingles. */
  sub: string;
  iat: number;
  exp: number;
  /** Customizadas — em portugues, espelhadas pelo backend. */
  email: string;
  nome: string;
  papeis: Papel[];
}

/** Estado de cliente. Vive no Zustand e **nao** e persistido. */
export interface Sessao {
  token: string | null;
  usuario: Usuario | null;
  papeis: Papel[];
  autenticado: boolean;
  /** Epoch em segundos, vindo de `exp`. */
  expiraEm: number | null;
}
