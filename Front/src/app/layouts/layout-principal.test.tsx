import { describe, expect, it } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { renderizar, screen } from '@/test/utilitarios';
import { LayoutPrincipal } from '@/app/layouts/layout-principal';

function renderizarLayout() {
  return renderizar(
    <Routes>
      <Route element={<LayoutPrincipal />}>
        <Route path="/" element={<h1>Conteúdo da tela</h1>} />
      </Route>
    </Routes>,
  );
}

describe('LayoutPrincipal', () => {
  it('expõe o atalho de pular para o conteúdo como primeiro link focável', () => {
    renderizarLayout();

    const atalho = screen.getByRole('link', { name: 'Pular para o conteúdo' });

    expect(atalho).toHaveAttribute('href', '#conteudo');
  });

  it('renderiza o conteúdo da rota dentro do main identificado pelo atalho', () => {
    renderizarLayout();

    const principal = screen.getByRole('main');

    expect(principal).toHaveAttribute('id', 'conteudo');
    expect(principal).toContainElement(screen.getByRole('heading', { name: 'Conteúdo da tela' }));
  });

  it('mostra Entrar e Cadastrar para visitante, e nenhum acesso ao carrinho', () => {
    renderizarLayout();

    expect(screen.getByRole('link', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cadastrar' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /carrinho/i })).not.toBeInTheDocument();
  });
});
