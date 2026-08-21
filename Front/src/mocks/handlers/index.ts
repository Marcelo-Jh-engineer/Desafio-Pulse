import { handlersAdmin } from '@/mocks/handlers/admin';
import { handlersAutenticacao } from '@/mocks/handlers/autenticacao';
import { handlersCatalogo } from '@/mocks/handlers/catalogo';
import { handlersPedidos } from '@/mocks/handlers/pedidos';

/**
 * Handlers de todas as fases. O MSW casa o primeiro padrao que bater, e cada
 * padrao exige o caminho inteiro — por isso a rota de listagem e a de item nao
 * se atropelam.
 */
export const handlers = [
  // Admin primeiro: `*/admin/produtos` precisa casar antes do padrao publico.
  ...handlersAdmin,
  ...handlersCatalogo,
  ...handlersAutenticacao,
  ...handlersPedidos,
];
