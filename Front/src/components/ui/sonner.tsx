import { Toaster as Sonner } from 'sonner';
import { useTema } from '@/app/provedores/contexto-tema';

/**
 * Toast das acoes de carrinho e estoque. Anunciado por `aria-live="polite"`
 * pelo proprio sonner. Ver docs/behavior.md secao 13.3.
 */
export function Toaster() {
  const { temaEfetivo } = useTema();

  return (
    <Sonner
      theme={temaEfetivo}
      position="bottom-right"
      duration={4000}
      toastOptions={{
        classNames: {
          toast: 'rounded-lg border border-border bg-card text-card-foreground shadow-lg',
          description: 'text-muted-foreground',
        },
      }}
    />
  );
}
