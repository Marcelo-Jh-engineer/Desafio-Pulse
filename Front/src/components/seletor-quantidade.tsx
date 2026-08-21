import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { tetoDaLinha } from '@/lib/carrinho-calculo';

interface PropriedadesSeletorQuantidade {
  valor: number;
  /** Estoque do produto. O teto real sai de `tetoDaLinha`. */
  estoqueDisponivel: number;
  /** Vira o `aria-label`: "Quantidade de Banana Prata". */
  nomeDoProduto: string;
  aoMudar: (quantidade: number) => void;
  desabilitado?: boolean;
}

/**
 * Menos, numero, mais — docs/design.md secao 8.2.
 *
 * O numero e um `input` de verdade, nao um texto: quem usa teclado consegue
 * digitar 12 em vez de apertar o `+` doze vezes.
 */
export function SeletorQuantidade({
  valor,
  estoqueDisponivel,
  nomeDoProduto,
  aoMudar,
  desabilitado = false,
}: PropriedadesSeletorQuantidade) {
  const teto = tetoDaLinha(estoqueDisponivel);
  const noMinimo = valor <= 1;
  const noMaximo = valor >= teto;

  return (
    <div className="inline-flex items-center rounded-md border border-input">
      <Button
        variante="fantasma"
        tamanho="icone"
        className="h-9 w-9 rounded-r-none"
        disabled={desabilitado || noMinimo}
        aria-label={`Diminuir quantidade de ${nomeDoProduto}`}
        onClick={() => {
          aoMudar(valor - 1);
        }}
      >
        <Minus aria-hidden="true" />
      </Button>

      <input
        type="text"
        inputMode="numeric"
        value={valor}
        disabled={desabilitado}
        aria-label={`Quantidade de ${nomeDoProduto}`}
        onChange={(evento) => {
          const digitado = Number.parseInt(evento.target.value.replace(/\D/g, ''), 10);
          // Campo vazio no meio da digitacao nao vira zero: seria remocao acidental.
          if (Number.isFinite(digitado)) aoMudar(digitado);
        }}
        className="numeros-tabulares h-9 w-12 border-x border-input bg-card text-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:opacity-50"
      />

      <Button
        variante="fantasma"
        tamanho="icone"
        className="h-9 w-9 rounded-l-none"
        disabled={desabilitado || noMaximo}
        aria-label={`Aumentar quantidade de ${nomeDoProduto}`}
        onClick={() => {
          aoMudar(valor + 1);
        }}
      >
        <Plus aria-hidden="true" />
      </Button>
    </div>
  );
}
