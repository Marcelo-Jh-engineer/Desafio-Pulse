import { z } from 'zod';
import { apenasDigitos } from '@/lib/documento';

/** Endereco de entrega — docs/behavior.md secao 8. */
export const esquemaEndereco = z.object({
  cep: z
    .string()
    .refine((valor) => apenasDigitos(valor).length === 8, 'Informe um CEP com 8 dígitos.'),
  logradouro: z.string().trim().min(3, 'Informe o logradouro.'),
  // String de proposito: "s/n" e um numero valido de endereco.
  numero: z.string().trim().min(1, 'Informe o número.'),
  complemento: z.string().trim(),
  bairro: z.string().trim().min(2, 'Informe o bairro.'),
  cidade: z.string().trim().min(2, 'Informe a cidade.'),
  uf: z
    .string()
    .trim()
    .toUpperCase()
    .refine((valor) => /^[A-Z]{2}$/.test(valor), 'Informe a UF com 2 letras.'),
});

export type FormularioEndereco = z.infer<typeof esquemaEndereco>;

/**
 * Dados de cartão — docs/models.md secao 10.
 *
 * Este schema descreve o **formulário**, não um modelo persistido. Nada daqui
 * pode acabar em store, storage, cache ou log.
 */
export const esquemaCartao = z.object({
  numeroCartao: z
    .string()
    .refine(
      (valor) => [13, 14, 15, 16].includes(apenasDigitos(valor).length),
      'Informe um número de cartão válido.',
    ),
  nomeTitular: z.string().trim().min(3, 'Informe o nome como está no cartão.'),
  validade: z
    .string()
    .refine((valor) => /^(0[1-9]|1[0-2])\/\d{2}$/.test(valor.trim()), 'Use o formato MM/AA.'),
  cvv: z
    .string()
    .refine(
      (valor) => /^\d{3,4}$/.test(valor.trim()),
      'O código de segurança tem 3 ou 4 dígitos.',
    ),
  // String no formulário e número no envio: o `select` entrega texto, e
  // `z.coerce` mentiria sobre o tipo que o React Hook Form devolve.
  parcelas: z.string(),
});

export type FormularioCartao = z.infer<typeof esquemaCartao>;
