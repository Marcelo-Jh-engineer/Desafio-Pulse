import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { criarClienteQuery } from '@/app/provedores/cliente-query';
import { ProvedorTema } from '@/app/provedores/provedor-tema';
import { Toaster } from '@/components/ui/sonner';
import { restaurarSessao } from '@/lib/sessao-store';

export function Provedores({ children }: { children: ReactNode }) {
  // Uma instancia por montagem do app: em teste cada caso ganha cache limpo.
  const [clienteQuery] = useState(criarClienteQuery);
  const jaTentou = useRef(false);

  // Primeira coisa que o app faz: perguntar ao servidor se o cookie de sessao
  // ainda vale. E o que faz o F5 nao deslogar.
  useEffect(() => {
    // O StrictMode monta duas vezes em desenvolvimento; sem a trava seriam duas
    // renovacoes, e com a rotacao de refresh ligada a segunda usaria um token ja
    // gasto — a sessao cairia no proprio boot.
    if (jaTentou.current) return;
    jaTentou.current = true;
    void restaurarSessao();
  }, []);

  return (
    <ProvedorTema>
      <QueryClientProvider client={clienteQuery}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </ProvedorTema>
  );
}
