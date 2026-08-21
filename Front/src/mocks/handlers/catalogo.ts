import { HttpResponse, delay, http } from 'msw';
import type { Categoria, Produto } from '@/types/catalogo';
import type { ErroApi, Pagina } from '@/types/api';
import type { OrdenacaoCatalogo } from '@/types/api-parametros';
import { categorias } from '@/mocks/fixtures/categorias';
import { produtos } from '@/mocks/fixtures/produtos';
import { obterLatenciaDoMock } from '@/mocks/latencia';

/**
 * Handlers do catalogo publico — RF-CAT-01 a RF-CAT-10.
 *
 * Reproduzem o contrato de docs/models.md secoes 12 e 13. O que o backend
 * Spring devolver na F6 precisa ter exatamente esta forma; se divergir, o
 * desvio se resolve aqui e no backend, nunca no componente.
 */

const TAMANHO_PADRAO = 12;

/** Busca ignora acento e caixa: quem procura "acucar" acha "açúcar". */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function ordenar(lista: Produto[], ordenacao: OrdenacaoCatalogo): Produto[] {
  const copia = [...lista];
  switch (ordenacao) {
    case 'PRECO_ASC':
      return copia.sort((a, b) => a.precoEmCentavos - b.precoEmCentavos);
    case 'PRECO_DESC':
      return copia.sort((a, b) => b.precoEmCentavos - a.precoEmCentavos);
    case 'NOME_ASC':
      return copia.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    case 'RELEVANCIA':
    default:
      // Disponivel antes de indisponivel; depois pela ordem da categoria.
      return copia.sort((a, b) => {
        const disponibilidade = Number(b.quantidadeEstoque > 0) - Number(a.quantidadeEstoque > 0);
        if (disponibilidade !== 0) return disponibilidade;
        if (a.categoria.ordem !== b.categoria.ordem) {
          return a.categoria.ordem - b.categoria.ordem;
        }
        return a.nome.localeCompare(b.nome, 'pt-BR');
      });
  }
}

function paginar<T>(lista: T[], paginaPedida: number, tamanho: number): Pagina<T> {
  const totalElementos = lista.length;
  const totalPaginas = Math.max(1, Math.ceil(totalElementos / tamanho));

  // `?pagina=99` alem do total volta para a ultima pagina valida, em vez de
  // devolver lista vazia — docs/behavior.md secao 3, casos de borda.
  const pagina = Math.min(Math.max(paginaPedida, 0), totalPaginas - 1);
  const inicio = pagina * tamanho;

  return {
    conteudo: lista.slice(inicio, inicio + tamanho),
    pagina,
    tamanho,
    totalElementos,
    totalPaginas,
    primeira: pagina === 0,
    ultima: pagina === totalPaginas - 1,
  };
}

function lerInteiro(valor: string | null, padrao: number): number {
  if (valor === null) return padrao;
  const numero = Number.parseInt(valor, 10);
  return Number.isFinite(numero) ? numero : padrao;
}

function erro(status: number, mensagem: string) {
  const corpo: ErroApi = { status, mensagem, timestamp: new Date().toISOString() };
  return HttpResponse.json(corpo, { status });
}

export const handlersCatalogo = [
  /** RF-CAT-05: a lista de categorias vem da API, nunca codificada no front. */
  http.get('*/categorias', async () => {
    await delay(obterLatenciaDoMock());
    const publicas: Categoria[] = categorias
      .filter((categoria) => categoria.ativa)
      .sort((a, b) => a.ordem - b.ordem);
    return HttpResponse.json(publicas);
  }),

  /** RF-CAT-01 a RF-CAT-04, RF-CAT-09, RF-CAT-10. */
  http.get('*/produtos', async ({ request }) => {
    await delay(obterLatenciaDoMock());
    const parametros = new URL(request.url).searchParams;

    const slugCategoria = parametros.get('categoria');
    const busca = parametros.get('busca');
    const ordenacao = (parametros.get('ordenacao') ?? 'RELEVANCIA') as OrdenacaoCatalogo;
    const tamanho = Math.min(
      Math.max(lerInteiro(parametros.get('tamanho'), TAMANHO_PADRAO), 1),
      48,
    );
    const pagina = lerInteiro(parametros.get('pagina'), 0);

    // Produto inativo nao aparece no catalogo publico; estoque zero aparece.
    let resultado = produtos.filter((produto) => produto.ativo);

    if (slugCategoria) {
      resultado = resultado.filter((produto) => produto.categoria.slug === slugCategoria);
    }

    const termo = normalizar(busca ?? '');
    if (termo) {
      resultado = resultado.filter(
        (produto) =>
          normalizar(produto.nome).includes(termo) ||
          normalizar(produto.categoria.nome).includes(termo),
      );
    }

    return HttpResponse.json(paginar(ordenar(resultado, ordenacao), pagina, tamanho));
  }),

  /** RF-CAT-07. Slug inexistente ou produto inativo devolvem 404. */
  http.get('*/produtos/:slug', async ({ params }) => {
    await delay(obterLatenciaDoMock());
    const slug = String(params.slug);
    const produto = produtos.find((item) => item.slug === slug && item.ativo);

    if (!produto) {
      return erro(404, 'Não encontramos este produto.');
    }
    return HttpResponse.json(produto);
  }),
];
