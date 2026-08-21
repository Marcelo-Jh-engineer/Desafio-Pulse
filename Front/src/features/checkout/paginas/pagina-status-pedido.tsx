import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { TituloDaPagina } from '@/components/titulo-da-pagina';
import { EstadoErro } from '@/components/estado-erro';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DetalhesDoPedido } from '@/features/checkout/componentes/detalhes-do-pedido';
import { usePedido } from '@/features/checkout/hooks/use-checkout';
import { ErroDeAplicacao } from '@/lib/erros';
import type { StatusPedido } from '@/types/dominio';

/** Cada estado dito por extenso, nao so por cor — RF-PED-02. */
const APARENCIA: Record<StatusPedido, { titulo: string; classe: string; icone: typeof Clock }> = {
  PENDENTE: {
    titulo: 'Aguardando confirmação do pagamento',
    classe: 'text-alerta',
    icone: Clock,
  },
  PAGO: { titulo: 'Pagamento aprovado', classe: 'text-sucesso', icone: CheckCircle2 },
  FALHOU: { titulo: 'Pagamento recusado', classe: 'text-destructive', icone: XCircle },
  CANCELADO: { titulo: 'Pedido cancelado', classe: 'text-muted-foreground', icone: XCircle },
};

/**
 * Status do pedido — RF-PED-01 a RF-PED-04.
 *
 * Separada da confirmacao de proposito: a confirmacao e o desfecho imediato da
 * compra, esta e a tela que o cliente reabre depois, pelo link.
 */
export function PaginaStatusPedido() {
  const { id = '' } = useParams();
  const pedido = usePedido(id);

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

  const { titulo, classe, icone: Icone } = APARENCIA[pedido.data.status];
  const dataDoPagamento = pedido.data.pagoEm
    ? new Date(pedido.data.pagoEm).toLocaleString('pt-BR')
    : null;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <TituloDaPagina tituloDocumento={`Pedido ${pedido.data.numero}`}>
          Pedido {pedido.data.numero}
        </TituloDaPagina>
        <p className={`flex items-center gap-2 font-medium ${classe}`}>
          <Icone aria-hidden="true" className="size-5 shrink-0" />
          {titulo}
        </p>
        {dataDoPagamento ? (
          <p className="text-sm text-muted-foreground">Pago em {dataDoPagamento}</p>
        ) : null}
        {pedido.data.motivoRecusa ? (
          <p className="text-sm text-muted-foreground">Motivo: {pedido.data.motivoRecusa}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        {pedido.data.status === 'FALHOU' ? (
          // Nova tentativa reabre o pagamento com o **mesmo** pedido: nao
          // recria carrinho nem duplica o registro (RF-PED-04).
          <Button variante="acao" asChild>
            <Link to={`/checkout/pagamento?pedido=${pedido.data.id}`}>Tentar pagar de novo</Link>
          </Button>
        ) : null}

        {pedido.data.status === 'PENDENTE' ? (
          <Button
            variante="secundario"
            onClick={() => {
              void pedido.refetch();
            }}
            disabled={pedido.isFetching}
            aria-busy={pedido.isFetching}
          >
            {pedido.isFetching ? 'Atualizando...' : 'Atualizar'}
          </Button>
        ) : null}

        <Button variante="fantasma" asChild>
          <Link to="/">Voltar ao catálogo</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DetalhesDoPedido pedido={pedido.data} />
        </CardContent>
      </Card>
    </div>
  );
}
