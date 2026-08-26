import { Link, Navigate, useParams } from 'react-router-dom';
import { Clock, CreditCard, XCircle } from 'lucide-react';
import { TituloDaPagina } from '@/components/titulo-da-pagina';
import { EstadoErro } from '@/components/estado-erro';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DetalhesDoPedido } from '@/features/checkout/componentes/detalhes-do-pedido';
import { usePagamentos, usePedido } from '@/features/checkout/hooks/use-checkout';
import { ErroDeAplicacao } from '@/lib/erros';
import { ROTULO_METODO_PAGAMENTO } from '@/types/dominio';

/** Acompanha pedido e tentativa de pagamento enquanto o consumidor processa a fila. */
export function PaginaStatusPedido() {
  const { id = '' } = useParams();
  const pagamentos = usePagamentos(id, true);
  const statusDaTentativa = pagamentos.data?.[0]?.status;
  const acompanharPedido =
    statusDaTentativa === 'PENDENTE' ||
    statusDaTentativa === 'AGUARDANDO' ||
    statusDaTentativa === 'APROVADO';
  const pedido = usePedido(id, acompanharPedido);

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

  const tentativa = pagamentos.data?.[0];
  const recusado = tentativa?.status === 'RECUSADO';
  const processando =
    tentativa?.status === 'PENDENTE' ||
    tentativa?.status === 'AGUARDANDO' ||
    tentativa?.status === 'APROVADO';

  let titulo = 'Pedido aguardando pagamento';
  let classe = 'text-alerta';
  let Icone = CreditCard;

  if (pedido.data.status === 'CANCELADO') {
    titulo = 'Pedido cancelado';
    classe = 'text-muted-foreground';
    Icone = XCircle;
  } else if (pedido.data.status === 'FALHOU' || recusado) {
    titulo = 'Pagamento recusado';
    classe = 'text-destructive';
    Icone = XCircle;
  } else if (processando) {
    titulo = 'Pagamento em processamento';
    classe = 'text-alerta';
    Icone = Clock;
  }

  const motivo = tentativa?.motivoRecusa ?? pedido.data.motivoRecusa;
  const atualizando = pedido.isFetching || pagamentos.isFetching;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <TituloDaPagina tituloDocumento={`Pedido ${pedido.data.id}`}>
          Pedido {pedido.data.id}
        </TituloDaPagina>
        <p className={`flex items-center gap-2 font-medium ${classe}`}>
          <Icone aria-hidden="true" className="size-5 shrink-0" />
          {titulo}
        </p>
        {tentativa ? (
          <p className="text-sm text-muted-foreground">
            {ROTULO_METODO_PAGAMENTO[tentativa.metodo]} · tentativa {tentativa.id}
          </p>
        ) : null}
        {motivo ? <p className="text-sm text-muted-foreground">Motivo: {motivo}</p> : null}
        {processando ? (
          <p role="status" className="text-sm text-muted-foreground">
            Esta página é atualizada automaticamente enquanto o pagamento está na fila.
          </p>
        ) : null}
        {pagamentos.isError ? (
          <p role="alert" className="text-sm text-destructive">
            Não foi possível consultar as tentativas de pagamento.
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        {pedido.data.status === 'PENDENTE' && !processando ? (
          <Button variante="acao" asChild>
            <Link to={`/checkout/pagamento?pedido=${pedido.data.id}`}>
              {recusado ? 'Tentar pagar novamente' : 'Escolher pagamento'}
            </Link>
          </Button>
        ) : null}

        {pedido.data.status === 'PENDENTE' && processando ? (
          <Button
            variante="secundario"
            onClick={() => {
              void Promise.all([pedido.refetch(), pagamentos.refetch()]);
            }}
            disabled={atualizando}
            aria-busy={atualizando}
          >
            {atualizando ? 'Atualizando...' : 'Atualizar agora'}
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
