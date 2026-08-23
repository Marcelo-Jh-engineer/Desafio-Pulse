import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import { ambiente } from '@/lib/ambiente';
import { normalizarErro } from '@/lib/erros';

/**
 * Cliente HTTP encapsulado. Nenhum componente, hook ou servico usa `axios` ou
 * `fetch` direto — assim a troca de mock para API real (F6) e o tratamento de
 * 401/403 ficam num lugar so.
 *
 * O modulo nao importa nada de `features/`. Quem depende de sessao registra
 * suas funcoes por injecao, na inicializacao do app.
 */
const instancia = axios.create({
  baseURL: ambiente.urlBaseApi,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
  // O cookie de sessao e HttpOnly: nenhum codigo daqui o le nem o escreve. Esta
  // linha apenas autoriza o navegador a anexa-lo, o que ele nao faz por conta
  // propria quando a chamada sai para outra origem — o caso do `npm run dev`.
  withCredentials: true,
});

type FornecedorDeToken = () => string | null;
type TratadorDeStatus = () => void;
/** Verdadeiro quando conseguiu um token novo; falso quando a sessao acabou mesmo. */
type RenovadorDeSessao = () => Promise<boolean>;

/** A tentativa de renovacao acontece uma vez por requisicao, no maximo. */
type ConfiguracaoComTentativa = InternalAxiosRequestConfig & { jaTentouRenovar?: boolean };

let fornecerToken: FornecedorDeToken = () => null;
function semTratamento(): void {
  // Ate a F2 registrar os tratadores, 401 e 403 apenas viram erro normalizado.
}

let aoExpirarSessao: TratadorDeStatus = semTratamento;
let aoNegarPermissao: TratadorDeStatus = semTratamento;

/** Registrado pelo store de sessao. O access token vive em memoria, nunca em storage. */
export function registrarFornecedorDeToken(fornecedor: FornecedorDeToken) {
  fornecerToken = fornecedor;
}

/** 401: sessao expirada. Limpa o store e leva ao login preservando o destino. */
export function registrarTratadorDeSessaoExpirada(tratador: TratadorDeStatus) {
  aoExpirarSessao = tratador;
}

/** 403: sem permissao. **Preserva** a sessao e leva a `/403`. */
export function registrarTratadorDePermissaoNegada(tratador: TratadorDeStatus) {
  aoNegarPermissao = tratador;
}

let renovarSessao: RenovadorDeSessao = () => Promise.resolve(false);

/**
 * Registrado pelo store de sessao. Sem ele, um 401 por token vencido levaria ao
 * login mesmo com refresh token valido na mao.
 */
export function registrarRenovadorDeSessao(renovador: RenovadorDeSessao) {
  renovarSessao = renovador;
}

let renovacaoEmAndamento: Promise<boolean> | null = null;

/**
 * Uma renovacao por vez. Uma tela costuma disparar varias chamadas juntas, e
 * todas expiram no mesmo instante: sem esta trava seriam N trocas de token
 * simultaneas, cada uma sobrescrevendo o par que a anterior acabou de guardar.
 */
function renovarUmaVezSo(): Promise<boolean> {
  renovacaoEmAndamento ??= renovarSessao().finally(() => {
    renovacaoEmAndamento = null;
  });
  return renovacaoEmAndamento;
}

/**
 * As proprias rotas de sessao ficam de fora: um 401 em `/autenticacao/login` e
 * senha errada, e um 401 em `/autenticacao/renovar` e a renovacao falhando.
 * Tentar renovar nesses casos daria um laco.
 */
function ehRotaDeSessao(caminho: string | undefined): boolean {
  return caminho?.includes('/autenticacao/') ?? false;
}

instancia.interceptors.request.use((configuracao) => {
  const token = fornecerToken();
  if (token) {
    configuracao.headers.set('Authorization', `Bearer ${token}`);
  }
  return configuracao;
});

instancia.interceptors.response.use(
  (resposta) => resposta,
  async (erro: unknown) => {
    const normalizado = normalizarErro(erro);
    const original: ConfiguracaoComTentativa | undefined = axios.isAxiosError(erro)
      ? erro.config
      : undefined;

    // Token vencido nao e sessao encerrada: com refresh token na mao, a troca e
    // silenciosa e a requisicao original segue como se nada tivesse acontecido.
    if (
      normalizado.ehSessaoExpirada &&
      original &&
      !original.jaTentouRenovar &&
      !ehRotaDeSessao(original.url)
    ) {
      original.jaTentouRenovar = true;
      if (await renovarUmaVezSo()) {
        return instancia.request(original);
      }
    }

    // 401 e 403 sao coisas diferentes — docs/prd.md secao 3.4.
    if (normalizado.ehSessaoExpirada) aoExpirarSessao();
    if (normalizado.ehSemPermissao) aoNegarPermissao();

    return Promise.reject(normalizado);
  },
);

export const clienteHttp = {
  async obter<T>(caminho: string, configuracao?: AxiosRequestConfig): Promise<T> {
    const { data } = await instancia.get<T>(caminho, configuracao);
    return data;
  },
  async criar<T>(
    caminho: string,
    corpo?: unknown,
    configuracao?: AxiosRequestConfig,
  ): Promise<T> {
    const { data } = await instancia.post<T>(caminho, corpo, configuracao);
    return data;
  },
  async substituir<T>(
    caminho: string,
    corpo?: unknown,
    configuracao?: AxiosRequestConfig,
  ): Promise<T> {
    const { data } = await instancia.put<T>(caminho, corpo, configuracao);
    return data;
  },
  async atualizar<T>(
    caminho: string,
    corpo?: unknown,
    configuracao?: AxiosRequestConfig,
  ): Promise<T> {
    const { data } = await instancia.patch<T>(caminho, corpo, configuracao);
    return data;
  },
  async remover<T>(caminho: string, configuracao?: AxiosRequestConfig): Promise<T> {
    const { data } = await instancia.delete<T>(caminho, configuracao);
    return data;
  },
};
