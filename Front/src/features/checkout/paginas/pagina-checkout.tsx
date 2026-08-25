import { Navigate, useNavigate } from 'react-router-dom';
import { TituloDaPagina } from '@/components/titulo-da-pagina';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Preco } from '@/components/preco';
import { AvisoDivergencias } from '@/features/checkout/componentes/aviso-divergencias';
import { IndicadorEtapas } from '@/features/checkout/componentes/indicador-etapas';
import { useCriarPedido, useValidacaoDoCarrinho } from '@/features/checkout/hooks/use-checkout';
import { useCarrinho } from '@/lib/carrinho-store';
import { ErroDeAplicacao, MENSAGENS_ERRO } from '@/lib/erros';

/**
 * Checkout, etapa 1: conferencia — RF-CHK-01, RF-CHK-02, RF-CHK-08.
 *
 * Nao ha formulario aqui. O pedido nao guarda endereco de entrega, e o unico
 * dado que o checkout precisava pedir era justamente ele — o que sobra e
 * conferir o que esta sendo comprado e confirmar.
 *
 * A validacao do carrinho continua sendo o portao: preco que mudou desde que o
 * item entrou bloqueia o avanco ate a pessoa ver a diferenca (RF-CHK-08).
 */
export function PaginaCheckout() {
  const carrinho = useCarrinho();
  const validacao = useValidacaoDoCarrinho(carrinho.itens);
  const criarPedido = useCriarPedido();
  const navegar = useNavigate();

  // Carrinho vazio no acesso direto volta para o carrinho — docs/behavior.md 8.
  if (carrinho.itens.length === 0) return <Navigate to="/carrinho" replace />;

  const divergencias = validacao.data?.divergencias ?? [];
  const bloqueado = divergencias.length > 0 || validacao.isPending;

  function aoConfirmar() {
    criarPedido.mutate(
      {
        itens: carrinho.itens.map((item) => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
        })),
      },
      {
        onSuccess: (pedido) => {
          // O pedido nasce PENDENTE, e o pagamento referencia so o id dele.
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
          <CardContent className="space-y-4 pt-6">
            {erroAoCriar ? (
              <p
                role="alert"
                className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive"
              >
                {erroAoCriar}
              </p>
            ) : null}

            <h2 className="text-lg font-semibold">Confira seu pedido</h2>
            <p className="text-sm text-muted-foreground">
              Revise os itens ao lado. Ao confirmar, o pedido é criado e você segue para o
              pagamento.
            </p>

            <Button
              type="button"
              variante="acao"
              tamanho="grande"
              className="w-full"
              disabled={bloqueado || criarPedido.isPending}
              aria-busy={criarPedido.isPending}
              onClick={aoConfirmar}
            >
              {criarPedido.isPending ? 'Criando pedido...' : 'Ir para o pagamento'}
            </Button>
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
