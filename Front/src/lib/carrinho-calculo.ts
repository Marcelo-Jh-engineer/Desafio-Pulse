import type { Carrinho, ItemCarrinho } from '@/types/carrinho';

/**
 * Regras de dinheiro do carrinho — docs/models.md secao 7.
 *
 * Funcoes puras, sem React e sem store: e o unico lugar do projeto que faz
 * conta de valor, e o unico que precisa de teste unitario para isso
 * (RNF-MAN-03). O store apenas chama daqui.
 *
 * **Tudo em centavos inteiros.** Ponto flutuante em dinheiro erra: `0.1 + 0.2`
 * nao da `0.3`, e o erro aparece no total do cliente.
 */

/** Frete fixo da fase mockada. */
export const FRETE_EM_CENTAVOS = 990;

/** Acima disso o frete zera. */
export const FRETE_GRATIS_ACIMA_DE = 15_000;

/** Teto por linha, independente do estoque. */
export const QUANTIDADE_MAXIMA = 20;

/**
 * Teto real de uma linha: o menor entre o limite fixo e o estoque disponivel.
 * Estoque zerado devolve 0 — a linha nao deveria existir.
 */
export function tetoDaLinha(estoqueDisponivel: number): number {
  return Math.max(0, Math.min(QUANTIDADE_MAXIMA, estoqueDisponivel));
}

/** Prende a quantidade entre 1 e o teto. Zero e tratado por quem remove a linha. */
export function limitarQuantidade(quantidade: number, estoqueDisponivel: number): number {
  const teto = tetoDaLinha(estoqueDisponivel);
  if (teto === 0) return 0;
  return Math.max(1, Math.min(Math.trunc(quantidade), teto));
}

/** Recalcula o total da linha. Nunca confie no valor que veio junto. */
export function recalcularLinha(item: ItemCarrinho): ItemCarrinho {
  const quantidade = limitarQuantidade(item.quantidade, item.estoqueDisponivel);
  return {
    ...item,
    quantidade,
    totalLinhaEmCentavos: item.precoEmCentavos * quantidade,
  };
}

/**
 * Monta o carrinho inteiro a partir das linhas. Todos os totais sao derivados
 * aqui, a cada mutacao — nao existe total guardado que possa dessincronizar.
 */
export function calcularCarrinho(itens: ItemCarrinho[]): Carrinho {
  const linhas = itens.map(recalcularLinha);

  const subtotalEmCentavos = linhas.reduce((total, item) => total + item.totalLinhaEmCentavos, 0);
  const quantidadeItens = linhas.reduce((total, item) => total + item.quantidade, 0);

  // Carrinho vazio nao cobra frete: nao ha o que entregar.
  const freteEmCentavos =
    linhas.length === 0 || subtotalEmCentavos >= FRETE_GRATIS_ACIMA_DE ? 0 : FRETE_EM_CENTAVOS;

  return {
    itens: linhas,
    subtotalEmCentavos,
    freteEmCentavos,
    totalEmCentavos: subtotalEmCentavos + freteEmCentavos,
    quantidadeItens,
  };
}

/** Quanto falta para o frete sair de graca. Zero quando ja saiu. */
export function faltaParaFreteGratis(subtotalEmCentavos: number): number {
  return Math.max(0, FRETE_GRATIS_ACIMA_DE - subtotalEmCentavos);
}
