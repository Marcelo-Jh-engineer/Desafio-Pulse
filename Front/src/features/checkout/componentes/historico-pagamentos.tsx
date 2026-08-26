import { useState } from 'react';
import { ChevronDown, CreditCard } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { usePagamentos } from '@/features/checkout/hooks/use-checkout';
import { formatarPreco } from '@/lib/formato';
import { cn } from '@/lib/utils';
import { ROTULO_METODO_PAGAMENTO, type StatusPagamento } from '@/types/dominio';

const ROTULO_STATUS: Record<StatusPagamento, string> = {
  PENDENTE: 'Pendente',
  AGUARDANDO: 'Aguardando',
  APROVADO: 'Aprovado',
  RECUSADO: 'Recusado',
};

const CLASSE_STATUS: Record<StatusPagamento, string> = {
  PENDENTE: 'bg-alerta/15 text-alerta',
  AGUARDANDO: 'bg-alerta/15 text-alerta',
  APROVADO: 'bg-sucesso/15 text-sucesso',
  RECUSADO: 'bg-destructive/10 text-destructive',
};

function formatarDataHora(data: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(data));
}

export function HistoricoPagamentos({ pedidoId }: { pedidoId: string }) {
  const [aberto, definirAberto] = useState(false);
  const pagamentos = usePagamentos(pedidoId, false, aberto);

  return (
    <details
      className="group border-t"
      onToggle={(evento) => {
        definirAberto(evento.currentTarget.open);
      }}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-b-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
        <span className="flex items-center gap-2">
          <CreditCard aria-hidden="true" className="size-4 text-muted-foreground" />
          Ver pagamentos
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
        />
      </summary>

      <div className="space-y-3 px-4 pb-4">
        {pagamentos.isPending ? (
          <div className="space-y-2" aria-label="Carregando pagamentos">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : null}

        {pagamentos.isError ? (
          <div role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <p>Não foi possível carregar os pagamentos.</p>
            <button
              type="button"
              className="mt-1 font-semibold underline underline-offset-4"
              onClick={() => {
                void pagamentos.refetch();
              }}
            >
              Tentar novamente
            </button>
          </div>
        ) : null}

        {pagamentos.data?.length === 0 ? (
          <p className="rounded-md bg-muted/60 p-3 text-sm text-muted-foreground">
            Ainda não há nenhuma tentativa de pagamento para este pedido.
          </p>
        ) : null}

        {pagamentos.data?.map((pagamento) => (
          <article
            key={pagamento.id}
            className="grid gap-2 rounded-md border p-3 text-sm sm:grid-cols-[1fr_auto] sm:items-start"
          >
            <div className="min-w-0">
              <p className="font-semibold">{ROTULO_METODO_PAGAMENTO[pagamento.metodo]}</p>
              <p className="text-muted-foreground">
                Solicitado em {formatarDataHora(pagamento.criadoEm)}
              </p>
              {pagamento.processadoEm ? (
                <p className="text-muted-foreground">
                  Processado em {formatarDataHora(pagamento.processadoEm)}
                </p>
              ) : null}
              {pagamento.motivoRecusa ? (
                <p className="mt-1 text-destructive">Motivo: {pagamento.motivoRecusa}</p>
              ) : null}
              <p
                className="mt-1 truncate font-mono text-xs text-muted-foreground"
                title={pagamento.id}
              >
                {pagamento.id}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-semibold',
                  CLASSE_STATUS[pagamento.status],
                )}
              >
                {ROTULO_STATUS[pagamento.status]}
              </span>
              <span className="numeros-tabulares font-semibold">
                {formatarPreco(pagamento.valorEmCentavos)}
              </span>
            </div>
          </article>
        ))}
      </div>
    </details>
  );
}
