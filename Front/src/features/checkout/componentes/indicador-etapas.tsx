import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const ETAPAS = ['Pagamento', 'Confirmação'] as const;

/** `aria-current="step"` marca onde o usuario esta — docs/behavior.md secao 8. */
export function IndicadorEtapas({ atual }: { atual: 1 | 2 }) {
  return (
    <nav aria-label="Etapas do checkout">
      <ol className="flex items-center gap-2">
        {ETAPAS.map((rotulo, indice) => {
          const numero = indice + 1;
          const concluida = numero < atual;
          const ehAtual = numero === atual;

          return (
            <li key={rotulo} className="flex items-center gap-2">
              <span
                aria-current={ehAtual ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium',
                  ehAtual && 'bg-primary text-primary-foreground',
                  concluida && 'text-sucesso',
                  !ehAtual && !concluida && 'text-muted-foreground',
                )}
              >
                <span
                  className={cn(
                    'numeros-tabulares flex size-5 items-center justify-center rounded-full text-xs',
                    ehAtual && 'bg-primary-foreground text-primary',
                    concluida && 'bg-sucesso text-sucesso-foreground',
                    !ehAtual && !concluida && 'border border-current',
                  )}
                >
                  {concluida ? <Check aria-hidden="true" className="size-3" /> : numero}
                </span>
                {rotulo}
              </span>
              {numero < ETAPAS.length ? (
                <span aria-hidden="true" className="h-px w-4 bg-border sm:w-8" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
