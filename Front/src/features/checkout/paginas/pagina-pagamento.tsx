import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, Lock, QrCode } from 'lucide-react';
import { TituloDaPagina } from '@/components/titulo-da-pagina';
import { EstadoErro } from '@/components/estado-erro';
import { Preco } from '@/components/preco';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { IndicadorEtapas } from '@/features/checkout/componentes/indicador-etapas';
import { PagamentoCartao } from '@/features/checkout/componentes/pagamento-cartao';
import { PagamentoPix } from '@/features/checkout/componentes/pagamento-pix';
import type { FormularioCartao } from '@/features/checkout/esquemas/checkout-esquemas';
import { useConfirmarPix, usePagar, usePedido } from '@/features/checkout/hooks/use-checkout';
import { apenasDigitos } from '@/lib/documento';
import { ErroDeAplicacao, MENSAGENS_ERRO } from '@/lib/erros';
import { ROTULO_METODO_PAGAMENTO, type MetodoPagamento } from '@/types/dominio';
import type { CobrancaPix } from '@/types/pedido';

const METODOS: { valor: MetodoPagamento; icone: typeof CreditCard; descricao: string }[] = [
  { valor: 'CARTAO', icone: CreditCard, descricao: 'Aprovação na hora, em até 12×' },
  { valor: 'PIX', icone: QrCode, descricao: 'QR code com 5 minutos para pagar' },
];

/**
 * Pagamento simulado — RF-CHK-03 a RF-CHK-06 e RF-CHK-09 a RF-CHK-11.
 *
 * O método escolhido muda o que vem depois, mas não o contrato: os dois
 * terminam num `ResultadoPagamento`. Cartão resolve na mesma requisição; Pix
 * abre uma cobrança e o desfecho chega depois.
 */
export function PaginaPagamento() {
  const [parametros] = useSearchParams();
  const pedidoId = parametros.get('pedido') ?? '';
  const pedido = usePedido(pedidoId);
  const pagamento = usePagar();
  const confirmacaoPix = useConfirmarPix();
  const navegar = useNavigate();

  const [metodo, definirMetodo] = useState<MetodoPagamento | null>(null);
  const [cobranca, definirCobranca] = useState<CobrancaPix | null>(null);

  if (!pedidoId) return <Navigate to="/carrinho" replace />;
  if (pedido.isPending) return <Skeleton className="h-96 w-full" />;

  if (pedido.isError) {
    return (
      <EstadoErro
        titulo="Não foi possível carregar o pedido"
        mensagem={pedido.error instanceof ErroDeAplicacao ? pedido.error.message : undefined}
        aoTentarDeNovo={() => {
          void pedido.refetch();
        }}
      />
    );
  }

  // Pedido ja pago: nao ha o que cobrar de novo.
  if (pedido.data.status === 'PAGO') {
    return <Navigate to={`/pedidos/${pedido.data.id}/confirmacao`} replace />;
  }

  const totalEmCentavos = pedido.data.totalEmCentavos;

  function pagarComCartao(dados: FormularioCartao) {
    // RF-CHK-09: segunda submissao bloqueada enquanto a primeira corre.
    if (pagamento.isPending) return;

    pagamento.mutate(
      {
        metodo: 'CARTAO',
        pedidoId,
        numeroCartao: apenasDigitos(dados.numeroCartao),
        nomeTitular: dados.nomeTitular.trim(),
        validade: dados.validade.trim(),
        cvv: dados.cvv.trim(),
        parcelas: Number.parseInt(dados.parcelas, 10),
      },
      {
        onSuccess: (resultado) => {
          if (resultado.status === 'APROVADO') {
            void navegar(`/pedidos/${pedidoId}/confirmacao`, { replace: true });
          }
          // RECUSADO nao navega: o motivo aparece aqui, com o carrinho intacto.
        },
      },
    );
  }

  function gerarCobrancaPix() {
    definirMetodo('PIX');
    pagamento.mutate(
      { metodo: 'PIX', pedidoId },
      {
        onSuccess: (resultado) => {
          if (resultado.cobrancaPix) definirCobranca(resultado.cobrancaPix);
        },
      },
    );
  }

  function confirmarPix() {
    confirmacaoPix.mutate(
      { pedidoId },
      {
        onSuccess: (resultado) => {
          if (resultado.status === 'APROVADO') {
            void navegar(`/pedidos/${pedidoId}/confirmacao`, { replace: true });
            return;
          }
          // Prazo vencido: a cobranca sai da tela e o aviso de expiracao entra.
          definirCobranca(null);
        },
      },
    );
  }

  // Estado dedicado durante o processamento do cartão — sem opção de voltar.
  if (metodo === 'CARTAO' && pagamento.isPending) {
    return (
      <div className="space-y-6">
        <TituloDaPagina tituloDocumento="Processando pagamento">
          Processando pagamento
        </TituloDaPagina>
        <IndicadorEtapas atual={2} />
        <Card>
          <CardContent
            role="status"
            aria-live="assertive"
            className="flex flex-col items-center gap-3 py-16 text-center"
          >
            <Lock aria-hidden="true" className="size-8 text-primary" />
            <p className="font-medium">Confirmando o pagamento do pedido {pedido.data.id}</p>
            <p className="max-w-prose text-sm text-muted-foreground">
              Não feche nem atualize esta página. Isso leva alguns segundos.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const recusa =
    pagamento.data?.status === 'RECUSADO'
      ? pagamento.data.motivoRecusa
      : confirmacaoPix.data?.status === 'RECUSADO'
        ? confirmacaoPix.data.motivoRecusa
        : undefined;

  // Erro de rede: o desfecho é desconhecido. Orienta a verificar em vez de
  // sugerir nova tentativa que poderia duplicar a cobrança.
  const falha = pagamento.error ?? confirmacaoPix.error;
  const erroDeRede = falha
    ? falha instanceof ErroDeAplicacao
      ? falha.message
      : MENSAGENS_ERRO.servidor
    : null;

  return (
    <div className="space-y-6">
      <TituloDaPagina tituloDocumento="Pagamento">Pagamento</TituloDaPagina>
      <IndicadorEtapas atual={2} />

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardContent className="space-y-4 pt-6">
            {recusa ? (
              <div
                role="alert"
                className="space-y-2 rounded-md border border-destructive/40 bg-destructive/10 p-3"
              >
                <p className="text-sm font-medium text-destructive">
                  Pagamento recusado: {recusa}
                </p>
                <p className="text-sm text-muted-foreground">
                  Seu carrinho continua intacto. Tente de novo ou escolha outra forma.
                </p>
              </div>
            ) : null}

            {erroDeRede ? (
              <div
                role="alert"
                className="space-y-2 rounded-md border border-alerta/40 bg-alerta/10 p-3"
              >
                <p className="text-sm font-medium text-alerta">
                  Não foi possível confirmar o pagamento
                </p>
                <p className="text-sm text-muted-foreground">
                  {erroDeRede} Antes de tentar de novo, verifique o status do pedido{' '}
                  {pedido.data.id} — repetir agora pode gerar uma segunda cobrança.
                </p>
                <Button
                  variante="secundario"
                  tamanho="pequeno"
                  onClick={() => {
                    void navegar(`/pedidos/${pedidoId}`);
                  }}
                >
                  Ver status do pedido
                </Button>
              </div>
            ) : null}

            <fieldset>
              <legend className="mb-3 text-lg font-semibold">Como você quer pagar?</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {METODOS.map(({ valor, icone: Icone, descricao }) => {
                  const selecionado = metodo === valor;
                  return (
                    <div key={valor}>
                      <input
                        type="radio"
                        id={`metodo-${valor}`}
                        name="metodo"
                        value={valor}
                        checked={selecionado}
                        onChange={() => {
                          if (valor === 'PIX') {
                            gerarCobrancaPix();
                            return;
                          }
                          definirMetodo(valor);
                          definirCobranca(null);
                        }}
                        className="peer sr-only"
                      />
                      <label
                        htmlFor={`metodo-${valor}`}
                        className={`flex cursor-pointer flex-col gap-1 rounded-md border p-4 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 ${
                          selecionado
                            ? 'border-primary bg-accent text-accent-foreground'
                            : 'border-border bg-card hover:bg-muted'
                        }`}
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <Icone aria-hidden="true" className="size-4" />
                          {ROTULO_METODO_PAGAMENTO[valor]}
                        </span>
                        <span className="text-xs text-muted-foreground">{descricao}</span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </fieldset>

            {metodo === 'CARTAO' ? (
              <PagamentoCartao
                totalEmCentavos={totalEmCentavos}
                enviando={pagamento.isPending}
                aoPagar={pagarComCartao}
              />
            ) : null}

            {metodo === 'PIX' ? (
              pagamento.isPending ? (
                <Skeleton className="h-72 w-full" aria-label="Gerando cobrança Pix" />
              ) : cobranca ? (
                <PagamentoPix
                  cobranca={cobranca}
                  totalEmCentavos={totalEmCentavos}
                  confirmando={confirmacaoPix.isPending}
                  aoConfirmar={confirmarPix}
                  aoGerarNovaCobranca={gerarCobrancaPix}
                />
              ) : (
                <div
                  role="alert"
                  className="space-y-3 rounded-md border border-alerta/40 bg-alerta/10 p-4"
                >
                  <p className="font-medium text-alerta">A cobrança Pix não está mais válida</p>
                  <Button variante="secundario" onClick={gerarCobrancaPix}>
                    Gerar novo código
                  </Button>
                </div>
              )
            ) : null}

            {metodo === null ? (
              <p className="text-sm text-muted-foreground">
                Escolha uma forma de pagamento para continuar.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <aside aria-label="Resumo do pedido">
          <Card className="sticky top-24">
            <CardContent className="space-y-3 pt-6">
              <h2 className="text-xl font-semibold">Pedido {pedido.data.id}</h2>
              <ul className="space-y-2 text-sm">
                {pedido.data.itens.map((item) => (
                  <li key={item.produtoId} className="flex justify-between gap-2">
                    <span className="min-w-0 truncate">
                      {item.quantidade}× {item.nome}
                    </span>
                    <Preco centavos={item.totalLinhaEmCentavos} className="shrink-0 text-sm" />
                  </li>
                ))}
              </ul>
              <div className="flex items-baseline justify-between border-t border-border pt-3">
                <span className="font-semibold">Total</span>
                <Preco centavos={totalEmCentavos} className="text-2xl" />
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
