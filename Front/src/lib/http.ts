import axios, { type AxiosRequestConfig } from 'axios';
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
});

type FornecedorDeToken = () => string | null;
type TratadorDeStatus = () => void;

let fornecerToken: FornecedorDeToken = () => null;
function semTratamento(): void {
  // Ate a F2 registrar os tratadores, 401 e 403 apenas viram erro normalizado.
}

let aoExpirarSessao: TratadorDeStatus = semTratamento;
let aoNegarPermissao: TratadorDeStatus = semTratamento;

/** Registrado na F2 pelo store de sessao. O token vive em memoria, nunca em storage. */
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

instancia.interceptors.request.use((configuracao) => {
  const token = fornecerToken();
  if (token) {
    configuracao.headers.set('Authorization', `Bearer ${token}`);
  }
  return configuracao;
});

instancia.interceptors.response.use(
  (resposta) => resposta,
  (erro: unknown) => {
    const normalizado = normalizarErro(erro);

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
