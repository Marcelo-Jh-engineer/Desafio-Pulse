import type { TipoDocumento, TipoIdentificador } from '@/types/autenticacao';

/**
 * Validacao de CPF e CNPJ escrita a mao — docs/prd.md secao 7.5. Dispensa
 * `cpf-cnpj-validator`: sao dois algoritmos de digito verificador publicos e
 * estaveis desde sempre, e a alternativa seria uma dependencia inteira.
 *
 * Regra do projeto: documento circula **so com digitos**. Mascara e assunto
 * exclusivo da view (RNF-SEC-03 e RNF-SEC-04, LGPD).
 */

const TAMANHO_CPF = 11;
const TAMANHO_CNPJ = 14;

/** Remove tudo que nao e digito. Base de toda normalizacao de documento. */
export function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

/** Alias semantico: o que sai daqui e o que vai para o backend. */
export function normalizarDocumento(valor: string): string {
  return apenasDigitos(valor);
}

/**
 * Soma ponderada usada pelos dois algoritmos: percorre os digitos da esquerda
 * para a direita multiplicando por pesos decrescentes.
 */
function digitoVerificador(digitos: number[], pesos: number[]): number {
  const soma = digitos.reduce(
    (total, digito, indice) => total + digito * (pesos[indice] ?? 0),
    0,
  );
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

/**
 * Todos os digitos iguais passam na conta do verificador mas sao invalidos por
 * definicao — `11111111111` e o caso classico. Precisa de rejeicao explicita.
 */
function todosOsDigitosIguais(valor: string): boolean {
  return /^(\d)\1+$/.test(valor);
}

export function validarCpf(valor: string): boolean {
  const digitos = apenasDigitos(valor);
  if (digitos.length !== TAMANHO_CPF) return false;
  if (todosOsDigitosIguais(digitos)) return false;

  const numeros = Array.from(digitos, Number);
  const primeiro = digitoVerificador(numeros.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (primeiro !== numeros[9]) return false;

  const segundo = digitoVerificador(numeros.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return segundo === numeros[10];
}

export function validarCnpj(valor: string): boolean {
  const digitos = apenasDigitos(valor);
  if (digitos.length !== TAMANHO_CNPJ) return false;
  if (todosOsDigitosIguais(digitos)) return false;

  const numeros = Array.from(digitos, Number);
  const primeiro = digitoVerificador(numeros.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (primeiro !== numeros[12]) return false;

  const segundo = digitoVerificador(
    numeros.slice(0, 13),
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );
  return segundo === numeros[13];
}

/**
 * Tipo inferido **pelo comprimento**, nunca declarado pelo usuario.
 * docs/models.md secao 6.
 */
export function detectarTipoDocumento(valor: string): TipoDocumento | undefined {
  const digitos = apenasDigitos(valor);
  if (digitos.length === TAMANHO_CPF) return 'CPF';
  if (digitos.length === TAMANHO_CNPJ) return 'CNPJ';
  return undefined;
}

/** Valida o documento pelo tipo que o proprio comprimento determina. */
export function validarDocumento(valor: string): boolean {
  const tipo = detectarTipoDocumento(valor);
  if (tipo === 'CPF') return validarCpf(valor);
  if (tipo === 'CNPJ') return validarCnpj(valor);
  return false;
}

/**
 * Identificador polimorfico do login — docs/behavior.md secao 5.
 * A ordem de avaliacao importa: `@` decide primeiro, antes de olhar digitos.
 */
export function detectarTipoIdentificador(valor: string): TipoIdentificador | undefined {
  const limpo = valor.trim();
  if (limpo.includes('@')) return 'EMAIL';
  return detectarTipoDocumento(limpo);
}

/**
 * Normaliza para envio: documento sem pontuacao, email em minusculas e sem
 * espaco nas pontas. O backend e quem resolve o identificador — o front nao
 * manda dica de tipo nenhuma.
 */
export function normalizarIdentificador(valor: string): string {
  const limpo = valor.trim();
  if (limpo.includes('@')) return limpo.toLowerCase();
  return apenasDigitos(limpo);
}
