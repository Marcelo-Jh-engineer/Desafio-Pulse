import { Skeleton } from '@/components/ui/skeleton';

/** Mesma proporcao da imagem real e blocos com a altura do texto final. */
export function EsqueletoProduto() {
  return (
    <div aria-busy="true" aria-label="Carregando produto" className="space-y-6">
      <Skeleton className="h-5 w-64" />
      <div className="grid gap-8 md:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-6 w-32 rounded-full" />
          <div className="space-y-2 pt-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
}
