import { useCallback, useEffect, useRef } from 'react';
import { TituloDaPagina } from '@/components/titulo-da-pagina';
import { EstadoErro } from '@/components/estado-erro';
import { EstadoVazio } from '@/components/estado-vazio';
import { Button } from '@/components/ui/button';
import { CampoBusca } from '@/features/catalogo/componentes/campo-busca';
import { EsqueletoCatalogo } from '@/features/catalogo/componentes/esqueleto-catalogo';
import { EsqueletoGrade } from '@/features/catalogo/componentes/esqueleto-grade';
import { FiltroCategorias } from '@/features/catalogo/componentes/filtro-categorias';
import { GradeProdutos } from '@/features/catalogo/componentes/grade-produtos';
import { Paginacao } from '@/components/paginacao';
import { useCategorias } from '@/features/catalogo/hooks/use-categorias';
import { useParametrosCatalogo } from '@/features/catalogo/hooks/use-parametros-catalogo';
import { useProdutos } from '@/features/catalogo/hooks/use-produtos';
import { ErroDeAplicacao } from '@/lib/erros';

/**
 * Catalogo publico — RF-CAT-01 a RF-CAT-10.
 *
 * Nao ha estado de filtro neste componente: tudo vem de `useParametrosCatalogo`,
 * que le a URL. Recarregar, compartilhar o link e o botao voltar funcionam de
 * graca — RF-CAT-06.
 */
export function PaginaCatalogo() {
  const { parametros, filtrar, irParaPagina, limpar, temFiltroAtivo } = useParametrosCatalogo();
  const categorias = useCategorias();
  const produtos = useProdutos(parametros);
  const topoDaGrade = useRef<HTMLDivElement>(null);

  const paginaAtual = produtos.data?.pagina ?? parametros.pagina ?? 0;

  const mudarPagina = useCallback(
    (pagina: number) => {
      irParaPagina(pagina);
      topoDaGrade.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [irParaPagina],
  );

  const buscar = useCallback(
    (termo: string) => {
      filtrar({ busca: termo });
    },
    [filtrar],
  );

  // `?pagina=99` alem do total: o servidor devolve a ultima valida e a URL
  // acompanha, para o link compartilhado nao continuar mentindo.
  //
  // `isPlaceholderData` e obrigatorio na condicao: enquanto a proxima pagina
  // carrega, `data` ainda e a anterior. Sem essa guarda o efeito leria a pagina
  // velha, concluiria que a URL diverge e devolveria o usuario para a pagina de
  // onde ele acabou de sair.
  const paginaPedida = parametros.pagina ?? 0;
  useEffect(() => {
    if (produtos.isPlaceholderData || !produtos.data) return;
    if (produtos.data.pagina !== paginaPedida) {
      irParaPagina(produtos.data.pagina);
    }
  }, [produtos.data, produtos.isPlaceholderData, paginaPedida, irParaPagina]);

  if (produtos.isPending) return <EsqueletoCatalogo />;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <TituloDaPagina tituloDocumento="Catálogo">Catálogo</TituloDaPagina>
        {/* Sem enumerar categoria: a lista e da API e muda quando o admin mexe. */}
        <p className="max-w-prose text-muted-foreground">
          A feira completa da sua casa, com o Dentinho tomando conta de tudo desde os anos 90.
        </p>
      </div>

      <section aria-label="Filtros" className="space-y-4">
        <FiltroCategorias
          categorias={categorias.data}
          carregando={categorias.isPending}
          ativa={parametros.categoria}
          aoSelecionar={(slug) => {
            filtrar({ categoria: slug });
          }}
        />
        <CampoBusca valorInicial={parametros.busca ?? ''} aoBuscar={buscar} />
      </section>

      <div ref={topoDaGrade} className="scroll-mt-24">
        <ResultadoDoCatalogo
          consulta={produtos}
          termoBuscado={parametros.busca}
          categoriaAtiva={parametros.categoria}
          temFiltroAtivo={temFiltroAtivo}
          aoLimpar={limpar}
          aoMudarPagina={mudarPagina}
          paginaAtual={paginaAtual}
        />
      </div>
    </div>
  );
}

interface PropriedadesResultado {
  consulta: ReturnType<typeof useProdutos>;
  termoBuscado: string | undefined;
  categoriaAtiva: string | undefined;
  temFiltroAtivo: boolean;
  aoLimpar: () => void;
  aoMudarPagina: (pagina: number) => void;
  paginaAtual: number;
}

function ResultadoDoCatalogo({
  consulta,
  termoBuscado,
  categoriaAtiva,
  temFiltroAtivo,
  aoLimpar,
  aoMudarPagina,
  paginaAtual,
}: PropriedadesResultado) {
  if (consulta.isPending) {
    return <EsqueletoGrade />;
  }

  if (consulta.isError) {
    const mensagem =
      consulta.error instanceof ErroDeAplicacao ? consulta.error.message : undefined;
    return (
      <EstadoErro
        titulo="Não foi possível carregar o catálogo"
        mensagem={mensagem}
        aoTentarDeNovo={() => {
          void consulta.refetch();
        }}
      />
    );
  }

  const pagina = consulta.data;

  if (pagina.totalElementos === 0) {
    // Categoria inexistente na URL tambem cai aqui, nunca em erro — docs/behavior.md
    // secao 3, casos de borda.
    const titulo = termoBuscado
      ? `Nenhum resultado para "${termoBuscado}"`
      : 'Nenhum produto nesta categoria';

    return (
      <EstadoVazio
        titulo={titulo}
        descricao={
          termoBuscado
            ? 'Confira a grafia ou tente um termo mais curto.'
            : 'Essa categoria está sem produtos disponíveis no momento.'
        }
        acao={
          temFiltroAtivo ? (
            <Button variante="secundario" onClick={aoLimpar}>
              {termoBuscado && !categoriaAtiva ? 'Limpar busca' : 'Limpar filtros'}
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <section aria-label="Produtos" className="space-y-4">
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {pagina.totalElementos === 1
          ? '1 produto encontrado'
          : `${pagina.totalElementos} produtos encontrados`}
        {pagina.totalPaginas > 1
          ? ` — página ${pagina.pagina + 1} de ${pagina.totalPaginas}`
          : ''}
      </p>

      <div aria-busy={consulta.isFetching} className={consulta.isFetching ? 'opacity-60' : ''}>
        <GradeProdutos produtos={pagina.conteudo} />
      </div>

      <Paginacao
        pagina={paginaAtual}
        totalPaginas={pagina.totalPaginas}
        aoMudarPagina={aoMudarPagina}
      />
    </section>
  );
}
