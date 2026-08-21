/**
 * Latencia artificial do mock. Existe para os estados de carregamento serem
 * visiveis no navegador — skeleton que pisca por 2 ms nao e testavel a olho.
 *
 * O teste automatizado deixa em 0: cada milissegundo aqui vira espera na suite.
 */
let latenciaEmMs = 0;

export function definirLatenciaDoMock(valor: number) {
  latenciaEmMs = valor;
}

export function obterLatenciaDoMock(): number {
  return latenciaEmMs;
}
