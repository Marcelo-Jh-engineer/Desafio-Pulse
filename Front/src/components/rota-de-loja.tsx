import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSessaoStore } from '@/lib/sessao-store';
import { EsperaDeSessao } from '@/components/espera-de-sessao';

/**
 * Rota da loja: catalogo, produto, carrinho, checkout.
 *
 * **O administrador nao navega a loja.** Ele nao compra, e ver o catalogo como
 * cliente so criaria a duvida de qual visao esta valendo — a listagem
 * administrativa ja mostra os produtos com os dados que ele precisa operar.
 * Quem tem o papel ADMIN e levado para a propria area.
 *
 * Visitante e cliente passam direto: a loja e aberta.
 */
export function RotaDeLoja({ children }: { children: ReactNode }) {
  const temPapel = useSessaoStore((estado) => estado.temPapel);
  const autenticado = useSessaoStore((estado) => estado.autenticado);
  const restaurando = useSessaoStore((estado) => estado.restaurando);

  // Sem esperar, o administrador que recarrega veria a loja por um instante
  // antes de ser desviado para a area dele.
  if (restaurando) return <EsperaDeSessao />;

  if (autenticado && temPapel(['ADMIN'])) {
    return <Navigate to="/admin/produtos" replace />;
  }

  return <>{children}</>;
}
