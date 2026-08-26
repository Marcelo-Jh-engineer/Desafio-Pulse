import { Link } from 'react-router-dom';
import { CalendarDays, PackageOpen } from 'lucide-react';
import { Preco } from '@/components/preco';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { HistoricoPagamentos } from '@/features/checkout/componentes/historico-pagamentos';
import { cn } from '@/lib/utils';
import type { StatusPedido } from '@/types/dominio';
import type { Pedido } from '@/types/pedido';

const ROTULO_STATUS: Record<StatusPedido, string> = {
  PENDENTE: 'Aguardando pagamento',
  PAGO: 'Pago',
  FALHOU: 'Pagamento falhou',
  CANCELADO: 'Cancelado',
};

const CLASSE_STATUS: Record<StatusPedido, string> = {
  PENDENTE: 'bg-alerta/15 text-alerta',
  PAGO: 'bg-sucesso/15 text-sucesso',
  FALHOU: 'bg-destructive/10 text-destructive',
  CANCELADO: 'bg-muted text-muted-foreground',
};

function formatarDataHora(data: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(data));
}

export function CartaoPedido({ pedido }: { pedido: Pedido }) {
  const quantidadeDeItens = pedido.itens.reduce((total, item) => total + item.quantidade, 0);
  const nomesDosItens = pedido.itens.map((item) => item.nome).join(', ');

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Pedido
          </p>
          <h2 className="break-all font-mono text-sm font-semibold sm:text-base">{pedido.id}</h2>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays aria-hidden="true" className="size-4 shrink-0" />
            {formatarDataHora(pedido.criadoEm)}
          </p>
        </div>
        <span
          className={cn(
            'w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold',
            CLASSE_STATUS[pedido.status],
          )}
        >
          {ROTULO_STATUS[pedido.status]}
        </span>
      </CardHeader>

      <CardContent className="grid gap-4 border-t pt-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-medium">
            <PackageOpen aria-hidden="true" className="size-4 text-muted-foreground" />
            {quantidadeDeItens} {quantidadeDeItens === 1 ? 'item' : 'itens'}
          </p>
          <p className="mt-1 truncate text-sm text-muted-foreground" title={nomesDosItens}>
            {nomesDosItens}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs text-muted-foreground">Total</p>
          <Preco centavos={pedido.totalEmCentavos} className="text-lg" />
        </div>
      </CardContent>

      <CardFooter className="flex-col items-stretch gap-2 border-t pt-4 sm:flex-row sm:items-center">
        <Button
          variante={pedido.status === 'PENDENTE' ? 'acao' : 'secundario'}
          tamanho="pequeno"
          asChild
        >
          <Link to={`/pedidos/${pedido.id}`}>
            {pedido.status === 'PENDENTE' ? 'Acompanhar ou pagar' : 'Ver detalhes'}
          </Link>
        </Button>
      </CardFooter>

      <HistoricoPagamentos pedidoId={pedido.id} />
    </Card>
  );
}
