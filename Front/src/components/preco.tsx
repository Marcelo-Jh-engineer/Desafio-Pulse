import { formatarPreco } from '@/lib/formato';
import { ROTULO_UNIDADE } from '@/types/dominio';
import type { Unidade } from '@/types/dominio';
import { cn } from '@/lib/utils';

interface PropriedadesPreco {
  centavos: number;
  /** Quando informada, exibe "por quilo", "por unidade" ao lado do valor. */
  unidade?: Unidade;
  className?: string;
}

/** Leitor de tela ouve "19 reais e 90 centavos", nao "R cifrao 19 virgula 90". */
function porExtenso(centavos: number, unidade?: Unidade): string {
  const reais = Math.floor(centavos / 100);
  const resto = centavos % 100;
  const partes = [`${reais} ${reais === 1 ? 'real' : 'reais'}`];
  if (resto > 0) partes.push(`e ${resto} centavos`);
  if (unidade) partes.push(`por ${ROTULO_UNIDADE[unidade]}`);
  return partes.join(' ');
}

/**
 * Dinheiro e sempre inteiro em centavos no modelo; a conversao acontece so aqui.
 * Numeros tabulares para as colunas nao dancarem ao trocar de digito.
 */
export function Preco({ centavos, unidade, className }: PropriedadesPreco) {
  return (
    <span className={cn('numeros-tabulares font-bold', className)}>
      <span aria-hidden="true">
        {formatarPreco(centavos)}
        {unidade ? (
          <span className="ml-1 text-xs font-medium text-muted-foreground">
            /{unidade.toLowerCase()}
          </span>
        ) : null}
      </span>
      <span className="sr-only">{porExtenso(centavos, unidade)}</span>
    </span>
  );
}
