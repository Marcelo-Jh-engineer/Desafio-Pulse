import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navigate, useNavigate } from 'react-router-dom';
import { TituloDaPagina } from '@/components/titulo-da-pagina';
import { CampoFormulario } from '@/components/campo-formulario';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Preco } from '@/components/preco';
import { AvisoDivergencias } from '@/features/checkout/componentes/aviso-divergencias';
import { IndicadorEtapas } from '@/features/checkout/componentes/indicador-etapas';
import {
  esquemaEndereco,
  type FormularioEndereco,
} from '@/features/checkout/esquemas/checkout-esquemas';
import { useCriarPedido, useValidacaoDoCarrinho } from '@/features/checkout/hooks/use-checkout';
import { useCarrinho } from '@/lib/carrinho-store';
import { apenasDigitos } from '@/lib/documento';
import { formatarCep } from '@/lib/formato';
import { ErroDeAplicacao, MENSAGENS_ERRO } from '@/lib/erros';

/** Checkout, etapa 1: endereco e conferencia — RF-CHK-01, RF-CHK-02, RF-CHK-08. */
export function PaginaCheckout() {
  const carrinho = useCarrinho();
  const validacao = useValidacaoDoCarrinho(carrinho.itens);
  const criarPedido = useCriarPedido();
  const navegar = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormularioEndereco>({
    resolver: zodResolver(esquemaEndereco),
    mode: 'onBlur',
    defaultValues: {
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: '',
    },
  });

  // Carrinho vazio no acesso direto volta para o carrinho — docs/behavior.md 8.
  if (carrinho.itens.length === 0) return <Navigate to="/carrinho" replace />;

  const divergencias = validacao.data?.divergencias ?? [];
  const bloqueado = divergencias.length > 0 || validacao.isPending;

  function aoEnviar(dados: FormularioEndereco) {
    criarPedido.mutate(
      {
        itens: carrinho.itens.map((item) => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
        })),
        endereco: {
          // CEP normalizado para 8 digitos: a mascara e so da view.
          cep: apenasDigitos(dados.cep),
          logradouro: dados.logradouro,
          numero: dados.numero,
          ...(dados.complemento ? { complemento: dados.complemento } : {}),
          bairro: dados.bairro,
          cidade: dados.cidade,
          uf: dados.uf,
        },
      },
      {
        onSuccess: (pedido) => {
          // O pedido nasce PENDENTE. O pagamento referencia o id — por isso a
          // proxima etapa nao carrega endereco nenhum na URL.
          void navegar(`/checkout/pagamento?pedido=${pedido.id}`);
        },
      },
    );
  }

  const erroAoCriar =
    criarPedido.error instanceof ErroDeAplicacao
      ? criarPedido.error.message
      : criarPedido.error
        ? MENSAGENS_ERRO.servidor
        : null;

  return (
    <div className="space-y-6">
      <TituloDaPagina tituloDocumento="Checkout">Finalizar compra</TituloDaPagina>
      <IndicadorEtapas atual={1} />

      {validacao.isPending ? (
        <Skeleton className="h-20 w-full" />
      ) : (
        <AvisoDivergencias
          divergencias={divergencias}
          aoAjustar={() => {
            void navegar('/carrinho');
          }}
        />
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardContent className="pt-6">
            {erroAoCriar ? (
              <p
                role="alert"
                className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive"
              >
                {erroAoCriar}
              </p>
            ) : null}

            <form
              noValidate
              className="space-y-4"
              onSubmit={(evento) => void handleSubmit(aoEnviar)(evento)}
            >
              <fieldset className="space-y-4" disabled={criarPedido.isPending}>
                <legend className="mb-2 text-lg font-semibold">Endereço de entrega</legend>

                <CampoFormulario id="cep" rotulo="CEP" erro={errors.cep?.message}>
                  <Input
                    id="cep"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder="00000-000"
                    aria-invalid={Boolean(errors.cep)}
                    {...register('cep', {
                      onChange: (evento: React.ChangeEvent<HTMLInputElement>) => {
                        setValue('cep', formatarCep(evento.target.value));
                      },
                    })}
                  />
                </CampoFormulario>

                <CampoFormulario
                  id="logradouro"
                  rotulo="Logradouro"
                  erro={errors.logradouro?.message}
                >
                  <Input
                    id="logradouro"
                    autoComplete="address-line1"
                    aria-invalid={Boolean(errors.logradouro)}
                    {...register('logradouro')}
                  />
                </CampoFormulario>

                <div className="grid gap-4 sm:grid-cols-2">
                  <CampoFormulario id="numero" rotulo="Número" erro={errors.numero?.message}>
                    <Input
                      id="numero"
                      placeholder="1000 ou s/n"
                      aria-invalid={Boolean(errors.numero)}
                      {...register('numero')}
                    />
                  </CampoFormulario>

                  <CampoFormulario id="complemento" rotulo="Complemento (opcional)">
                    <Input
                      id="complemento"
                      autoComplete="address-line2"
                      {...register('complemento')}
                    />
                  </CampoFormulario>
                </div>

                <CampoFormulario id="bairro" rotulo="Bairro" erro={errors.bairro?.message}>
                  <Input
                    id="bairro"
                    aria-invalid={Boolean(errors.bairro)}
                    {...register('bairro')}
                  />
                </CampoFormulario>

                <div className="grid gap-4 sm:grid-cols-[1fr_6rem]">
                  <CampoFormulario id="cidade" rotulo="Cidade" erro={errors.cidade?.message}>
                    <Input
                      id="cidade"
                      autoComplete="address-level2"
                      aria-invalid={Boolean(errors.cidade)}
                      {...register('cidade')}
                    />
                  </CampoFormulario>

                  <CampoFormulario id="uf" rotulo="UF" erro={errors.uf?.message}>
                    <Input
                      id="uf"
                      maxLength={2}
                      autoComplete="address-level1"
                      className="uppercase"
                      aria-invalid={Boolean(errors.uf)}
                      {...register('uf')}
                    />
                  </CampoFormulario>
                </div>
              </fieldset>

              <Button
                type="submit"
                variante="acao"
                tamanho="grande"
                className="w-full"
                disabled={bloqueado || criarPedido.isPending}
                aria-busy={criarPedido.isPending}
              >
                {criarPedido.isPending ? 'Criando pedido...' : 'Ir para o pagamento'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <aside aria-label="Resumo do pedido">
          <Card className="sticky top-24">
            <CardContent className="space-y-3 pt-6">
              <h2 className="text-xl font-semibold">Resumo</h2>
              <ul className="space-y-2 text-sm">
                {carrinho.itens.map((item) => (
                  <li key={item.produtoId} className="flex justify-between gap-2">
                    <span className="min-w-0 truncate">
                      {item.quantidade}× {item.nome}
                    </span>
                    <Preco centavos={item.totalLinhaEmCentavos} className="shrink-0 text-sm" />
                  </li>
                ))}
              </ul>
              <div className="flex justify-between border-t border-border pt-3 text-sm">
                <span className="text-muted-foreground">Frete</span>
                {carrinho.freteEmCentavos === 0 ? (
                  <span className="font-medium text-sucesso">Grátis</span>
                ) : (
                  <Preco centavos={carrinho.freteEmCentavos} className="text-sm" />
                )}
              </div>
              <div className="flex items-baseline justify-between border-t border-border pt-3">
                <span className="font-semibold">Total</span>
                <Preco centavos={carrinho.totalEmCentavos} className="text-2xl" />
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
