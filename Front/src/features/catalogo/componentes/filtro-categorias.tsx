import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Categoria } from '@/types/catalogo';

interface PropriedadesFiltroCategorias {
  categorias: Categoria[] | undefined;
  carregando: boolean;
  /** Slug ativo. `undefined` significa "Todas". */
  ativa: string | undefined;
  aoSelecionar: (slug: string | undefined) => void;
}

const CLASSE_OPCAO =
  'cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-150';

/**
 * RF-CAT-03 e RF-CAT-05. Grupo de radio com `fieldset` e `legend`, conforme
 * docs/behavior.md secao 3: a selecao e exclusiva e o teclado navega com as
 * setas de graca, sem JavaScript de acessibilidade.
 *
 * A lista **nunca** e codificada no front — vem inteira da API.
 */
export function FiltroCategorias({
  categorias,
  carregando,
  ativa,
  aoSelecionar,
}: PropriedadesFiltroCategorias) {
  if (carregando) {
    return (
      <div className="flex flex-wrap gap-2" aria-busy="true">
        {Array.from({ length: 5 }, (_, indice) => (
          <Skeleton key={indice} className="h-10 w-28 rounded-full" />
        ))}
      </div>
    );
  }

  if (!categorias?.length) return null;

  const opcoes: { valor: string | undefined; rotulo: string }[] = [
    { valor: undefined, rotulo: 'Todas' },
    ...categorias.map((categoria) => ({ valor: categoria.id, rotulo: categoria.nome })),
  ];

  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-sm font-medium">Categoria</legend>
      <div className="flex flex-wrap gap-2">
        {opcoes.map(({ valor, rotulo }) => {
          const selecionada = ativa === valor;
          const identificador = `categoria-${valor ?? 'todas'}`;

          return (
            <div key={identificador}>
              <input
                type="radio"
                id={identificador}
                name="categoria"
                value={valor ?? ''}
                checked={selecionada}
                onChange={() => {
                  aoSelecionar(valor);
                }}
                className="peer sr-only"
              />
              <label
                htmlFor={identificador}
                className={cn(
                  CLASSE_OPCAO,
                  selecionada
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground',
                  'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
                )}
              >
                {rotulo}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
