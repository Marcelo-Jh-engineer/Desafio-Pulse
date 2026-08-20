import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ProvedorTema } from '@/app/provedores/provedor-tema';

interface OpcoesRenderizacao extends Omit<RenderOptions, 'wrapper'> {
  /** Rota inicial do roteador em memoria. */
  rota?: string;
}

function criarClienteDeTeste() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

/**
 * Renderiza com os provedores reais da aplicacao. Cada caso recebe um
 * QueryClient novo, entao o cache nunca vaza entre testes.
 */
export function renderizar(interfaceUsuario: ReactElement, opcoes: OpcoesRenderizacao = {}) {
  const { rota = '/', ...restante } = opcoes;
  const clienteQuery = criarClienteDeTeste();

  function Envoltorio({ children }: { children: ReactNode }) {
    return (
      <ProvedorTema>
        <QueryClientProvider client={clienteQuery}>
          <MemoryRouter initialEntries={[rota]}>{children}</MemoryRouter>
        </QueryClientProvider>
      </ProvedorTema>
    );
  }

  return {
    clienteQuery,
    ...render(interfaceUsuario, { wrapper: Envoltorio, ...restante }),
  };
}

export * from '@testing-library/react';
export { default as usuario } from '@testing-library/user-event';
