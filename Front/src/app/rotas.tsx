import { createBrowserRouter } from 'react-router-dom';
import { LayoutPrincipal } from '@/app/layouts/layout-principal';
import { LimiteDeErroDaRota } from '@/app/paginas/limite-de-erro-da-rota';
import { PaginaNaoEncontrada } from '@/app/paginas/pagina-nao-encontrada';
import { RotaDeLoja } from '@/components/rota-de-loja';
import { RotaProtegida } from '@/components/rota-protegida';

/**
 * Mapa de rotas de docs/behavior.md secao 1.
 *
 * Cada tela e carregada sob demanda — RNF-PERF-02, divisao de codigo por rota.
 * A area administrativa fica em pedaco proprio, entao nao pesa no bundle de
 * quem so compra.
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
          return {
            Component: () => (
              <RotaDeLoja>
                <PaginaCatalogo />
              </RotaDeLoja>
            ),
          };
        },
      },
      {
        path: 'produtos/:id',
        lazy: async () => {
          const { PaginaProduto } = await import('@/features/catalogo/paginas/pagina-produto');
          return {
            Component: () => (
              <RotaDeLoja>
                <PaginaProduto />
              </RotaDeLoja>
            ),
          };
        },
      },

      // Login e cadastro so fazem sentido deslogado: quem ja tem sessao e
      // devolvido para a rota de entrada do proprio papel.
      {
        path: 'login',
        lazy: async () => {
          const { PaginaLogin } = await import('@/features/autenticacao/paginas/pagina-login');
          return {
            Component: () => (
              <RotaProtegida apenasAnonimo>
                <PaginaLogin />
              </RotaProtegida>
            ),
          };
        },
      },
      {
        path: 'cadastro',
        lazy: async () => {
          const { PaginaCadastro } =
            await import('@/features/autenticacao/paginas/pagina-cadastro');
          return {
            Component: () => (
              <RotaProtegida apenasAnonimo>
                <PaginaCadastro />
              </RotaProtegida>
            ),
          };
        },
      },

      {
        path: 'carrinho',
        lazy: async () => {
          const { PaginaCarrinho } = await import('@/features/carrinho/paginas/pagina-carrinho');
          return {
            Component: () => (
              <RotaProtegida papeis={['CLIENTE']}>
                <PaginaCarrinho />
              </RotaProtegida>
            ),
          };
        },
      },

      {
        path: 'checkout',
        lazy: async () => {
          const { PaginaCheckout } = await import('@/features/checkout/paginas/pagina-checkout');
          return {
            Component: () => (
              <RotaProtegida papeis={['CLIENTE']}>
                <PaginaCheckout />
              </RotaProtegida>
            ),
          };
        },
      },
      {
        path: 'checkout/pagamento',
        lazy: async () => {
          const { PaginaPagamento } =
            await import('@/features/checkout/paginas/pagina-pagamento');
          return {
            Component: () => (
              <RotaProtegida papeis={['CLIENTE']}>
                <PaginaPagamento />
              </RotaProtegida>
            ),
          };
        },
      },
      {
        path: 'pedidos',
        lazy: async () => {
          const { PaginaPedidos } = await import('@/features/checkout/paginas/pagina-pedidos');
          return {
            Component: () => (
              <RotaProtegida papeis={['CLIENTE']}>
                <PaginaPedidos />
              </RotaProtegida>
            ),
          };
        },
      },
      {
        path: 'pedidos/:id/confirmacao',
        lazy: async () => {
          const { PaginaConfirmacao } =
            await import('@/features/checkout/paginas/pagina-confirmacao');
          return {
            Component: () => (
              <RotaProtegida papeis={['CLIENTE']}>
                <PaginaConfirmacao />
              </RotaProtegida>
            ),
          };
        },
      },
      {
        path: 'pedidos/:id',
        lazy: async () => {
          const { PaginaStatusPedido } =
            await import('@/features/checkout/paginas/pagina-status-pedido');
          return {
            Component: () => (
              <RotaProtegida papeis={['CLIENTE']}>
                <PaginaStatusPedido />
              </RotaProtegida>
            ),
          };
        },
      },

      // Area administrativa. Todo o pedaco fica fora do bundle de quem so
      // compra — RNF-PERF-02.
      {
        path: 'admin/produtos',
        lazy: async () => {
          const { PaginaAdminProdutos } =
            await import('@/features/admin/paginas/pagina-admin-produtos');
          return {
            Component: () => (
              <RotaProtegida papeis={['ADMIN']}>
                <PaginaAdminProdutos />
              </RotaProtegida>
            ),
          };
        },
      },
      {
        path: 'admin/produtos/novo',
        lazy: async () => {
          const { PaginaNovoProduto } =
            await import('@/features/admin/paginas/pagina-novo-produto');
          return {
            Component: () => (
              <RotaProtegida papeis={['ADMIN']}>
                <PaginaNovoProduto />
              </RotaProtegida>
            ),
          };
        },
      },
      {
        path: 'admin/categorias',
        lazy: async () => {
          const { PaginaCategorias } = await import('@/features/admin/paginas/pagina-categorias');
          return {
            Component: () => (
              <RotaProtegida papeis={['ADMIN']}>
                <PaginaCategorias />
              </RotaProtegida>
            ),
          };
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
