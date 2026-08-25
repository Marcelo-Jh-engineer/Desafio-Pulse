import { create } from 'zustand';

/**
 * Intenção de compra do visitante — fluxo 12.1.
 *
 * **É só isto que sobrou aqui.** O carrinho em si é do servidor e vive no
 * TanStack Query (`hooks/use-carrinho.ts`); copiá-lo para uma store daria duas
 * versões do mesmo carrinho, e a de memória envelheceria em silêncio.
 *
 * A intenção, ao contrário, é estado de cliente puro: nasce de um clique de
 * quem não está logado, existe durante uma navegação e morre ao ser consumida.
 * Não tem onde ser gravada no servidor — não há usuário a quem pertencer.
 *
 * Guarda só o id do produto e a quantidade, e não a linha montada: quando o
 * login terminar, quem monta a linha é a API, com o preço e o estoque daquele
 * momento. Guardar a linha inteira aqui congelaria um preço visto antes do
 * login e o faria entrar no carrinho como se fosse o de agora.
 *
 * **Não é persistida.** Uma intenção sobrevivente a um F5 entraria no carrinho
 * num login futuro, sem relação nenhuma com o clique que a criou.
 */
interface IntencaoDeCompra {
  produtoId: string;
  nome: string;
  quantidade: number;
}

interface EstadoDaIntencao {
  intencao: IntencaoDeCompra | null;

  guardarIntencao: (intencao: IntencaoDeCompra) => void;
  /** Devolve e descarta. Consumida **uma única vez** — recarregar não repete. */
  consumirIntencao: () => IntencaoDeCompra | null;
  descartarIntencao: () => void;
}

export const useIntencaoDeCompraStore = create<EstadoDaIntencao>()((definir, obter) => ({
  intencao: null,

  guardarIntencao: (intencao) => {
    definir({ intencao });
  },

  consumirIntencao: () => {
    const { intencao } = obter();
    if (intencao) definir({ intencao: null });
    return intencao;
  },

  descartarIntencao: () => {
    definir({ intencao: null });
  },
}));
