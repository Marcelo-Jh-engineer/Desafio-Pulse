import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useValorAdiado } from '@/hooks/use-valor-adiado';
import { cn } from '@/lib/utils';

interface PropriedadesCampoBusca {
  /** Valor vindo da URL, que e a fonte de verdade. */
  valorInicial: string;
  aoBuscar: (termo: string) => void;
}

/**
 * RF-CAT-09. O campo mantem um rascunho local so para nao perder tecla enquanto
 * o atraso de 300 ms corre; quem manda continua sendo a URL.
 */
export function CampoBusca({ valorInicial, aoBuscar }: PropriedadesCampoBusca) {
  const [rascunho, definirRascunho] = useState(valorInicial);
  const [valorSincronizado, definirValorSincronizado] = useState(valorInicial);
  const adiado = useValorAdiado(rascunho, 300);

  // A URL mudou por fora (botao voltar, limpar filtro): o campo acompanha.
  // Ajuste durante o render, nao em efeito — assim o React reaproveita o mesmo
  // render em vez de pintar o valor velho e corrigir depois.
  if (valorInicial !== valorSincronizado) {
    definirValorSincronizado(valorInicial);
    definirRascunho(valorInicial);
  }

  // A propria URL e a guarda contra reenvio: se o termo adiado ja e o que esta
  // na query string, nao ha o que fazer.
  useEffect(() => {
    const termo = adiado.trim();
    if (termo === valorInicial.trim()) return;
    aoBuscar(termo);
  }, [adiado, valorInicial, aoBuscar]);

  return (
    <div className="relative w-full sm:max-w-xs">
      <label htmlFor="busca-catalogo" className="mb-2 block text-sm font-medium">
        Buscar produto
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute bottom-2.5 left-3 size-4 text-muted-foreground"
      />
      <input
        id="busca-catalogo"
        type="search"
        value={rascunho}
        placeholder="Arroz, banana, detergente..."
        onChange={(evento) => {
          definirRascunho(evento.target.value);
        }}
        className={cn(
          'h-10 w-full rounded-md border border-input bg-card pl-9 pr-9 text-sm',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        )}
      />
      {rascunho ? (
        <button
          type="button"
          aria-label="Limpar busca"
          onClick={() => {
            definirRascunho('');
          }}
          className="absolute bottom-1 right-1 cursor-pointer rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
