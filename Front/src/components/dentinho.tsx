import dentinho from '@/assets/dentinho.png';
import { cn } from '@/lib/utils';

/** Tamanhos de docs/design.md secao 7.2. Minimo de 32 px — abaixo disso vira ruido. */
const TAMANHOS = {
  marca: 32,
  pequeno: 128,
  medio: 160,
  grande: 200,
} as const;

export type TamanhoDentinho = keyof typeof TAMANHOS;

interface PropriedadesDentinho {
  tamanho?: TamanhoDentinho;
  /**
   * Texto alternativo. Deixe vazio quando o mascote apenas acompanha um texto
   * que ja diz tudo — nesse caso a imagem e decorativa.
   */
  alt?: string;
  className?: string;
}

export function Dentinho({ tamanho = 'medio', alt = '', className }: PropriedadesDentinho) {
  const lado = TAMANHOS[tamanho];

  return (
    <img
      src={dentinho}
      alt={alt}
      width={lado}
      height={lado}
      loading="lazy"
      decoding="async"
      aria-hidden={alt === '' ? true : undefined}
      className={cn('select-none', className)}
      style={{ width: lado, height: lado }}
    />
  );
}
