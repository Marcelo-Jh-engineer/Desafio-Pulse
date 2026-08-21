import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useSearchParams } from 'react-router-dom';
import { TituloDaPagina } from '@/components/titulo-da-pagina';
import { CampoFormulario } from '@/components/campo-formulario';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  esquemaLogin,
  type FormularioLogin,
} from '@/features/autenticacao/esquemas/autenticacao-esquemas';
import { useLogin } from '@/features/autenticacao/hooks/use-autenticar';
import { normalizarIdentificador } from '@/lib/documento';
import { ErroDeAplicacao, MENSAGENS_ERRO } from '@/lib/erros';

/** Login por e-mail ou CPF — RF-AUTH-02. */
export function PaginaLogin() {
  const login = useLogin();
  const [parametros] = useSearchParams();
  // Preserva o destino ao pular para o cadastro: quem veio de um clique em
  // comprar continua voltando para la depois de criar a conta.
  const retornarPara = parametros.get('retornarPara');
  const linkDeCadastro = retornarPara
    ? `/cadastro?retornarPara=${encodeURIComponent(retornarPara)}`
    : '/cadastro';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormularioLogin>({
    resolver: zodResolver(esquemaLogin),
    // Nao acusa erro a cada tecla: nao faz sentido reclamar de um CPF pela metade.
    mode: 'onBlur',
    defaultValues: { identificador: '', senha: '' },
  });

  function aoEnviar(dados: FormularioLogin) {
    login.mutate({
      // Normaliza so na saida: CPF sem pontuacao, e-mail em minusculas.
      identificador: normalizarIdentificador(dados.identificador),
      senha: dados.senha,
    });
  }

  const erro = login.error
    ? login.error instanceof ErroDeAplicacao
      ? login.error.message
      : MENSAGENS_ERRO.servidor
    : null;

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <TituloDaPagina tituloDocumento="Entrar">Entrar</TituloDaPagina>
        <p className="text-muted-foreground">Use seu CPF, CNPJ ou e-mail para continuar.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {erro ? (
            <p
              role="alert"
              className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive"
            >
              {erro}
            </p>
          ) : null}

          <form
            noValidate
            className="space-y-4"
            onSubmit={(evento) => void handleSubmit(aoEnviar)(evento)}
          >
            <CampoFormulario
              id="identificador"
              rotulo="Login"
              erro={errors.identificador?.message}
            >
              <Input
                id="identificador"
                autoComplete="username"
                disabled={login.isPending}
                aria-invalid={Boolean(errors.identificador)}
                aria-describedby={errors.identificador ? 'identificador-erro' : undefined}
                {...register('identificador')}
              />
            </CampoFormulario>

            <CampoFormulario id="senha" rotulo="Senha" erro={errors.senha?.message}>
              <Input
                id="senha"
                type="password"
                autoComplete="current-password"
                disabled={login.isPending}
                aria-invalid={Boolean(errors.senha)}
                aria-describedby={errors.senha ? 'senha-erro' : undefined}
                {...register('senha')}
              />
            </CampoFormulario>

            <Button
              type="submit"
              variante="primario"
              tamanho="grande"
              className="w-full"
              disabled={login.isPending}
              aria-busy={login.isPending}
            >
              {login.isPending ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <UsuariosDeTeste />
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Ainda não tem conta?{' '}
        <Link
          to={linkDeCadastro}
          className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}

/**
 * Atalho da fase mockada: sem backend, quem abre a tela nao teria como saber
 * quais credenciais existem. Sai junto com o mock na F6.
 */
function UsuariosDeTeste() {
  return (
    <div className="mt-6 space-y-1 rounded-md bg-muted p-3 text-xs text-muted-foreground">
      <p className="font-medium text-foreground">Usuários de teste (dados mockados)</p>
      <p>
        Cliente — CPF <code>11144477735</code> · senha <code>senha123</code>
      </p>
      <p>
        Admin — e-mail <code>admin@coracaodagente.com</code> · senha <code>admin123</code>
      </p>
    </div>
  );
}
