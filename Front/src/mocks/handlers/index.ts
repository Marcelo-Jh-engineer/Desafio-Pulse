import { handlersAdmin } from '@/mocks/handlers/admin';
import { handlersCatalogo } from '@/mocks/handlers/catalogo';
import { handlersPedidos } from '@/mocks/handlers/pedidos';

/**
 * Handlers das fases ainda sem backend. O MSW casa o primeiro padrao que bater,
 * e cada padrao exige o caminho inteiro — por isso a rota de listagem e a de
 * item nao se atropelam.
 *
 * **Autenticacao nao esta aqui de proposito.** `/autenticacao/*` e `/me` ja tem
 * backend de verdade: sem handler que case, o `onUnhandledRequest: 'bypass'` de
 * `mocks/navegador.ts` deixa a chamada seguir para a rede. E por isso que o
 * catalogo mockado convive com login real no mesmo modo.
 */
export const handlers = [
  // Admin primeiro: `*/admin/produtos` precisa casar antes do padrao publico.
  ...handlersAdmin,
  ...handlersCatalogo,
  ...handlersPedidos,
];
