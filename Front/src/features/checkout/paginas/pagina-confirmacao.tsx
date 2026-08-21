import { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { TituloDaPagina } from '@/components/titulo-da-pagina';
import { Dentinho } from '@/components/dentinho';
import { EstadoErro } from '@/components/estado-erro';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DetalhesDoPedido } from '@/features/checkout/componentes/detalhes-do-pedido';
import { IndicadorEtapas } from '@/features/checkout/componentes/indicador-etapas';
import { ResumoDoPagamento } from '@/features/checkout/componentes/resumo-do-pagamento';
import { usePedido } from '@/features/checkout/hooks/use-checkout';
import { useCarrinhoStore } from '@/lib/carrinho-store';
import { ErroDeAplicacao } from '@/lib/erros';

/**
 * Confirmação — RF-CHK-05, RF-CHK-07 e RF-CHK-13.
 *
 * **O carrinho é esvaziado somente aqui**, depois da aprovação confirmada pelo
 * servidor. Esvaziar antes deixaria o cliente sem carrinho e sem pedido caso o
 * pagamento fosse recusado.
 *
 * A tela é também o comprovante: o que está dentro de `comprovante` é o que sai
 * na impressão, e o resto da página é escondido pelo CSS de impressão.
 */
export function PaginaConfirmacao() {
  const { id = '' } = useParams();
  const pedido = usePedido(id);
  const esvaziar = useCarrinhoStore((estado) => estado.esvaziar);

  const aprovado = pedido.data?.status === 'PAGO';

  useEffect(() => {
    if (aprovado) esvaziar();
  }, [aprovado, esvaziar]);

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

  // Pedido que nao foi aprovado nao ganha tela de sucesso: mostra o estado real.
  if (!aprovado) return <Navigate to={`/pedidos/${id}`} replace />;

  return (
    <div className="space-y-6">
      <div className="nao-imprimir">
        <IndicadorEtapas atual={3} />
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="nao-imprimir">
            <Dentinho tamanho="grande" alt="" />
          </div>
          <TituloDaPagina tituloDocumento="Pedido confirmado">Pedido confirmado</TituloDaPagina>
          <p className="text-muted-foreground">Obrigado! Já estamos separando os seus itens.</p>
          <p className="rounded-md bg-accent px-4 py-2 text-lg font-bold text-accent-foreground">
            {pedido.data.numero}
          </p>
        </CardContent>
      </Card>

      <div className="nao-imprimir flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button
          variante="primario"
          onClick={() => {
            window.print();
          }}
        >
          <Printer aria-hidden="true" />
          Imprimir comprovante
        </Button>
        <Button variante="secundario" asChild>
          <Link to={`/pedidos/${pedido.data.id}`}>Acompanhar pedido</Link>
        </Button>
        <Button variante="fantasma" asChild>
          <Link to="/">Voltar ao catálogo</Link>
        </Button>
      </div>

      {/* O que sai no papel: comprovante completo, sem cromo de navegação. */}
      <Card>
        <CardContent className="space-y-6 pt-6" data-comprovante>
          <div className="hidden border-b border-border pb-4 print:block">
            <p className="text-lg font-bold">Você no Coração da Gente</p>
            <p className="text-sm text-muted-foreground">
              Comprovante do pedido {pedido.data.numero}
            </p>
          </div>

          <ResumoDoPagamento pedido={pedido.data} />
          <DetalhesDoPedido pedido={pedido.data} />

          <p className="hidden border-t border-border pt-4 text-xs text-muted-foreground print:block">
            Documento sem valor fiscal. Pagamento simulado para fins de demonstração.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
