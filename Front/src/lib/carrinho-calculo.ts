/**
 * Limite de quantidade do carrinho — docs/models.md secao 7.
 *
 * **Nao ha conta de dinheiro aqui.** Quem soma o carrinho e o servidor: o total
 * vem pronto em `/api/carrinho`, e recalcular no cliente daria dois numeros
 * para a mesma pergunta.
 *
 * **Nao ha teto fixo por linha.** O unico limite e o estoque do produto. Um
 * teto arbitrario obrigaria a interface e o servidor a concordarem sobre um
 * numero que nenhum requisito pediu.
 *
 * O que sobra e antecipacao de UX: nao deixar a pessoa pedir o que o servidor
 * vai recusar. A validacao que vale e a do backend, em ServicoDeEstoque.
 */

/**
 * Quanto uma linha pode ter: o estoque disponivel, e nada alem dele.
 * Estoque zerado devolve 0 — a linha nao deveria existir.
 */
export function tetoDaLinha(estoqueDisponivel: number): number {
  return Math.max(0, estoqueDisponivel);
}

/** Prende a quantidade entre 1 e o estoque. Zero e tratado por quem remove a linha. */
export function limitarQuantidade(quantidade: number, estoqueDisponivel: number): number {
  const teto = tetoDaLinha(estoqueDisponivel);
  if (teto === 0) return 0;
  return Math.max(1, Math.min(Math.trunc(quantidade), teto));
}
