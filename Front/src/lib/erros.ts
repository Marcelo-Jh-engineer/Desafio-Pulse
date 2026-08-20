import { AxiosError } from 'axios';
import type { ErroApi } from '@/types/api';

/** Mensagens padronizadas — docs/behavior.md secao 13.2. */
export const MENSAGENS_ERRO = {
  rede: 'Não foi possível conectar. Tente de novo.',
  servidor: 'Algo deu errado do nosso lado. Tente de novo em instantes.',
  naoEncontrado: 'Não encontramos o que você procura.',
  semPermissao: 'Você não tem permissão para acessar esta área.',
  sessaoExpirada: 'Sua sessão expirou. Entre de novo para continuar.',
} as const;

/**
 * Erro de aplicacao normalizado. Todo consumidor (componente, hook, formulario)
 * lida com esta forma, nunca com o `AxiosError` cru.
 */
export class ErroDeAplicacao extends Error {
  readonly status: number;
  readonly errosPorCampo: Record<string, string> | undefined;

  constructor(mensagem: string, status: number, errosPorCampo?: Record<string, string>) {
    super(mensagem);
    this.name = 'ErroDeAplicacao';
    this.status = status;
    this.errosPorCampo = errosPorCampo;
  }

  get ehSessaoExpirada() {
    return this.status === 401;
  }

  get ehSemPermissao() {
    return this.status === 403;
  }

  get ehNaoEncontrado() {
    return this.status === 404;
  }
}

function pareceErroApi(valor: unknown): valor is ErroApi {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    'mensagem' in valor &&
    typeof valor.mensagem === 'string'
  );
}

/**
 * Converte qualquer falha de rede na forma unica de erro da aplicacao.
 * A mensagem exibida sai do backend quando ele manda uma; nunca de um campo
 * tecnico do Axios.
 */
export function normalizarErro(erro: unknown): ErroDeAplicacao {
  if (erro instanceof ErroDeAplicacao) return erro;

  if (erro instanceof AxiosError) {
    const resposta = erro.response;

    // Sem resposta: o pedido nem chegou ao servidor.
    if (!resposta) {
      return new ErroDeAplicacao(MENSAGENS_ERRO.rede, 0);
    }

    const corpo: unknown = resposta.data;
    if (pareceErroApi(corpo)) {
      return new ErroDeAplicacao(corpo.mensagem, resposta.status, corpo.errosPorCampo);
    }

    return new ErroDeAplicacao(mensagemPadraoPorStatus(resposta.status), resposta.status);
  }

  return new ErroDeAplicacao(MENSAGENS_ERRO.servidor, 0);
}

function mensagemPadraoPorStatus(status: number): string {
  if (status === 401) return MENSAGENS_ERRO.sessaoExpirada;
  if (status === 403) return MENSAGENS_ERRO.semPermissao;
  if (status === 404) return MENSAGENS_ERRO.naoEncontrado;
  return MENSAGENS_ERRO.servidor;
}
