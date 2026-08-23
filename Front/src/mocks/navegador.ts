import { setupWorker } from 'msw/browser';
import { handlers } from '@/mocks/handlers';
import { definirLatenciaDoMock } from '@/mocks/latencia';

export const worker = setupWorker(...handlers);

/**
 * Liga o mock no navegador. Chamado so quando `VITE_API_MODE=mock`, e o modulo
 * inteiro fica fora do bundle de producao por import dinamico.
 *
 * `onUnhandledRequest: 'bypass'` deixa passar imagem, fonte, o proprio worker
 * e — de proposito — `/autenticacao/*` e `/me`, que ja tem backend de verdade.
 */
export async function iniciarWorker(): Promise<void> {
  definirLatenciaDoMock(250);
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: true,
    serviceWorker: { url: '/mockServiceWorker.js' },
  });
}
