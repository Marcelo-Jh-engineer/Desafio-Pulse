import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TAMANHO_PAGINA } from '@/features/catalogo/hooks/use-parametros-catalogo';

/**
 * Skeleton com a forma do cartao e na mesma quantidade da pagina, nunca spinner
 * — docs/design.md secao 9. A grade ja nasce com a altura final, entao a
 * chegada dos dados nao empurra a pagina (CLS de RNF-PERF-01).
 */
export function EsqueletoGrade({ quantidade = TAMANHO_PAGINA }: { quantidade?: number }) {
  return (
    <ul
      aria-busy="true"
      aria-label="Carregando produtos"
      className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
    >
      {Array.from({ length: quantidade }, (_, indice) => (
        <li key={indice}>
          <Card className="h-full overflow-hidden">
            <Skeleton className="aspect-square w-full rounded-none" />
            <CardContent className="space-y-2 p-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
