import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { OrdenacaoCatalogo, ParametrosCatalogo } from '@/types/api-parametros';

/**
 * A query string e a **fonte de verdade** do filtro — RF-CAT-06. Nao existe
 * copia do filtro em estado de componente: a listagem fica compartilhavel, o
 * botao voltar funciona e recarregar a pagina preserva tudo.
 *
 * Valor padrao nao vai para a URL. A primeira pagina do catalogo sem filtro e
 * `/`, nao `/?pagina=0&ordenacao=RELEVANCIA`.
 */

export const TAMANHO_PAGINA = 12;

/**
 * `Partial` nao serve aqui: com `exactOptionalPropertyTypes` ele recusa
 * `undefined` explicito, que e justamente como se apaga um filtro.
 */
export type MudancasCatalogo = {
  [Chave in keyof ParametrosCatalogo]?: ParametrosCatalogo[Chave] | undefined;
};

const ORDENACOES: readonly OrdenacaoCatalogo[] = [
  'RELEVANCIA',
  'PRECO_ASC',
  'PRECO_DESC',
  'NOME_ASC',
];

export const ROTULO_ORDENACAO: Record<OrdenacaoCatalogo, string> = {
  RELEVANCIA: 'Relevância',
  PRECO_ASC: 'Menor preço',
  PRECO_DESC: 'Maior preço',
  NOME_ASC: 'Nome (A-Z)',
};

function lerOrdenacao(valor: string | null): OrdenacaoCatalogo {
  const candidato = valor as OrdenacaoCatalogo | null;
  return candidato && ORDENACOES.includes(candidato) ? candidato : 'RELEVANCIA';
}

/** Indice base 0, como no contrato. Valor invalido ou negativo cai na primeira. */
function lerPagina(valor: string | null): number {
  const numero = Number.parseInt(valor ?? '', 10);
  return Number.isFinite(numero) && numero > 0 ? numero : 0;
}

export function useParametrosCatalogo() {
  const [parametrosUrl, definirParametrosUrl] = useSearchParams();

  const parametros = useMemo<ParametrosCatalogo>(() => {
    const categoria = parametrosUrl.get('categoria') ?? undefined;
    // Busca so com espaco conta como busca vazia — nao dispara requisicao.
    const buscaAparada = parametrosUrl.get('busca')?.trim() ?? '';
    const busca = buscaAparada.length > 0 ? buscaAparada : undefined;

    return {
      ...(categoria ? { categoria } : {}),
      ...(busca ? { busca } : {}),
      ordenacao: lerOrdenacao(parametrosUrl.get('ordenacao')),
      pagina: lerPagina(parametrosUrl.get('pagina')),
      tamanho: TAMANHO_PAGINA,
    };
  }, [parametrosUrl]);

  const atualizar = useCallback(
    (mudancas: MudancasCatalogo) => {
      definirParametrosUrl(
        (atuais) => {
          const proximos = new URLSearchParams(atuais);

          for (const [chave, valor] of Object.entries(mudancas)) {
            const vazio =
              valor === undefined ||
              valor === null ||
              valor === '' ||
              (chave === 'pagina' && valor === 0) ||
              (chave === 'ordenacao' && valor === 'RELEVANCIA');

            if (vazio) {
              proximos.delete(chave);
            } else {
              proximos.set(chave, String(valor));
            }
          }

          // `tamanho` e decisao da aplicacao, nao do usuario: fora da URL.
          proximos.delete('tamanho');
          return proximos;
        },
        { replace: true },
      );
    },
    [definirParametrosUrl],
  );

  /** Filtrar, buscar e ordenar sempre voltam para a primeira pagina. */
  const filtrar = useCallback(
    (mudancas: MudancasCatalogo) => {
      atualizar({ ...mudancas, pagina: 0 });
    },
    [atualizar],
  );

  const irParaPagina = useCallback(
    (pagina: number) => {
      atualizar({ pagina });
    },
    [atualizar],
  );

  const limpar = useCallback(() => {
    definirParametrosUrl(new URLSearchParams(), { replace: true });
  }, [definirParametrosUrl]);

  const temFiltroAtivo = Boolean(parametros.categoria ?? parametros.busca);

  return { parametros, filtrar, irParaPagina, limpar, temFiltroAtivo };
}
