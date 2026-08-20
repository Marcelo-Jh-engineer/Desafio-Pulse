import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Carregamento de lista usa skeleton com a forma do conteudo, nunca spinner.
 * Ver docs/design.md secao 9.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}
