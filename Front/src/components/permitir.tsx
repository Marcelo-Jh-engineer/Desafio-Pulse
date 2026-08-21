import type { ReactNode } from 'react';
import { useSessaoStore } from '@/lib/sessao-store';
import type { Papel } from '@/types/dominio';

/**
 * Esconde uma acao dentro de uma tela **ja acessivel**. `RotaProtegida` cuida
 * da porta; este cuida dos botoes de dentro da sala.
 */
export function Permitir({ papeis, children }: { papeis: Papel[]; children: ReactNode }) {
  const temPapel = useSessaoStore((estado) => estado.temPapel);
  return <>{temPapel(papeis) ? children : null}</>;
}
