import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Campo de texto base. `aria-invalid` pinta a borda de erro sozinho, entao o
 * formulario nunca precisa passar classe de estado — docs/design.md secao 8.3.
 */
export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  function Input({ className, type = 'text', ...props }, referencia) {
    return (
      <input
        ref={referencia}
        type={type}
        className={cn(
          'h-10 w-full rounded-md border border-input bg-card px-3 text-base sm:text-sm',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive',
          className,
        )}
        {...props}
      />
    );
  },
);
