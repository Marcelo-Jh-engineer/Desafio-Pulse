import { CreditCard, QrCode } from 'lucide-react';
import { Preco } from '@/components/preco';
import { ROTULO_METODO_PAGAMENTO } from '@/types/dominio';
import type { Pedido } from '@/types/pedido';

/**
 * Resumo da forma de pagamento — RF-CHK-13.
 *
 * Vive separado dos itens porque responde outra pergunta: os itens dizem **o
 * que** foi comprado, isto diz **como** foi pago. No comprovante impresso, é a
 * parte que o cliente confere contra a fatura do cartão ou o extrato do Pix.
 */
export function ResumoDoPagamento({ pedido }: { pedido: Pedido }) {
  const pagamento = pedido.pagamento;
  if (!pagamento) return null;

  const Icone = pagamento.metodo === 'PIX' ? QrCode : CreditCard;

  return (
    <section aria-labelledby="titulo-pagamento" className="space-y-3">
      <h2 id="titulo-pagamento" className="text-xl font-semibold">
        Pagamento
      </h2>

      <dl className="space-y-1 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Forma</dt>
          <dd className="flex items-center gap-1.5 font-medium">
            <Icone aria-hidden="true" className="size-4" />
            {ROTULO_METODO_PAGAMENTO[pagamento.metodo]}
          </dd>
        </div>

        {pagamento.metodo === 'CARTAO' ? (
          <>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Cartão</dt>
              {/* Só os quatro últimos: o número completo nunca é guardado. */}
              <dd className="numeros-tabulares">•••• {pagamento.finalDoCartao}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Parcelamento</dt>
              <dd>
                {pagamento.parcelas === 1 ? (
                  'À vista'
                ) : (
                  <>
                    {pagamento.parcelas}× de{' '}
                    <Preco
                      centavos={pagamento.valorParcelaEmCentavos ?? 0}
                      className="text-sm font-normal"
                    />
                  </>
                )}
              </dd>
            </div>
          </>
        ) : null}

        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Data</dt>
          <dd>{new Date(pagamento.pagoEm).toLocaleString('pt-BR')}</dd>
        </div>

        <div className="flex items-baseline justify-between gap-2 pt-2">
          <dt className="font-semibold">Valor pago</dt>
          <dd>
            <Preco centavos={pedido.totalEmCentavos} className="text-xl" />
          </dd>
        </div>
      </dl>
    </section>
  );
}
