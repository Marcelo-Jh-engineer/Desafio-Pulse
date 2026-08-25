import { HttpResponse, delay, http } from 'msw';
import type { Categoria, Produto } from '@/types/catalogo';
import type { ErroApi, Pagina } from '@/types/api';
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

/**
 * Fundo e traco de cada categoria. Igual ao que foi gravado no banco.
 *
 * Chaveada pelo NOME da categoria: sem slug, e o nome que a identifica de forma
 * legivel. O id nao serviria — ele muda a cada carga do banco.
 */
const PALETA: Record<string, [string, string]> = {
  Hortifrúti: ['#CCFAF2', '#077E6A'],
  Bebidas: ['#D1E9FF', '#0061BD'],
  Padaria: ['#FDF0D5', '#8A5A00'],
  Limpeza: ['#E8FDF9', '#058E98'],
  Mercearia: ['#EBF5FF', '#004E98'],
  Açougue: ['#FFE8E8', '#A32A2A'],
};

/** Iniciais do produto: "Banana Prata" vira "BP", "Cenoura" vira "CE". */
function iniciais(nome: string): string {
  const palavras = normalizar(nome)
    .split(/[^a-z]+/)
    .filter((palavra) => palavra.length > 2);
  if (palavras.length === 0) return '??';
  if (palavras.length === 1) return palavras[0]!.slice(0, 2).toUpperCase();
  return (palavras[0]![0]! + palavras[1]![0]!).toUpperCase();
}

/** Escapa o que vai como texto dentro do SVG. O nome vem da fixture, mas
 *  montar marcacao concatenando texto sem escapar e um habito que nao
 *  sobrevive ao dia em que a fonte do texto mudar. */
function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function desenharSvg(produto: Produto): string {
  const [fundo, cor] = PALETA[produto.categoria.nome] ?? ['#EBF5FF', '#004E98'];
  const rotulo = escapar(produto.nome);
  const fonte = produto.nome.length <= 20 ? 26 : produto.nome.length <= 26 ? 22 : 19;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" role="img" aria-label="${rotulo}">
  <rect width="400" height="400" fill="${fundo}"/>
  <circle cx="200" cy="178" r="96" fill="none" stroke="${cor}" stroke-width="8" opacity="0.35"/>
  <text x="200" y="178" font-family="Inter, system-ui, sans-serif" font-size="88" font-weight="700"
        fill="${cor}" text-anchor="middle" dominant-baseline="central">${iniciais(produto.nome)}</text>
  <text x="200" y="330" font-family="Inter, system-ui, sans-serif" font-size="${fonte}" font-weight="500"
        fill="${cor}" text-anchor="middle" opacity="0.75">${rotulo}</text>
</svg>
`;
}

/** Igual ao padrao do backend (ServicoDeCatalogo.TAMANHO_PADRAO). */
const TAMANHO_PADRAO = 10;

/** Busca ignora acento e caixa: quem procura "acucar" acha "açúcar". */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

/**
 * Ordem fixa do catalogo, igual a do backend: disponivel antes de
 * indisponivel, depois pela ordem da categoria, depois pelo nome. Nao ha
 * escolha de ordenacao — nem aqui, nem na API.
 */
function ordenar(lista: Produto[]): Produto[] {
  return [...lista].sort((a, b) => {
    const disponibilidade = Number(b.quantidadeEstoque > 0) - Number(a.quantidadeEstoque > 0);
    if (disponibilidade !== 0) return disponibilidade;
    if (a.categoria.ordem !== b.categoria.ordem) {
      return a.categoria.ordem - b.categoria.ordem;
    }
    return a.nome.localeCompare(b.nome, 'pt-BR');
  });
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

    const idCategoria = parametros.get('categoria');
    const busca = parametros.get('busca');
    const tamanho = Math.min(
      Math.max(lerInteiro(parametros.get('tamanho'), TAMANHO_PADRAO), 1),
      48,
    );
    const pagina = lerInteiro(parametros.get('pagina'), 0);

    // Produto inativo nao aparece no catalogo publico; estoque zero aparece.
    let resultado = produtos.filter((produto) => produto.ativo);

    if (idCategoria) {
      resultado = resultado.filter((produto) => produto.categoria.id === idCategoria);
    }

    const termo = normalizar(busca ?? '');
    if (termo) {
      resultado = resultado.filter(
        (produto) =>
          normalizar(produto.nome).includes(termo) ||
          normalizar(produto.categoria.nome).includes(termo),
      );
    }

    return HttpResponse.json(paginar(ordenar(resultado), pagina, tamanho));
  }),

  /**
   * A imagem do produto — os bytes vivem no banco, nao em arquivo estatico.
   *
   * Aqui o SVG e desenhado na hora, com a mesma arte e a mesma paleta por
   * categoria que a carga inicial gravou em tb_produto_imagens. O mock precisa
   * fabricar a imagem porque nao ha banco do lado de ca; o que NAO pode mudar
   * entre mock e API real e a URL, e ela e a mesma.
   */
  http.get('*/produtos/:id/imagem', async ({ params }) => {
    await delay(obterLatenciaDoMock());
    const id = String(params.id);
    const produto = produtos.find((item) => item.id === id);

    if (!produto) {
      return erro(404, 'Não encontramos esta imagem.');
    }

    return new HttpResponse(desenharSvg(produto), {
      headers: {
        'Content-Type': 'image/svg+xml',
        // Mesmos cabecalhos que o backend usara: SVG e XML e aceita script,
        // entao a imagem nao ganha os poderes de uma pagina da loja.
        'Content-Security-Policy': 'sandbox',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }),

  /** RF-CAT-07. Id inexistente ou produto inativo devolvem 404. */
  http.get('*/produtos/:id', async ({ params }) => {
    await delay(obterLatenciaDoMock());
    const id = String(params.id);
    const produto = produtos.find((item) => item.id === id && item.ativo);

    if (!produto) {
      return erro(404, 'Não encontramos este produto.');
    }
    return HttpResponse.json(produto);
  }),
];
