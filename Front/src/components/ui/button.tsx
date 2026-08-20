import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import type { VariantProps } from 'class-variance-authority';
import { variantesBotao } from '@/components/ui/button-variantes';
import { cn } from '@/lib/utils';

export interface PropriedadesBotao
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof variantesBotao> {
  /** Renderiza o filho no lugar do `button` — util para `Link` do React Router. */
  asChild?: boolean;
}

export function Button({
  className,
  variante,
  tamanho,
  asChild = false,
  ...props
}: PropriedadesBotao) {
  const Componente = asChild ? Slot : 'button';
  return (
    <Componente className={cn(variantesBotao({ variante, tamanho }), className)} {...props} />
  );
}
