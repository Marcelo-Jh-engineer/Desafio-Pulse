import { z } from 'zod';
import { detectarTipoIdentificador, validarDocumento } from '@/lib/documento';

export const MENSAGEM_IDENTIFICADOR = 'Informe um CPF, CNPJ ou e-mail válido.';

const FORMATO_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Um identificador só, que pode ser CPF, CNPJ ou e-mail — RF-AUTH-02.
 *
 * `superRefine` porque a regra depende do que o valor **é**: detecta o tipo e
 * aplica a validação daquele tipo. Sai uma mensagem só, que é o que o usuário
 * precisa ler; um `union` empilharia três.
 *
 * Documento entra **apenas com dígitos** — sem ponto, barra ou hífen. É assim
 * que ele já trafega e é assim que fica guardado (RNF-SEC-03).
 */
function validarIdentificador(valor: string, contexto: z.RefinementCtx) {
  const tipo = detectarTipoIdentificador(valor);

  const valido =
    tipo === 'EMAIL'
      ? FORMATO_EMAIL.test(valor.toLowerCase())
      : tipo !== undefined && validarDocumento(valor);

  if (!valido) {
    contexto.addIssue({ code: z.ZodIssueCode.custom, message: MENSAGEM_IDENTIFICADOR });
  }
}

export const esquemaLogin = z.object({
  identificador: z.string().trim().min(1, 'Informe seu login.').superRefine(validarIdentificador),
  senha: z.string().min(1, 'Informe sua senha.'),
});

export type FormularioLogin = z.infer<typeof esquemaLogin>;

/**
 * Cadastro — cinco campos, nada além disso.
 *
 * `login` e `email` são separados de propósito: o login pode ser um documento,
 * e mesmo quando é e-mail não precisa ser o mesmo endereço de contato.
 */
export const esquemaCadastro = z
  .object({
    login: z
      .string()
      .trim()
      .min(1, 'Informe um CPF, CNPJ ou e-mail para acessar.')
      .superRefine(validarIdentificador),
    email: z.string().trim().toLowerCase().email('Informe um e-mail válido.'),
    nome: z.string().trim().min(3, 'Informe seu nome completo.').max(120),
    senha: z.string().min(6, 'A senha precisa ter ao menos 6 caracteres.'),
    confirmacaoSenha: z.string(),
  })
  // O erro vai para o campo de confirmação: quem errou foi a repetição.
  // `confirmacaoSenha` existe só aqui — nunca é enviada ao backend.
  .refine((dados) => dados.senha === dados.confirmacaoSenha, {
    path: ['confirmacaoSenha'],
    message: 'As senhas não conferem.',
  });

export type FormularioCadastro = z.infer<typeof esquemaCadastro>;
