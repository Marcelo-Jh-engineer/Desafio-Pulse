import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useSearchParams } from 'react-router-dom';
import { TituloDaPagina } from '@/components/titulo-da-pagina';
import { CampoFormulario } from '@/components/campo-formulario';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  esquemaCadastro,
  type FormularioCadastro,
} from '@/features/autenticacao/esquemas/autenticacao-esquemas';
import { useCadastro } from '@/features/autenticacao/hooks/use-autenticar';
import { normalizarIdentificador } from '@/lib/documento';
import { ErroDeAplicacao, MENSAGENS_ERRO } from '@/lib/erros';

/**
 * Cadastro — RF-AUTH-01. Cinco campos, nada além disso.
 *
 * O novo usuário sai como CLIENTE e já entra logado: o backend cria a conta no
 * provedor de identidade e devolve a sessão pronta, sem pedir a mesma senha
 * duas vezes.
 */
export function PaginaCadastro() {
  const cadastro = useCadastro();
  const [parametros] = useSearchParams();
  const retornarPara = parametros.get('retornarPara');
  const linkDeLogin = retornarPara
    ? `/login?retornarPara=${encodeURIComponent(retornarPara)}`
    : '/login';

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormularioCadastro>({
    resolver: zodResolver(esquemaCadastro),
    mode: 'onBlur',
    defaultValues: { login: '', email: '', nome: '', senha: '', confirmacaoSenha: '' },
  });

  // `errosPorCampo` usa a chave exata do campo, entao o mapeamento e direto.
  useEffect(() => {
    const erro = cadastro.error;
    if (!(erro instanceof ErroDeAplicacao) || !erro.errosPorCampo) return;

    for (const [campo, mensagem] of Object.entries(erro.errosPorCampo)) {
      setError(campo as keyof FormularioCadastro, { type: 'server', message: mensagem });
    }
  }, [cadastro.error, setError]);

  function aoEnviar(dados: FormularioCadastro) {
    cadastro.mutate({
      // Documento sai daqui **so com digitos**; e-mail, em minusculas.
      login: normalizarIdentificador(dados.login),
      email: dados.email.trim().toLowerCase(),
      nome: dados.nome.trim(),
      senha: dados.senha,
      // `confirmacaoSenha` fica de fora: existe so para o `refine` do Zod.
    });
  }

  const erroGeral =
    cadastro.error && !(cadastro.error instanceof ErroDeAplicacao && cadastro.error.errosPorCampo)
      ? cadastro.error instanceof ErroDeAplicacao
        ? cadastro.error.message
        : MENSAGENS_ERRO.servidor
      : null;

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="space-y-2 text-center">
        <TituloDaPagina tituloDocumento="Criar conta">Criar conta</TituloDaPagina>
        <p className="text-muted-foreground">Leva um minuto.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {erroGeral ? (
            <p
              role="alert"
              className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive"
            >
              {erroGeral}
            </p>
          ) : null}

          <form
            noValidate
            className="space-y-4"
            onSubmit={(evento) => void handleSubmit(aoEnviar)(evento)}
          >
            <CampoFormulario
              id="login"
              rotulo="Login"
              ajuda="CPF, CNPJ ou e-mail. Documento apenas com números, sem pontos ou traços."
              erro={errors.login?.message}
            >
              <Input
                id="login"
                autoComplete="username"
                placeholder="00000000000 ou voce@exemplo.com"
                aria-invalid={Boolean(errors.login)}
                {...register('login')}
              />
            </CampoFormulario>

            <CampoFormulario id="email" rotulo="E-mail" erro={errors.email?.message}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                {...register('email')}
              />
            </CampoFormulario>

            <CampoFormulario id="nome" rotulo="Nome completo" erro={errors.nome?.message}>
              <Input
                id="nome"
                autoComplete="name"
                aria-invalid={Boolean(errors.nome)}
                {...register('nome')}
              />
            </CampoFormulario>

            <CampoFormulario id="senha" rotulo="Senha" erro={errors.senha?.message}>
              <Input
                id="senha"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.senha)}
                {...register('senha')}
              />
            </CampoFormulario>

            <CampoFormulario
              id="confirmacaoSenha"
              rotulo="Confirmação de senha"
              erro={errors.confirmacaoSenha?.message}
            >
              <Input
                id="confirmacaoSenha"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.confirmacaoSenha)}
                {...register('confirmacaoSenha')}
              />
            </CampoFormulario>

            <Button
              type="submit"
              variante="primario"
              tamanho="grande"
              className="w-full"
              disabled={cadastro.isPending}
              aria-busy={cadastro.isPending}
            >
              {cadastro.isPending ? 'Criando conta...' : 'Criar conta'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{' '}
        <Link
          to={linkDeLogin}
          className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
