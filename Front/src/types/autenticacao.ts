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

/**
 * O refresh token **nao** esta aqui: ele viaja num cookie HttpOnly que o
 * JavaScript nao le nem escreve. O front so recebe o access token, que dura
 * cinco minutos e vive em memoria.
 */
export interface RespostaAutenticacao {
  /** Access token JWT. Vai no header Authorization de toda chamada. */
  token: string;
  /** Validade do access token. Usada para agendar a renovacao silenciosa. */
  expiraEmSegundos: number;
  usuario: Usuario;
}

/**
 * O que o front consegue ler de dentro do token.
 *
 * Quem precisa de papel le daqui e nunca do corpo de uma resposta: e o token
 * que o backend confere a cada chamada.
 */
export interface ConteudoDoToken {
  id: string;
  nome: string;
  email: string;
  /** CPF, CNPJ (so digitos) ou e-mail — a credencial escolhida no cadastro. */
  login: string;
  papeis: Papel[];
}

/**
 * Estado de cliente. Vive no Zustand, em memoria — o que sobrevive ao F5 e o
 * cookie de sessao, no navegador, e nao este objeto.
 */
export interface Sessao {
  token: string | null;
  usuario: Usuario | null;
  papeis: Papel[];
  autenticado: boolean;
  /**
   * Verdadeiro enquanto a tentativa de restaurar a sessao pelo cookie nao
   * terminou. Sem isto os guardas de rota decidiriam com a sessao ainda vazia e
   * mandariam para o login quem tem sessao valida.
   */
  restaurando: boolean;
}
