import { useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router-dom';
import { TituloDaPagina } from '@/components/titulo-da-pagina';
import { Preco } from '@/components/preco';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AvisoDivergencias } from '@/features/checkout/componentes/aviso-divergencias';
import { IndicadorEtapas } from '@/features/checkout/componentes/indicador-etapas';
import { useCriarPedido } from '@/features/checkout/hooks/use-checkout';
import { useCarrinho } from '@/hooks/use-carrinho';
import { chavesQuery } from '@/lib/chaves-query';
import { ErroDeAplicacao, MENSAGENS_ERRO } from '@/lib/erros';
import type { DivergenciaCarrinho } from '@/types/pedido';

/** Checkout: o servidor transforma o carrinho aberto no pedido. */
export function PaginaCheckout() {
  const { carrinho, isPending } = useCarrinho();
  const criarPedido = useCriarPedido();
  const clienteQuery = useQueryClient();
  const navegar = useNavigate();
  const chaveIdempotencia = useRef(crypto.randomUUID());

  if (isPending) return <Skeleton className="h-96 w-full" />;
  if (carrinho.itens.length === 0) return <Navigate to="/carrinho" replace />;

  const divergencias: DivergenciaCarrinho[] = carrinho.itens.flatMap((item) => {
    const encontradas: DivergenciaCarrinho[] = [];

    if (item.precoDivergiu) {
      encontradas.push({
        produtoId: item.produtoId,
        nome: item.nome,
        tipo: 'PRECO_ALTERADO',
        precoAnteriorEmCentavos: item.precoEmCentavos,
      });
    }

    if (item.estoqueDisponivel < item.quantidade) {
      encontradas.push({
        produtoId: item.produtoId,
        nome: item.nome,
        tipo: 'ESTOQUE_INSUFICIENTE',
        quantidadeSolicitada: item.quantidade,
        quantidadeDisponivel: item.estoqueDisponivel,
      });
    }

    return encontradas;
  });

  function aoConfirmar() {
    if (criarPedido.isPending || divergencias.length > 0) return;

    criarPedido.mutate(chaveIdempotencia.current, {
      onSuccess: (pedido) => {
        void clienteQuery.invalidateQueries({ queryKey: chavesQuery.carrinho.atual() });
        void navegar(`/checkout/pagamento?pedido=${encodeURIComponent(pedido.id)}`);
      },
    });
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

      <AvisoDivergencias
        divergencias={divergencias}
        aoAjustar={() => {
          void navegar('/carrinho');
        }}
      />

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
              O pedido será criado a partir deste carrinho. O servidor fará a validação final de
              disponibilidade antes de confirmar.
            </p>

            <Button
              type="button"
              variante="acao"
              tamanho="grande"
              className="w-full"
              disabled={divergencias.length > 0 || criarPedido.isPending}
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
