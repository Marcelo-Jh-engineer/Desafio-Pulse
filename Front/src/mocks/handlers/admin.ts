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
    const idCategoria = parametros.get('categoria');
    const situacao = parametros.get('situacao');

    let resultado = [...produtos];

    if (idCategoria) {
      resultado = resultado.filter((produto) => produto.categoria.id === idCategoria);
    }
    if (situacao === 'ATIVO') resultado = resultado.filter((produto) => produto.ativo);
    if (situacao === 'INATIVO') resultado = resultado.filter((produto) => !produto.ativo);
    if (busca) {
      resultado = resultado.filter((produto) => produto.nome.toLowerCase().includes(busca));
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
    if (produtos.some((produto) => produto.nome.toLowerCase() === dados.nome.toLowerCase())) {
      return erro(409, 'Não foi possível salvar o produto.', {
        nome: 'Já existe um produto com este nome.',
      });
    }

    const novo: Produto = {
      id: `p-${String(produtos.length + 1).padStart(4, '0')}`,
      nome: dados.nome,
      descricao: dados.descricao,
      precoEmCentavos: dados.precoEmCentavos,
      unidade: dados.unidade,
      urlImagem: dados.urlImagem,
      categoria,
      quantidadeEstoque: dados.quantidadeEstoque,
      ativo: dados.ativo,
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
    const nome = dados.nome.trim();

    // O nome e o identificador natural agora: sem slug, e ele que nao pode
    // repetir, e e a unicidade que o banco tambem impoe.
    if (categorias.some((categoria) => categoria.nome.toLowerCase() === nome.toLowerCase())) {
      return erro(409, 'Não foi possível salvar a categoria.', {
        nome: 'Já existe uma categoria com este nome.',
      });
    }

    const nova: Categoria = {
      id: `cat-${String(categorias.length + 1).padStart(4, '0')}`,
      nome,
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
    }
    if (typeof dados.ativa === 'boolean') categoria.ativa = dados.ativa;

    return HttpResponse.json(categoria);
  }),
];
