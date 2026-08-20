import { describe, expect, it } from 'vitest';
import { renderizar, screen } from '@/test/utilitarios';
import { PaginaAcessoNegado } from '@/app/paginas/pagina-acesso-negado';
import { PaginaNaoEncontrada } from '@/app/paginas/pagina-nao-encontrada';

describe('Páginas de erro da F0', () => {
  it('403 explica que a sessão continua ativa — não é sessão expirada', () => {
    renderizar(<PaginaAcessoNegado />);

    expect(screen.getByRole('heading', { name: /não tem acesso/i })).toBeInTheDocument();
    expect(screen.getByText(/sua conta continua ativa/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar ao catálogo' })).toHaveAttribute('href', '/');
  });

  it('404 sempre oferece caminho de volta ao catálogo', () => {
    renderizar(<PaginaNaoEncontrada />);

    expect(screen.getByRole('heading', { name: /não existe/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar ao catálogo' })).toHaveAttribute('href', '/');
  });

  it('usa o mascote como ilustração decorativa, com o texto carregando o significado', () => {
    const { container } = renderizar(<PaginaNaoEncontrada />);
    const imagem = container.querySelector('img');

    expect(imagem).toHaveAttribute('alt', '');
    expect(imagem).toHaveAttribute('aria-hidden', 'true');
  });
});
