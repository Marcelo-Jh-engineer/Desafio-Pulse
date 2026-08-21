import { CartaoProduto } from '@/features/catalogo/componentes/cartao-produto';
import type { Produto } from '@/types/catalogo';

/** Quantos cartoes cabem na primeira dobra em telas grandes. */
const CARTOES_ACIMA_DA_DOBRA = 4;

/**
 * Grade de 2, 3 ou 4 colunas — RNF-RESP-02. Marcada como `ul` de `li` para o
 * leitor de tela anunciar "lista de 12 itens" — docs/behavior.md secao 3.
 */
export function GradeProdutos({ produtos }: { produtos: Produto[] }) {
  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {produtos.map((produto, indice) => (
        <li key={produto.id}>
          <CartaoProduto produto={produto} prioritaria={indice < CARTOES_ACIMA_DA_DOBRA} />
        </li>
      ))}
    </ul>
  );
}
