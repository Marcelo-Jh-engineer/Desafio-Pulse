import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useTituloDaPagina } from '@/hooks/use-titulo-da-pagina';

interface PropriedadesTituloDaPagina {
  children: ReactNode;
  /** Usado no titulo do documento. Cai para o texto do `children` quando ausente. */
  tituloDocumento?: string;
  className?: string;
}

/**
 * `h1` da tela. Recebe o foco a cada mudanca de rota e sincroniza o titulo do
 * documento — docs/behavior.md secao 13.1.
 */
export function TituloDaPagina({
  children,
  tituloDocumento,
  className,
}: PropriedadesTituloDaPagina) {
  const referencia = useRef<HTMLHeadingElement>(null);

  useTituloDaPagina(tituloDocumento ?? (typeof children === 'string' ? children : undefined));

  useEffect(() => {
    referencia.current?.focus();
  }, []);

  return (
    <h1
      ref={referencia}
      tabIndex={-1}
      className={cn('text-3xl font-bold leading-tight focus:outline-none', className)}
    >
      {children}
    </h1>
  );
}
