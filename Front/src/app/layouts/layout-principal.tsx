import { Outlet } from 'react-router-dom';
import { Cabecalho } from '@/app/layouts/cabecalho';
import { Rodape } from '@/app/layouts/rodape';
import { PularParaConteudo } from '@/components/pular-para-conteudo';

export function LayoutPrincipal() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PularParaConteudo />
      <Cabecalho />
      <main id="conteudo" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-6 lg:px-8">
        <Outlet />
      </main>
      <Rodape />
    </div>
  );
}
