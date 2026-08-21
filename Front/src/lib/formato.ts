import { apenasDigitos, detectarTipoDocumento } from '@/lib/documento';

/**
 * Formatacao para exibicao — docs/prd.md secao 7.5. Dispensa `react-imask`.
 *
 * Esta e a **unica** camada autorizada a colocar pontuacao em documento. O
 * modelo, o cache e a rede so veem digitos.
 */

/** `000.000.000-00`, aplicada progressivamente enquanto o usuario digita. */
function aplicarMascaraCpf(digitos: string): string {
  return digitos
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
}

/** `00.000.000/0000-00`, tambem progressiva. */
function aplicarMascaraCnpj(digitos: string): string {
  return digitos
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5');
}

/**
 * Mascara que troca sozinha de CPF para CNPJ ao passar do 11o digito. O
 * usuario nunca declara o tipo — docs/behavior.md secao 5.
 */
export function formatarDocumento(valor: string): string {
  const digitos = apenasDigitos(valor).slice(0, 14);
  return digitos.length <= 11 ? aplicarMascaraCpf(digitos) : aplicarMascaraCnpj(digitos);
}

/**
 * Exibicao fora da tela de perfil: `***.456.789-**` — RNF-SEC-04.
 * Preserva so o miolo, o bastante para o dono se reconhecer.
 */
export function mascararDocumento(valor: string): string {
  const digitos = apenasDigitos(valor);
  const tipo = detectarTipoDocumento(digitos);

  if (tipo === 'CPF') {
    return `***.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-**`;
  }
  if (tipo === 'CNPJ') {
    return `**.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8, 12)}-**`;
  }
  return '***';
}

/** Dinheiro e sempre inteiro em centavos no modelo; a divisao acontece aqui. */
export function formatarPreco(centavos: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    centavos / 100,
  );
}

/** `00000-000` */
export function formatarCep(valor: string): string {
  const digitos = apenasDigitos(valor).slice(0, 8);
  return digitos.replace(/^(\d{5})(\d)/, '$1-$2');
}

/** `(11) 98765-4321` para celular, `(11) 3456-7890` para fixo. */
export function formatarTelefone(valor: string): string {
  const digitos = apenasDigitos(valor).slice(0, 11);
  if (digitos.length <= 10) {
    return digitos.replace(/^(\d{2})(\d)/, '($1) $2').replace(/^(\(\d{2}\) \d{4})(\d)/, '$1-$2');
  }
  return digitos.replace(/^(\d{2})(\d)/, '($1) $2').replace(/^(\(\d{2}\) \d{5})(\d)/, '$1-$2');
}
