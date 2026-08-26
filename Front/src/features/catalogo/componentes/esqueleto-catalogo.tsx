import { Skeleton } from '@/components/ui/skeleton';
import { EsqueletoGrade } from '@/features/catalogo/componentes/esqueleto-grade';

/** Estado inicial completo da home, com as mesmas proporcoes do catalogo. */
export function EsqueletoCatalogo() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Carregando catálogo">
      <div className="space-y-2" aria-hidden="true">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>

      <section className="space-y-4" aria-hidden="true">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }, (_, indice) => (
              <Skeleton key={indice} className="h-10 w-28 rounded-full" />
            ))}
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
      </section>

      <div className="space-y-4">
        <Skeleton className="h-4 w-40" />
        <EsqueletoGrade />
      </div>
    </div>
  );
}
