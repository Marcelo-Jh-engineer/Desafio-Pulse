import type { ReactNode } from 'react';

interface PropriedadesCampoFormulario {
  id: string;
  rotulo: string;
  /** Texto de apoio, exibido **antes** do erro e não no lugar dele. */
  ajuda?: string;
  erro?: string | undefined;
  children: ReactNode;
}

/** Rotulo, ajuda e erro amarrados ao campo — RNF-A11Y-06. */
export function CampoFormulario({
  id,
  rotulo,
  ajuda,
  erro,
  children,
}: PropriedadesCampoFormulario) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {rotulo}
      </label>
      {ajuda ? (
        <p id={`${id}-ajuda`} className="text-xs text-muted-foreground">
          {ajuda}
        </p>
      ) : null}
      {children}
      {erro ? (
        <p id={`${id}-erro`} className="text-sm font-medium text-destructive">
          {erro}
        </p>
      ) : null}
    </div>
  );
}
