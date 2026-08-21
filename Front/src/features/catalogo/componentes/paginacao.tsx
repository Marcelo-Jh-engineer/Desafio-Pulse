import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PropriedadesPaginacao {
  /** Indice base 0. */
  pagina: number;
  totalPaginas: number;
  aoMudarPagina: (pagina: number) => void;
}

/** Janela deslizante: no maximo 5 numeros, com a atual no meio quando da. */
function calcularJanela(pagina: number, totalPaginas: number): number[] {
  const maximo = Math.min(5, totalPaginas);
  const inicio = Math.max(0, Math.min(pagina - Math.floor(maximo / 2), totalPaginas - maximo));
  return Array.from({ length: maximo }, (_, indice) => inicio + indice);
}

/**
 * RF-CAT-04. Preserva filtro, busca e ordenacao porque tudo isso vive na URL e
 * so a chave `pagina` muda — docs/behavior.md secao 3.
 */
export function Paginacao({ pagina, totalPaginas, aoMudarPagina }: PropriedadesPaginacao) {
  if (totalPaginas <= 1) return null;

  return (
    <nav aria-label="Paginação" className="flex items-center justify-center gap-1 pt-4">
      <Button
        variante="fantasma"
        tamanho="icone"
        disabled={pagina === 0}
        aria-label="Página anterior"
        onClick={() => {
          aoMudarPagina(pagina - 1);
        }}
      >
        <ChevronLeft aria-hidden="true" />
      </Button>

      {calcularJanela(pagina, totalPaginas).map((numero) => {
        const atual = numero === pagina;
        return (
          <Button
            key={numero}
            variante={atual ? 'primario' : 'fantasma'}
            tamanho="icone"
            aria-label={`Página ${numero + 1}`}
            aria-current={atual ? 'page' : undefined}
            className={cn('numeros-tabulares', atual && 'pointer-events-none')}
            onClick={() => {
              aoMudarPagina(numero);
            }}
          >
            {numero + 1}
          </Button>
        );
      })}

      <Button
        variante="fantasma"
        tamanho="icone"
        disabled={pagina >= totalPaginas - 1}
        aria-label="Próxima página"
        onClick={() => {
          aoMudarPagina(pagina + 1);
        }}
      >
        <ChevronRight aria-hidden="true" />
      </Button>
    </nav>
  );
}
