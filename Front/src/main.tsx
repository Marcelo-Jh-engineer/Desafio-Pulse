import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Provedores } from '@/app/provedores/provedores';
import { rotas } from '@/app/rotas';
import '@/index.css';

function iniciar(): void {
  const raiz = document.getElementById('root');
  if (!raiz) {
    throw new Error('Elemento #root não encontrado em index.html.');
  }

  createRoot(raiz).render(
    <StrictMode>
      <Provedores>
        <RouterProvider router={rotas} />
      </Provedores>
    </StrictMode>,
  );
}

iniciar();
