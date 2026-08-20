import { useState } from 'react';
import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { criarClienteQuery } from '@/app/provedores/cliente-query';
import { ProvedorTema } from '@/app/provedores/provedor-tema';
import { Toaster } from '@/components/ui/sonner';

export function Provedores({ children }: { children: ReactNode }) {
  // Uma instancia por montagem do app: em teste cada caso ganha cache limpo.
  const [clienteQuery] = useState(criarClienteQuery);

  return (
    <ProvedorTema>
      <QueryClientProvider client={clienteQuery}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </ProvedorTema>
  );
}
