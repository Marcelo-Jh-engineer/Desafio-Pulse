import { createBrowserRouter } from 'react-router-dom';
import { LayoutPrincipal } from '@/app/layouts/layout-principal';
import { LimiteDeErroDaRota } from '@/app/paginas/limite-de-erro-da-rota';
import { PaginaNaoEncontrada } from '@/app/paginas/pagina-nao-encontrada';

/**
 * Mapa de rotas de docs/behavior.md secao 1. As rotas de F1 a F5 entram nas
 * suas fases; as marcadas abaixo ja existem na F0.
 *
 * Cada tela e carregada sob demanda — RNF-PERF-03, divisao de codigo por rota.
 */
export const rotas = createBrowserRouter([
  {
    element: <LayoutPrincipal />,
    errorElement: <LimiteDeErroDaRota />,
    children: [
      {
        index: true,
        lazy: async () => {
          const { PaginaCatalogo } = await import('@/features/catalogo/paginas/pagina-catalogo');
          return { Component: PaginaCatalogo };
        },
      },
      {
        path: '403',
        lazy: async () => {
          const { PaginaAcessoNegado } = await import('@/app/paginas/pagina-acesso-negado');
          return { Component: PaginaAcessoNegado };
        },
      },
      // A 404 fica no pacote inicial de proposito: o limite de erro tambem a
      // usa, entao carregar sob demanda so criaria um pedido a mais.
      { path: '*', element: <PaginaNaoEncontrada /> },
    ],
  },
]);
