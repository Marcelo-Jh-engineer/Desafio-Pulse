import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Provedores } from '@/app/provedores/provedores';
import { rotas } from '@/app/rotas';
import '@/index.css';

/**
 * Com `VITE_API_MODE=mock` o worker precisa estar de pe **antes** do primeiro
 * render: pedido disparado durante a subida do worker escapa para a rede real.
 *
 * O import e dinamico de proposito — em `http` o modulo do MSW nem entra no
 * grafo do bundle de producao. Ver docs/prd.md secao 7.
 */
async function prepararMock(): Promise<void> {
  // Unico ponto do codigo que le `import.meta.env` fora de `lib/ambiente.ts`, e
  // por um motivo tecnico: o Vite troca esta expressao por um literal no build,
  // entao com `VITE_API_MODE=http` a condicao vira `false` constante e o Rollup
  // poda o `import()` junto. Testando pela constante `usandoMock` o import
  // sobrevive a poda e os 424 kB do MSW vao para producao — docs/prd.md 7.3.
  if (import.meta.env.VITE_API_MODE === 'http') return;

  const { iniciarWorker } = await import('@/mocks/navegador');
  await iniciarWorker();
}

async function iniciar(): Promise<void> {
  const raiz = document.getElementById('root');
  if (!raiz) {
    throw new Error('Elemento #root não encontrado em index.html.');
  }

  await prepararMock();

  createRoot(raiz).render(
    <StrictMode>
      <Provedores>
        <RouterProvider router={rotas} />
      </Provedores>
    </StrictMode>,
  );
}

void iniciar();
