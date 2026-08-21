import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSessaoStore } from '@/lib/sessao-store';
import type { Papel } from '@/types/dominio';

interface PropriedadesRotaProtegida {
  /** Vazio significa "basta estar autenticado". */
  papeis?: Papel[];
  /** Rotas que so fazem sentido deslogado, como login e cadastro. */
  apenasAnonimo?: boolean;
  children: ReactNode;
}

/**
 * Guarda de rota por papel — docs/prd.md secao 3.
 *
 * **A distincao entre os dois desvios e o ponto do componente:**
 * - Sem sessao -> `/login`.
 * - Com sessao e sem o papel -> `/403`, **preservando a sessao**.
 *
 * Derrubar a sessao de quem esta legitimamente logado so porque faltou
 * permissao em uma rota seria bug de comportamento, nao seguranca.
 *
 * > Isto e UX. Quem autoriza de verdade e o backend, em toda requisicao
 * > privilegiada — e na fase mockada nao ha backend nenhum.
 */
export function RotaProtegida({
  papeis = [],
  apenasAnonimo = false,
  children,
}: PropriedadesRotaProtegida) {
  const autenticado = useSessaoStore((estado) => estado.autenticado);
  const papeisDaSessao = useSessaoStore((estado) => estado.papeis);
  const temPapel = useSessaoStore((estado) => estado.temPapel);

  if (apenasAnonimo) {
    if (!autenticado) return <>{children}</>;
    return <Navigate to={papeisDaSessao.includes('ADMIN') ? '/admin/produtos' : '/'} replace />;
  }

  if (!autenticado) return <Navigate to="/login" replace />;
  if (!temPapel(papeis)) return <Navigate to="/403" replace />;

  return <>{children}</>;
}
