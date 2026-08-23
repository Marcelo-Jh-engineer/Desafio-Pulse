import { HttpResponse, delay, http } from 'msw';
import type { ErroApi, Pagina } from '@/types/api';
import type {
  Categoria,
  Produto,
  RequisicaoCategoria,
  RequisicaoProduto,
} from '@/types/catalogo';
import { lerToken } from '@/lib/token';
import { categorias } from '@/mocks/fixtures/categorias';
import { produtos } from '@/mocks/fixtures/produtos';
import { obterLatenciaDoMock } from '@/mocks/latencia';

/**
 * Área administrativa — RF-ADM-01 a RF-ADM-08.
 *
 * O admin cadastra produto, ajusta preco e organiza categorias. **Estoque nao
 * se edita a mao**: ele baixa sozinho quando um pagamento e aprovado, e e o
 * unico caminho que existe para mexer nele.
 */

function erro(status: number, mensagem: string, errosPorCampo?: Record<string, string>) {
  const corpo: ErroApi = {
    status,
    mensagem,
    ...(errosPorCampo ? { errosPorCampo } : {}),
    timestamp: new Date().toISOString(),
  };
  return HttpResponse.json(corpo, { status });
}

/** Toda rota administrativa exige ADMIN — a checagem do front e so UX. */
function adminDaRequisicao(request: Request) {
  const token = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return undefined;

  // O proprio token descreve quem esta chamando: nao ha lista de usuarios do
  // lado do mock, porque quem cadastra e autentica e o backend real.
  const conteudo = lerToken(token);
  if (!conteudo?.papeis.includes('ADMIN')) return undefined;

  return conteudo;
}

/** Slug gerado pelo backend, sem acento, minusculo, com hifen. */
function gerarSlug(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function lerInteiro(valor: string | null, padrao: number): number {
  const numero = Number.parseInt(valor ?? '', 10);
  return Number.isFinite(numero) ? numero : padrao;
}

export const handlersAdmin = [
  /** RF-ADM-01: lista ativos **e** inativos, ao contrario do catalogo publico. */
  http.get('*/admin/produtos', async ({ request }) => {
    await delay(obterLatenciaDoMock());
    if (!adminDaRequisicao(request)) {
      return erro(403, 'Você não tem permissão para acessar esta área.');
    }

    const parametros = new URL(request.url).searchParams;
    const busca = (parametros.get('busca') ?? '').toLowerCase().trim();
    const slugCategoria = parametros.get('categoria');
    const situacao = parametros.get('situacao');

    let resultado = [...produtos];

    if (slugCategoria) {
      resultado = resultado.filter((produto) => produto.categoria.slug === slugCategoria);
    }
    if (situacao === 'ATIVO') resultado = resultado.filter((produto) => produto.ativo);
    if (situacao === 'INATIVO') resultado = resultado.filter((produto) => !produto.ativo);
    if (busca) {
      resultado = resultado.filter(
        (produto) =>
          produto.nome.toLowerCase().includes(busca) || produto.sku.toLowerCase().includes(busca),
      );
    }
    if (parametros.get('ordenacao') === 'ESTOQUE_ASC') {
      resultado.sort((a, b) => a.quantidadeEstoque - b.quantidadeEstoque);
    }

    const tamanho = lerInteiro(parametros.get('tamanho'), 20);
    const totalPaginas = Math.max(1, Math.ceil(resultado.length / tamanho));
    const pagina = Math.min(
      Math.max(lerInteiro(parametros.get('pagina'), 0), 0),
      totalPaginas - 1,
    );

    const corpo: Pagina<Produto> = {
      conteudo: resultado.slice(pagina * tamanho, pagina * tamanho + tamanho),
      pagina,
      tamanho,
      totalElementos: resultado.length,
      totalPaginas,
      primeira: pagina === 0,
      ultima: pagina === totalPaginas - 1,
    };
    return HttpResponse.json(corpo);
  }),

  /**
   * O admin busca por **id**, nao por slug: a listagem administrativa trabalha
   * com a chave estavel, que nao muda quando o nome do produto e editado.
   */
  http.get('*/admin/produtos/:id', async ({ params, request }) => {
    await delay(obterLatenciaDoMock());
    if (!adminDaRequisicao(request)) {
      return erro(403, 'Você não tem permissão para acessar esta área.');
    }

    const produto = produtos.find((atual) => atual.id === String(params.id));
    if (!produto) return erro(404, 'Não encontramos este produto.');

    return HttpResponse.json(produto);
  }),

  /** RF-ADM-02. */
  http.post('*/produtos', async ({ request }) => {
    await delay(obterLatenciaDoMock());
    if (!adminDaRequisicao(request)) {
      return erro(403, 'Você não tem permissão para acessar esta área.');
    }

    const dados = (await request.json()) as RequisicaoProduto;
    const categoria = categorias.find((atual) => atual.id === dados.categoriaId);
    if (!categoria) {
      return erro(422, 'Não foi possível salvar o produto.', {
        categoriaId: 'Escolha uma categoria.',
      });
    }
    if (produtos.some((produto) => produto.sku.toLowerCase() === dados.sku.toLowerCase())) {
      return erro(409, 'Não foi possível salvar o produto.', {
        sku: 'Já existe um produto com este SKU.',
      });
    }

    const agora = new Date().toISOString();
    const novo: Produto = {
      id: `p-${String(produtos.length + 1).padStart(4, '0')}`,
      sku: dados.sku,
      // Slug gerado pelo backend a partir do nome, nunca enviado pelo front.
      slug: gerarSlug(dados.nome),
      nome: dados.nome,
      descricao: dados.descricao,
      precoEmCentavos: dados.precoEmCentavos,
      unidade: dados.unidade,
      urlImagem: dados.urlImagem,
      categoria,
      quantidadeEstoque: dados.quantidadeEstoque,
      ativo: dados.ativo,
      criadoEm: agora,
      atualizadoEm: agora,
    };

    produtos.push(novo);

    return HttpResponse.json(novo, { status: 201 });
  }),

  /**
   * RF-ADM-03: alteração de preço.
   *
   * Só o preço muda por aqui. O estoque é movimentado pelo próprio fluxo de
   * venda — baixa na aprovação do pagamento — e não por edição manual.
   */
  http.patch('*/produtos/:id', async ({ params, request }) => {
    await delay(obterLatenciaDoMock());
    if (!adminDaRequisicao(request)) {
      return erro(403, 'Você não tem permissão para acessar esta área.');
    }

    const produto = produtos.find((atual) => atual.id === String(params.id));
    if (!produto) return erro(404, 'Não encontramos este produto.');

    const dados = (await request.json()) as { precoEmCentavos?: number };

    if (!Number.isInteger(dados.precoEmCentavos) || (dados.precoEmCentavos ?? 0) <= 0) {
      return erro(422, 'Não foi possível salvar o preço.', {
        preco: 'Informe um preço maior que zero.',
      });
    }

    produto.precoEmCentavos = dados.precoEmCentavos ?? produto.precoEmCentavos;
    produto.atualizadoEm = new Date().toISOString();

    return HttpResponse.json(produto);
  }),

  /** RF-ADM-05: o admin ve inclusive as categorias desativadas. */
  http.get('*/admin/categorias', async ({ request }) => {
    await delay(obterLatenciaDoMock());
    if (!adminDaRequisicao(request)) {
      return erro(403, 'Você não tem permissão para acessar esta área.');
    }

    const comContagem = [...categorias]
      .sort((a, b) => a.ordem - b.ordem)
      .map((categoria) => ({
        ...categoria,
        quantidadeProdutos: produtos.filter((produto) => produto.categoria.id === categoria.id)
          .length,
      }));

    return HttpResponse.json(comContagem);
  }),

  http.post('*/categorias', async ({ request }) => {
    await delay(obterLatenciaDoMock());
    if (!adminDaRequisicao(request)) {
      return erro(403, 'Você não tem permissão para acessar esta área.');
    }

    const dados = (await request.json()) as RequisicaoCategoria;
    const slug = gerarSlug(dados.nome);

    if (categorias.some((categoria) => categoria.slug === slug)) {
      return erro(409, 'Não foi possível salvar a categoria.', {
        nome: 'Já existe uma categoria com este nome.',
      });
    }

    const nova: Categoria = {
      id: `cat-${String(categorias.length + 1).padStart(4, '0')}`,
      nome: dados.nome.trim(),
      slug,
      ...(dados.descricao ? { descricao: dados.descricao } : {}),
      ordem: dados.ordem,
      ativa: dados.ativa,
    };
    categorias.push(nova);

    return HttpResponse.json(nova, { status: 201 });
  }),

  /**
   * Só ativa e desativa. **Não existe exclusão** — apagar quebraria o vínculo
   * histórico dos produtos já cadastrados (docs/behavior.md secao 11.4).
   */
  http.patch('*/categorias/:id', async ({ params, request }) => {
    await delay(obterLatenciaDoMock());
    if (!adminDaRequisicao(request)) {
      return erro(403, 'Você não tem permissão para acessar esta área.');
    }

    const categoria = categorias.find((atual) => atual.id === String(params.id));
    if (!categoria) return erro(404, 'Não encontramos esta categoria.');

    const dados = (await request.json()) as Partial<RequisicaoCategoria>;
    if (typeof dados.nome === 'string' && dados.nome.trim().length >= 2) {
      categoria.nome = dados.nome.trim();
      categoria.slug = gerarSlug(dados.nome);
    }
    if (typeof dados.ativa === 'boolean') categoria.ativa = dados.ativa;

    return HttpResponse.json(categoria);
  }),
];
