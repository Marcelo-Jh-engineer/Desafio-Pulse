import { HttpResponse, delay, http } from 'msw';
import type { ErroApi } from '@/types/api';
import type {
  DivergenciaCarrinho,
  ItemPedido,
  Pedido,
  RequisicaoPagamento,
  RequisicaoPedido,
  ResultadoPagamento,
  ResumoPagamento,
  ValidacaoCarrinho,
} from '@/types/pedido';
import { calcularCarrinho } from '@/lib/carrinho-calculo';
import { lerToken } from '@/lib/token';
import { produtos } from '@/mocks/fixtures/produtos';
import { obterLatenciaDoMock } from '@/mocks/latencia';

/**
 * Pedido e pagamento simulado — RF-CHK-01 a RF-CHK-12 e RF-PED-01 a RF-PED-04.
 *
 * O que este handler reproduz do backend real importa mais que a persistencia:
 *
 * - o pedido nasce `PENDENTE` e so vira `PAGO` quando o pagamento e aprovado;
 * - **a baixa de estoque acontece na transicao para `PAGO`**, nunca antes;
 * - pedido de outro usuario responde 403, nao 404.
 */

/** Cobranca Pix aberta, esperando o pagamento no aplicativo do banco. */
interface CobrancaEmAberto {
  codigoCopiaECola: string;
  expiraEmMs: number;
}

const pedidos: Pedido[] = [];
const cobrancasPix = new Map<string, CobrancaEmAberto>();
let proximoNumero = 123;

/** Prazo do Pix — docs/behavior.md secao 9. */
export const VALIDADE_PIX_EM_SEGUNDOS = 5 * 60;

function erro(status: number, mensagem: string) {
  const corpo: ErroApi = { status, mensagem, timestamp: new Date().toISOString() };
  return HttpResponse.json(corpo, { status });
}

/**
 * O "backend" identifica o usuario pelo token do cabecalho, como o real faz.
 *
 * Nome, e-mail e login saem do proprio token: quem cadastra e autentica e o
 * backend de verdade, entao o mock nao guarda lista de usuario nenhuma.
 */
function usuarioDaRequisicao(request: Request) {
  const token = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return undefined;

  return lerToken(token);
}

function gerarNumero(): string {
  proximoNumero += 1;
  return `PED-2026-${String(proximoNumero).padStart(6, '0')}`;
}

/**
 * Baixa de estoque. Acontece **so** aqui, na transicao para PAGO — nunca na
 * montagem do carrinho nem na criacao do pedido (docs/models.md secao 9).
 */
function aprovar(pedido: Pedido, resumo: ResumoPagamento) {
  for (const item of pedido.itens) {
    const produto = produtos.find((atual) => atual.id === item.produtoId);
    if (produto) produto.quantidadeEstoque -= item.quantidade;
  }
  pedido.status = 'PAGO';
  pedido.pagoEm = resumo.pagoEm;
  pedido.pagamento = resumo;
  delete pedido.motivoRecusa;
  cobrancasPix.delete(pedido.id);
}

export const handlersPedidos = [
  /** RF-CHK-08: revalida preco e estoque ao entrar no checkout. */
  http.post('*/carrinho/validacao', async ({ request }) => {
    await delay(obterLatenciaDoMock());

    const corpo = (await request.json()) as {
      itens: { produtoId: string; quantidade: number; precoEmCentavos: number }[];
    };

    const divergencias: DivergenciaCarrinho[] = [];

    for (const item of corpo.itens) {
      const produto = produtos.find((atual) => atual.id === item.produtoId);

      if (!produto?.ativo) {
        divergencias.push({
          produtoId: item.produtoId,
          nome: produto?.nome ?? 'Produto',
          tipo: 'INDISPONIVEL',
        });
        continue;
      }

      if (produto.quantidadeEstoque < item.quantidade) {
        divergencias.push({
          produtoId: produto.id,
          nome: produto.nome,
          tipo: produto.quantidadeEstoque === 0 ? 'INDISPONIVEL' : 'ESTOQUE_INSUFICIENTE',
          quantidadeSolicitada: item.quantidade,
          quantidadeDisponivel: produto.quantidadeEstoque,
        });
        continue;
      }

      if (produto.precoEmCentavos !== item.precoEmCentavos) {
        divergencias.push({
          produtoId: produto.id,
          nome: produto.nome,
          tipo: 'PRECO_ALTERADO',
          precoAnteriorEmCentavos: item.precoEmCentavos,
          precoAtualEmCentavos: produto.precoEmCentavos,
        });
      }
    }

    const resposta: ValidacaoCarrinho = { divergencias };
    return HttpResponse.json(resposta);
  }),

  /** RF-CHK-01 e RF-CHK-02: cria o pedido `PENDENTE` com o endereco. */
  http.post('*/pedidos', async ({ request }) => {
    await delay(obterLatenciaDoMock());

    const comprador = usuarioDaRequisicao(request);
    if (!comprador) return erro(401, 'Sua sessão expirou. Entre de novo para continuar.');

    const corpo = (await request.json()) as RequisicaoPedido;
    if (corpo.itens.length === 0) return erro(422, 'O carrinho está vazio.');

    const itens: ItemPedido[] = [];
    for (const solicitado of corpo.itens) {
      const produto = produtos.find((atual) => atual.id === solicitado.produtoId && atual.ativo);
      if (!produto) return erro(422, 'Um dos produtos não está mais disponível.');

      itens.push({
        produtoId: produto.id,
        // Congelado agora: editar o produto depois nao muda este pedido.
        nome: produto.nome,
        precoEmCentavos: produto.precoEmCentavos,
        unidade: produto.unidade,
        quantidade: solicitado.quantidade,
        totalLinhaEmCentavos: produto.precoEmCentavos * solicitado.quantidade,
      });
    }

    // Reaproveita a mesma regra de frete do carrinho: um lugar so decide.
    const totais = calcularCarrinho(
      itens.map((item) => ({
        produtoId: item.produtoId,
        slug: '',
        nome: item.nome,
        precoEmCentavos: item.precoEmCentavos,
        urlImagem: '',
        unidade: item.unidade,
        quantidade: item.quantidade,
        totalLinhaEmCentavos: item.totalLinhaEmCentavos,
        estoqueDisponivel: item.quantidade,
      })),
    );

    const novo: Pedido = {
      id: `ped-${String(pedidos.length + 1).padStart(4, '0')}`,
      numero: gerarNumero(),
      status: 'PENDENTE',
      itens,
      subtotalEmCentavos: totais.subtotalEmCentavos,
      freteEmCentavos: totais.freteEmCentavos,
      totalEmCentavos: totais.totalEmCentavos,
      endereco: corpo.endereco,
      nomeComprador: comprador.nome,
      emailComprador: comprador.email,
      loginComprador: comprador.login,
      criadoEm: new Date().toISOString(),
    };

    pedidos.push(novo);
    return HttpResponse.json(novo, { status: 201 });
  }),

  /** RF-PED-01 e RF-PED-03. */
  http.get('*/pedidos/:id', async ({ params, request }) => {
    await delay(obterLatenciaDoMock());

    const comprador = usuarioDaRequisicao(request);
    if (!comprador) return erro(401, 'Sua sessão expirou. Entre de novo para continuar.');

    const pedido = pedidos.find((atual) => atual.id === String(params.id));
    if (!pedido) return erro(404, 'Não encontramos este pedido.');

    // 403, nunca 404: um 404 aqui ja entregaria que o pedido existe ou nao.
    if (pedido.emailComprador !== comprador.email) {
      return erro(403, 'Você não tem permissão para acessar esta área.');
    }

    return HttpResponse.json(pedido);
  }),

  /** RF-CHK-03 a RF-CHK-06 e RF-CHK-10: cartão resolve na hora, Pix abre cobrança. */
  http.post('*/pagamentos', async ({ request }) => {
    await delay(obterLatenciaDoMock());

    const comprador = usuarioDaRequisicao(request);
    if (!comprador) return erro(401, 'Sua sessão expirou. Entre de novo para continuar.');

    const corpo = (await request.json()) as RequisicaoPagamento;
    const pedido = pedidos.find((atual) => atual.id === corpo.pedidoId);
    if (!pedido) return erro(404, 'Não encontramos este pedido.');
    if (pedido.emailComprador !== comprador.email) {
      return erro(403, 'Você não tem permissão para acessar esta área.');
    }
    if (pedido.status === 'PAGO') return erro(409, 'Este pedido já foi pago.');
    if (pedido.status === 'CANCELADO') return erro(409, 'Este pedido foi cancelado.');

    const processadoEm = new Date().toISOString();

    if (corpo.metodo === 'PIX') {
      // A cobranca nasce em aberto: quem paga e o aplicativo do banco, depois.
      const codigoCopiaECola = [
        '00020126580014BR.GOV.BCB.PIX0136',
        pedido.id.padEnd(36, '0'),
        '5204000053039865802BR5925VOCE NO CORACAO DA GENTE6009SAO PAULO62070503***6304',
        String(pedido.totalEmCentavos).padStart(4, '0'),
      ].join('');

      const expiraEmMs = Date.now() + VALIDADE_PIX_EM_SEGUNDOS * 1000;
      cobrancasPix.set(pedido.id, { codigoCopiaECola, expiraEmMs });

      const aguardando: ResultadoPagamento = {
        pedidoId: pedido.id,
        status: 'AGUARDANDO',
        cobrancaPix: {
          pedidoId: pedido.id,
          codigoCopiaECola,
          expiraEm: new Date(expiraEmMs).toISOString(),
          validadeEmSegundos: VALIDADE_PIX_EM_SEGUNDOS,
        },
        processadoEm,
      };
      return HttpResponse.json(aguardando);
    }

    const digitos = corpo.numeroCartao.replace(/\D/g, '');
    const finalDoCartao = digitos.slice(-4);

    // Regra do mock, para dar previsibilidade nos testes — docs/models.md 10.
    const motivoRecusa =
      finalDoCartao === '0000'
        ? 'Saldo insuficiente'
        : finalDoCartao === '1111'
          ? 'Cartão expirado'
          : undefined;

    if (motivoRecusa) {
      pedido.status = 'FALHOU';
      pedido.motivoRecusa = motivoRecusa;
      const recusado: ResultadoPagamento = {
        pedidoId: pedido.id,
        status: 'RECUSADO',
        motivoRecusa,
        processadoEm,
      };
      return HttpResponse.json(recusado);
    }

    aprovar(pedido, {
      metodo: 'CARTAO',
      finalDoCartao,
      parcelas: corpo.parcelas,
      valorParcelaEmCentavos: Math.round(pedido.totalEmCentavos / corpo.parcelas),
      pagoEm: processadoEm,
    });

    const aprovado: ResultadoPagamento = {
      pedidoId: pedido.id,
      status: 'APROVADO',
      processadoEm,
    };
    return HttpResponse.json(aprovado);
  }),

  /**
   * RF-CHK-12: confirmação do Pix.
   *
   * No mundo real quem avisa é o banco, por webhook, e a tela apenas consulta o
   * pedido. Aqui o gatilho é explícito para o fluxo ser demonstrável sem
   * serviço externo — a tela continua consultando o pedido do mesmo jeito.
   */
  http.post('*/pagamentos/pix/confirmacao', async ({ request }) => {
    await delay(obterLatenciaDoMock());

    const comprador = usuarioDaRequisicao(request);
    if (!comprador) return erro(401, 'Sua sessão expirou. Entre de novo para continuar.');

    const corpo = (await request.json()) as { pedidoId: string };
    const pedido = pedidos.find((atual) => atual.id === corpo.pedidoId);
    if (!pedido) return erro(404, 'Não encontramos este pedido.');
    if (pedido.emailComprador !== comprador.email) {
      return erro(403, 'Você não tem permissão para acessar esta área.');
    }
    if (pedido.status === 'PAGO') return erro(409, 'Este pedido já foi pago.');

    const cobranca = cobrancasPix.get(pedido.id);
    const processadoEm = new Date().toISOString();

    // Cobrança vencida não pode ser paga: gerar outra é o caminho.
    if (!cobranca || cobranca.expiraEmMs <= Date.now()) {
      cobrancasPix.delete(pedido.id);
      pedido.status = 'FALHOU';
      pedido.motivoRecusa = 'O prazo do Pix expirou';

      const recusado: ResultadoPagamento = {
        pedidoId: pedido.id,
        status: 'RECUSADO',
        motivoRecusa: 'O prazo do Pix expirou',
        processadoEm,
      };
      return HttpResponse.json(recusado);
    }

    aprovar(pedido, { metodo: 'PIX', pagoEm: processadoEm });

    const aprovado: ResultadoPagamento = {
      pedidoId: pedido.id,
      status: 'APROVADO',
      processadoEm,
    };
    return HttpResponse.json(aprovado);
  }),
];
