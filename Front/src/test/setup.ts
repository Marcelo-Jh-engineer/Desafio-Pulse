import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { servidor } from '@/mocks/servidor';

/**
 * Os mesmos handlers do navegador atendem os testes, entao a suite exercita o
 * caminho real de rede: cliente HTTP, interceptadores e normalizacao de erro.
 * Ver docs/prd.md secao 7.3.
 *
 * `error` em requisicao nao tratada e proposital: chamada que escapou do mock
 * quebra o teste em vez de bater na rede de verdade.
 */
beforeAll(() => {
  servidor.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  servidor.resetHandlers();
  cleanup();
});

afterAll(() => {
  servidor.close();
});

// jsdom nao implementa matchMedia, usado pelo provedor de tema.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (consulta: string) => ({
    matches: false,
    media: consulta,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }),
});

// jsdom nao implementa IntersectionObserver, usado por carregamento preguicoso.
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn(() => []);
    root = null;
    rootMargin = '';
    thresholds: readonly number[] = [];
  },
});

// jsdom nao implementa scrollIntoView, usado ao trocar de pagina no catalogo.
Element.prototype.scrollIntoView = vi.fn();
