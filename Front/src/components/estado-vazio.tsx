import type { ReactNode } from 'react';
import { Dentinho, type TamanhoDentinho } from '@/components/dentinho';

interface PropriedadesEstadoVazio {
  titulo: string;
  descricao?: string;
  /** Acao de recuperacao: limpar filtro, ir ao catalogo, tentar de novo. */
  acao?: ReactNode;
  tamanhoMascote?: TamanhoDentinho;
}

/**
 * Vazio, 404 e 403 — momentos em que a interface seria fria.
 * O mascote **ilustra**, nunca informa sozinho: o texto sempre acompanha.
 * Ver docs/design.md secao 7.3.
 */
export function EstadoVazio({
  titulo,
  descricao,
  acao,
  tamanhoMascote = 'medio',
}: PropriedadesEstadoVazio) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <Dentinho tamanho={tamanhoMascote} />
      <h2 className="text-xl font-semibold">{titulo}</h2>
      {descricao ? <p className="max-w-prose text-muted-foreground">{descricao}</p> : null}
      {acao ? <div className="pt-2">{acao}</div> : null}
    </div>
  );
}
