import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface Passo {
  rotulo: string;
  para?: string;
}

/**
 * Trilha "Catálogo › categoria › produto" — docs/behavior.md secao 4. A
 * categoria leva ao catalogo **ja filtrado**, o que reaproveita o estado na URL.
 */
export function TrilhaNavegacao({ passos }: { passos: Passo[] }) {
  return (
    <nav aria-label="Trilha de navegação">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {passos.map((passo, indice) => {
          const ultimo = indice === passos.length - 1;
          return (
            <li key={passo.rotulo} className="flex items-center gap-1">
              {passo.para && !ultimo ? (
                <Link
                  to={passo.para}
                  className="rounded-sm hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {passo.rotulo}
                </Link>
              ) : (
                <span aria-current={ultimo ? 'page' : undefined} className="text-foreground">
                  {passo.rotulo}
                </span>
              )}
              {!ultimo ? <ChevronRight aria-hidden="true" className="size-4" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
