import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, Lock, QrCode } from 'lucide-react';
import { TituloDaPagina } from '@/components/titulo-da-pagina';
import { EstadoErro } from '@/components/estado-erro';
import { Preco } from '@/components/preco';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { IndicadorEtapas } from '@/features/checkout/componentes/indicador-etapas';
import { usePagar, usePedido } from '@/features/checkout/hooks/use-checkout';
import { ErroDeAplicacao, MENSAGENS_ERRO } from '@/lib/erros';
import { ROTULO_METODO_PAGAMENTO, type MetodoPagamento } from '@/types/dominio';

const METODOS: { valor: MetodoPagamento; icone: typeof CreditCard; descricao: string }[] = [
  { valor: 'CARTAO', icone: CreditCard, descricao: 'Pagamento simulado pelo gateway' },
  { valor: 'PIX', icone: QrCode, descricao: 'Processamento assíncrono pelo mesmo fluxo' },
];

/** Solicita a cobrança; o desfecho chega de forma assíncrona pelo RabbitMQ. */
export function PaginaPagamento() {
  const [parametros] = useSearchParams();
  const pedidoId = parametros.get('pedido') ?? '';
  const pedido = usePedido(pedidoId);
  const pagamento = usePagar();
  const navegar = useNavigate();
  const [metodo, definirMetodo] = useState<MetodoPagamento | null>(null);

  if (!pedidoId) return <Navigate to="/carrinho" replace />;
  if (pedido.isPending) return <Skeleton className="h-96 w-full" />;

  if (pedido.isError) {
    return (
      <EstadoErro
        titulo="Não foi possível carregar o pedido"
        mensagem={pedido.error instanceof ErroDeAplicacao ? pedido.error.message : undefined}
        aoTentarDeNovo={() => {
          void pedido.refetch();
        }}
      />
    );
  }

  if (pedido.data.status === 'PAGO') {
    return <Navigate to={`/pedidos/${pedido.data.id}/confirmacao`} replace />;
  }

  if (pedido.data.status !== 'PENDENTE') {
    return <Navigate to={`/pedidos/${pedido.data.id}`} replace />;
  }

  function solicitarPagamento() {
    if (!metodo || pagamento.isPending) return;

    pagamento.mutate(
      { pedidoId, metodo },
      {
        onSuccess: () => {
          void navegar(`/pedidos/${pedidoId}`, { replace: true });
        },
      },
    );
  }

  if (pagamento.isPending) {
    return (
      <div className="space-y-6">
        <TituloDaPagina tituloDocumento="Solicitando pagamento">
          Solicitando pagamento
        </TituloDaPagina>
        <IndicadorEtapas atual={2} />
        <Card>
          <CardContent
            role="status"
            aria-live="assertive"
            className="flex flex-col items-center gap-3 py-16 text-center"
          >
            <Lock aria-hidden="true" className="size-8 text-primary" />
            <p className="font-medium">Enfileirando a cobrança do pedido {pedido.data.id}</p>
            <p className="max-w-prose text-sm text-muted-foreground">
              Você será levado ao acompanhamento assim que a solicitação for registrada.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const erro = pagamento.error
    ? pagamento.error instanceof ErroDeAplicacao
      ? pagamento.error.message
      : MENSAGENS_ERRO.servidor
    : null;

  return (
    <div className="space-y-6">
      <TituloDaPagina tituloDocumento="Pagamento">Pagamento</TituloDaPagina>
      <IndicadorEtapas atual={2} />

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardContent className="space-y-5 pt-6">
            {erro ? (
              <p
                role="alert"
                className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive"
              >
                {erro}
              </p>
            ) : null}

            <fieldset>
              <legend className="mb-3 text-lg font-semibold">Como você quer pagar?</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {METODOS.map(({ valor, icone: Icone, descricao }) => {
                  const selecionado = metodo === valor;
                  return (
                    <div key={valor}>
                      <input
                        type="radio"
                        id={`metodo-${valor}`}
                        name="metodo"
                        value={valor}
                        checked={selecionado}
                        onChange={() => {
                          definirMetodo(valor);
                        }}
                        className="peer sr-only"
                      />
                      <label
                        htmlFor={`metodo-${valor}`}
                        className={`flex cursor-pointer flex-col gap-1 rounded-md border p-4 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 ${
                          selecionado
                            ? 'border-primary bg-accent text-accent-foreground'
                            : 'border-border bg-card hover:bg-muted'
                        }`}
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <Icone aria-hidden="true" className="size-4" />
                          {ROTULO_METODO_PAGAMENTO[valor]}
                        </span>
                        <span className="text-xs text-muted-foreground">{descricao}</span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </fieldset>

            <p className="text-sm text-muted-foreground">
              Esta aplicação usa um gateway demonstrativo. Nenhum dado de cartão é solicitado,
              enviado ou armazenado.
            </p>

            <Button
              type="button"
              variante="acao"
              tamanho="grande"
              className="w-full"
              disabled={!metodo}
              onClick={solicitarPagamento}
            >
              Solicitar pagamento
            </Button>
          </CardContent>
        </Card>

        <aside aria-label="Resumo do pedido">
          <Card className="sticky top-24">
            <CardContent className="space-y-3 pt-6">
              <h2 className="text-xl font-semibold">Pedido {pedido.data.id}</h2>
              <ul className="space-y-2 text-sm">
                {pedido.data.itens.map((item) => (
                  <li key={item.produtoId} className="flex justify-between gap-2">
                    <span className="min-w-0 truncate">
                      {item.quantidade}× {item.nome}
                    </span>
                    <Preco centavos={item.totalLinhaEmCentavos} className="shrink-0 text-sm" />
                  </li>
                ))}
              </ul>
              <div className="flex items-baseline justify-between border-t border-border pt-3">
                <span className="font-semibold">Total</span>
                <Preco centavos={pedido.data.totalEmCentavos} className="text-2xl" />
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
