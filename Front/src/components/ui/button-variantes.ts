import { cva } from 'class-variance-authority';

/**
 * Variantes conforme docs/design.md secao 8.4. Os nomes sao de dominio, entao
 * ficam em portugues. `acao` e o turquesa de conversao — **uma por vista**.
 */
export const variantesBotao = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variante: {
        acao: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-marca-turquesa-400',
        primario: 'bg-primary text-primary-foreground shadow-sm hover:bg-marca-azul-800',
        secundario: 'border border-primary bg-transparent text-primary hover:bg-accent',
        fantasma: 'bg-transparent text-primary hover:bg-accent',
        destrutivo:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      tamanho: {
        padrao: 'h-10 px-4 py-2',
        pequeno: 'h-8 rounded-sm px-3 text-xs',
        grande: 'h-12 rounded-md px-8 text-base',
        icone: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variante: 'primario',
      tamanho: 'padrao',
    },
  },
);
