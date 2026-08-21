import { ROTULO_ORDENACAO } from '@/features/catalogo/hooks/use-parametros-catalogo';
import type { OrdenacaoCatalogo } from '@/types/api-parametros';
import { cn } from '@/lib/utils';

interface PropriedadesSeletorOrdenacao {
  valor: OrdenacaoCatalogo;
  aoOrdenar: (ordenacao: OrdenacaoCatalogo) => void;
}

/**
 * RF-CAT-10. `select` nativo de proposito: no celular abre o seletor do proprio
 * sistema, ja e navegavel por teclado e nao custa nenhuma dependencia nova.
 */
export function SeletorOrdenacao({ valor, aoOrdenar }: PropriedadesSeletorOrdenacao) {
  return (
    <div className="w-full sm:w-auto">
      <label htmlFor="ordenacao-catalogo" className="mb-2 block text-sm font-medium">
        Ordenar por
      </label>
      <select
        id="ordenacao-catalogo"
        value={valor}
        onChange={(evento) => {
          aoOrdenar(evento.target.value as OrdenacaoCatalogo);
        }}
        className={cn(
          'h-10 w-full cursor-pointer rounded-md border border-input bg-card px-3 text-sm sm:w-48',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        )}
      >
        {Object.entries(ROTULO_ORDENACAO).map(([chave, rotulo]) => (
          <option key={chave} value={chave}>
            {rotulo}
          </option>
        ))}
      </select>
    </div>
  );
}
