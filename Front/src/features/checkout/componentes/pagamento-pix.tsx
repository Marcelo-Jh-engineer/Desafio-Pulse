import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Preco } from '@/components/preco';
import { QrCodePix } from '@/features/checkout/componentes/qr-code-pix';
import { formatarContagem, useContagemRegressiva } from '@/hooks/use-contagem-regressiva';
import type { CobrancaPix } from '@/types/pedido';

interface PropriedadesPagamentoPix {
  cobranca: CobrancaPix;
  totalEmCentavos: number;
  confirmando: boolean;
  aoConfirmar: () => void;
  aoGerarNovaCobranca: () => void;
}

/**
 * Cobrança Pix com prazo — RF-CHK-11.
 *
 * O contador sai do `expiraEm` que o servidor devolveu, não de uma duração
 * iniciada na tela: recarregar a página não ganha tempo extra.
 *
 * No mundo real quem avisa que o Pix caiu é o banco, por webhook. Aqui o botão
 * "Já fiz o pagamento" é o gatilho equivalente — sem ele, o fluxo dependeria de
 * um serviço externo que a fase mockada não tem.
 */
export function PagamentoPix({
  cobranca,
  totalEmCentavos,
  confirmando,
  aoConfirmar,
  aoGerarNovaCobranca,
}: PropriedadesPagamentoPix) {
  const [copiado, definirCopiado] = useState(false);
  const restante = useContagemRegressiva(new Date(cobranca.expiraEm).getTime());
  const expirou = restante <= 0;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(cobranca.codigoCopiaECola);
      definirCopiado(true);
      setTimeout(() => {
        definirCopiado(false);
      }, 2000);
    } catch {
      // Sem permissão de área de transferência o código continua selecionável.
    }
  }

  if (expirou) {
    return (
      <div role="alert" className="space-y-3 rounded-md border border-alerta/40 bg-alerta/10 p-4">
        <p className="font-medium text-alerta">O prazo do Pix expirou</p>
        <p className="text-sm text-muted-foreground">
          A cobrança valia por 5 minutos. Gere outra para concluir o pedido — os itens continuam
          reservados no seu carrinho.
        </p>
        <Button variante="secundario" onClick={aoGerarNovaCobranca}>
          Gerar novo código
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <QrCodePix codigo={cobranca.codigoCopiaECola} />

        <p className="text-sm text-muted-foreground">
          Abra o aplicativo do seu banco, escolha Pix e aponte a câmera para o código.
        </p>

        <p className="flex items-baseline gap-2">
          <span className="text-sm text-muted-foreground">Valor</span>
          <Preco centavos={totalEmCentavos} className="text-2xl" />
        </p>

        {/* `assertive` porque o prazo correndo muda o que a pessoa deve fazer. */}
        <p
          role="timer"
          aria-live="assertive"
          className="numeros-tabulares rounded-full bg-muted px-3 py-1 text-sm font-medium"
        >
          Expira em {formatarContagem(restante)}
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="pix-copia-e-cola" className="block text-sm font-medium">
          Pix copia e cola
        </label>
        <div className="flex gap-2">
          <input
            id="pix-copia-e-cola"
            readOnly
            value={cobranca.codigoCopiaECola}
            onFocus={(evento) => {
              evento.target.select();
            }}
            className="h-10 min-w-0 flex-1 truncate rounded-md border border-input bg-muted px-3 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          <Button
            variante="secundario"
            aria-label="Copiar código Pix"
            onClick={() => {
              void copiar();
            }}
          >
            {copiado ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            {copiado ? 'Copiado' : 'Copiar'}
          </Button>
        </div>
      </div>

      <Button
        variante="acao"
        tamanho="grande"
        className="w-full"
        disabled={confirmando}
        aria-busy={confirmando}
        onClick={aoConfirmar}
      >
        {confirmando ? 'Confirmando...' : 'Já fiz o pagamento'}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Pagamento simulado. A chave Pix é fictícia e não há recebedor real.
      </p>
    </div>
  );
}
