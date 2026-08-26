import { CreditCard, QrCode } from 'lucide-react';
import { Preco } from '@/components/preco';
import { ROTULO_METODO_PAGAMENTO } from '@/types/dominio';
import type { Pagamento } from '@/types/pedido';

export function ResumoDoPagamento({ pagamento }: { pagamento: Pagamento | undefined }) {
  if (!pagamento) return null;

  const Icone = pagamento.metodo === 'PIX' ? QrCode : CreditCard;

  return (
    <section aria-labelledby="titulo-pagamento" className="space-y-3">
      <h2 id="titulo-pagamento" className="text-xl font-semibold">
        Pagamento
      </h2>

      <dl className="space-y-1 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Forma</dt>
          <dd className="flex items-center gap-1.5 font-medium">
            <Icone aria-hidden="true" className="size-4" />
            {ROTULO_METODO_PAGAMENTO[pagamento.metodo]}
          </dd>
        </div>

        {pagamento.processadoEm ? (
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Data</dt>
            <dd>{new Date(pagamento.processadoEm).toLocaleString('pt-BR')}</dd>
          </div>
        ) : null}

        <div className="flex items-baseline justify-between gap-2 pt-2">
          <dt className="font-semibold">Valor pago</dt>
          <dd>
            <Preco centavos={pagamento.valorEmCentavos} className="text-xl" />
          </dd>
        </div>
      </dl>
    </section>
  );
}
