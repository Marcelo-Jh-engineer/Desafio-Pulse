import { describe, expect, it } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { renderizar, screen } from '@/test/utilitarios';
import { PaginaProduto } from '@/features/catalogo/paginas/pagina-produto';

function montar(slug: string) {
  return renderizar(
    <Routes>
      <Route path="/produtos/:slug" element={<PaginaProduto />} />
    </Routes>,
    { rota: `/produtos/${slug}` },
  );
}

describe('PaginaProduto', () => {
  it('mostra descricao completa, preco e categoria — RF-CAT-07', async () => {
    montar('banana-prata');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Banana Prata' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Banana prata selecionada/)).toBeInTheDocument();
    expect(screen.getByText('R$ 7,99')).toBeInTheDocument();
    expect(screen.getByText('Disponível')).toBeInTheDocument();
  });

  it('leva ao catalogo ja filtrado pela categoria — docs/behavior.md secao 4', async () => {
    montar('banana-prata');
    await screen.findByRole('heading', { level: 1, name: 'Banana Prata' });

    const trilha = screen.getByRole('navigation', { name: 'Trilha de navegação' });
    expect(screen.getByRole('link', { name: 'Hortifrúti' })).toHaveAttribute(
      'href',
      '/?categoria=hortifruti',
    );
    expect(trilha).toHaveTextContent('Catálogo');
  });

  it('produto sem estoque explica o motivo em texto, nao so na cor — RF-CAT-08', async () => {
    montar('alface-crespa');
    await screen.findByRole('heading', { level: 1, name: 'Alface Crespa' });

    expect(screen.getByText('Indisponível')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Produto indisponível no momento');
  });

  it('slug inexistente devolve 404, nao tela em branco', async () => {
    montar('produto-que-nao-existe');

    expect(await screen.findByText('Esta página não existe')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar ao catálogo' })).toBeInTheDocument();
  });

  it('anuncia o preco por extenso para leitor de tela', async () => {
    montar('banana-prata');
    await screen.findByRole('heading', { level: 1, name: 'Banana Prata' });

    expect(screen.getByText('7 reais e 99 centavos por quilo')).toBeInTheDocument();
  });
});
