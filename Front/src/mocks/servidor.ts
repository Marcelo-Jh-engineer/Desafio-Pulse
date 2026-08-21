import { setupServer } from 'msw/node';
import { handlers } from '@/mocks/handlers';

/**
 * Mesmos handlers do navegador, agora em Node para os testes. O teste exercita
 * o caminho real de rede — cliente HTTP, interceptadores, normalizacao de erro
 * — em vez de um dublê inventado. Ver docs/prd.md secao 7.3.
 */
export const servidor = setupServer(...handlers);
