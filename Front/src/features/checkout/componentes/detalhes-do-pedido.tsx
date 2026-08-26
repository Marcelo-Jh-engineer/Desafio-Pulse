import { Preco } from '@/components/preco';
import { Separator } from '@/components/ui/separator';
import type { Pedido } from '@/types/pedido';

/** Itens e total congelados no momento em que o carrinho virou pedido. */
export function DetalhesDoPedido({ pedido }: { pedido: Pedido }) {
  return (
    <section aria-labelledby="titulo-itens" className="space-y-3">
      <h2 id="titulo-itens" className="text-xl font-semibold">
        Itens
      </h2>
      <ul className="space-y-2">
        {pedido.itens.map((item) => (
          <li key={item.produtoId} className="flex justify-between gap-3 text-sm">
            <span className="min-w-0">
              {item.quantidade}× {item.nome}
            </span>
            <Preco centavos={item.totalLinhaEmCentavos} className="shrink-0 text-sm" />
          </li>
        ))}
      </ul>

      <Separator />

      <dl className="space-y-1 text-sm">
        <div className="flex items-baseline justify-between">
          <dt className="font-semibold">Total</dt>
          <dd>
            <Preco centavos={pedido.totalEmCentavos} className="text-xl" />
          </dd>
        </div>
      </dl>
    </section>
  );
}
