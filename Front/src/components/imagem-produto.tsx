import { useState } from 'react';
import { cn } from '@/lib/utils';

interface PropriedadesImagemProduto {
  src: string;
  /** Nome do produto. Vira o texto alternativo — RNF-A11Y-07. */
  nome: string;
  className?: string;
  /** A primeira dobra da grade carrega com prioridade; o resto e preguicoso. */
  prioritaria?: boolean;
}

/**
 * Dimensoes explicitas e proporcao fixa para a grade nao saltar enquanto as
 * imagens chegam — RNF-PERF-03 e CLS de RNF-PERF-01.
 *
 * Se a imagem falhar, o espaco continua reservado e um marcador neutro entra
 * no lugar. Imagem quebrada nunca deixa buraco no layout.
 */
export function ImagemProduto({
  src,
  nome,
  className,
  prioritaria = false,
}: PropriedadesImagemProduto) {
  const [falhou, definirFalhou] = useState(false);

  return (
    <div className={cn('aspect-square w-full overflow-hidden rounded-md bg-muted', className)}>
      {falhou ? (
        <div
          role="img"
          aria-label={nome}
          className="flex h-full w-full items-center justify-center bg-accent text-accent-foreground"
        >
          <span className="text-sm font-medium">Imagem indisponível</span>
        </div>
      ) : (
        <img
          src={src}
          alt={nome}
          width={400}
          height={400}
          loading={prioritaria ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => {
            definirFalhou(true);
          }}
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
        />
      )}
    </div>
  );
}
