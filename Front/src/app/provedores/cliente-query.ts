import { QueryClient } from '@tanstack/react-query';
import { ErroDeAplicacao } from '@/lib/erros';

/**
 * Erro 4xx e resposta legitima do servidor, nao falha transitoria — repetir so
 * atrasa a mensagem que o usuario precisa ver.
 */
function deveTentarDeNovo(tentativa: number, erro: unknown): boolean {
  if (erro instanceof ErroDeAplicacao && erro.status >= 400 && erro.status < 500) {
    return false;
  }
  return tentativa < 2;
}

export function criarClienteQuery(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: deveTentarDeNovo,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
