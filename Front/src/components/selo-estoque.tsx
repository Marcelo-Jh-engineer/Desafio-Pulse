import { cn } from '@/lib/utils';
import {
  obterDisponibilidade,
  type DisponibilidadeProduto,
  type Produto,
} from '@/types/catalogo';

/**
 * Cor **mais** texto, nunca cor sozinha — RNF-A11Y-04 e docs/design.md 2.6.
 * Quem nao distingue verde de vermelho continua lendo o rotulo.
 */
const APARENCIA: Record<DisponibilidadeProduto, { rotulo: string; classe: string }> = {
  DISPONIVEL: {
    rotulo: 'Disponível',
    classe: 'bg-sucesso/10 text-sucesso ring-1 ring-inset ring-sucesso/30',
  },
  ULTIMAS_UNIDADES: {
    rotulo: 'Últimas unidades',
    classe: 'bg-alerta/10 text-alerta ring-1 ring-inset ring-alerta/30',
  },
  INDISPONIVEL: {
    rotulo: 'Indisponível',
    classe: 'bg-muted text-muted-foreground ring-1 ring-inset ring-border',
  },
};

interface PropriedadesSeloEstoque {
  produto: Produto;
  className?: string;
}

export function SeloEstoque({ produto, className }: PropriedadesSeloEstoque) {
  const { rotulo, classe } = APARENCIA[obterDisponibilidade(produto)];

  return (
    <span
      className={cn(
        'inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium',
        classe,
        className,
      )}
    >
      {rotulo}
    </span>
  );
}
