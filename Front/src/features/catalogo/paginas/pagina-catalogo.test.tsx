import { describe, expect, it } from 'vitest';
import { Route, Routes, useLocation } from 'react-router-dom';
import { renderizar, screen, usuario, waitFor, within } from '@/test/utilitarios';
import { PaginaCatalogo } from '@/features/catalogo/paginas/pagina-catalogo';

/**
 * Testes de comportamento — RNF-MAN-04. Nenhum detalhe de implementacao: a
 * consulta passa pelo cliente HTTP real e e atendida pelos handlers do MSW.
 */
/** MemoryRouter nao toca em `window.location`, entao a URL sai daqui. */
function SondaDeUrl() {
  const { search } = useLocation();
  return <span data-testid="url-atual">{search}</span>;
}

function urlAtual() {
  return screen.getByTestId('url-atual').textContent ?? '';
}

function montar(rota = '/') {
  return renderizar(
    <>
      <SondaDeUrl />
      <Routes>
        <Route path="/" element={<PaginaCatalogo />} />
      </Routes>
    </>,
    { rota },
  );
}

async function aguardarGrade() {
  return screen.findByRole('region', { name: 'Produtos' }, { timeout: 3000 });
}

describe('PaginaCatalogo', () => {
  it('mostra skeleton antes dos dados e depois a grade — RF-CAT-01', async () => {
    montar();

    expect(screen.getByLabelText('Carregando produtos')).toBeInTheDocument();

    const grade = await aguardarGrade();
    expect(within(grade).getAllByRole('listitem')).toHaveLength(12);
    expect(screen.getByText('14 produtos encontrados', { exact: false })).toBeInTheDocument();
  });

  it('exibe nome, preco e disponibilidade em cada cartao — RF-CAT-02', async () => {
    montar();
    await aguardarGrade();

    expect(screen.getByRole('heading', { name: 'Banana Prata' })).toBeInTheDocument();
    expect(screen.getByText('R$ 7,99')).toBeInTheDocument();
    expect(screen.getAllByText('Disponível').length).toBeGreaterThan(0);
  });

  it('marca produto sem estoque como indisponivel sem tirar da grade — RF-CAT-08', async () => {
    montar('/?categoria=hortifruti');
    await aguardarGrade();

    expect(screen.getByRole('heading', { name: 'Alface Crespa' })).toBeInTheDocument();
    expect(screen.getByText('Indisponível')).toBeInTheDocument();
  });

  it('filtra por categoria e reflete na URL — RF-CAT-03 e RF-CAT-06', async () => {
    montar();
    await aguardarGrade();

    await usuario.click(await screen.findByRole('radio', { name: 'Bebidas' }));

    await waitFor(() => {
      expect(screen.getByText('3 produtos encontrados')).toBeInTheDocument();
    });
    expect(urlAtual()).toContain('categoria=bebidas');
  });

  it('carrega as categorias da API, nunca codificadas no front — RF-CAT-05', async () => {
    montar();

    // As seis categorias da fixture mais a opcao "Todas".
    const opcoes = await screen.findAllByRole('radio');
    expect(opcoes).toHaveLength(7);
    expect(screen.getByRole('radio', { name: 'Açougue' })).toBeInTheDocument();
  });

  it('parte de uma URL com filtro ja aplicado — RF-CAT-06', async () => {
    montar('/?categoria=acougue');
    await aguardarGrade();

    expect(screen.getByText('2 produtos encontrados')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Açougue' })).toBeChecked();
  });

  it('busca por nome e mostra estado vazio quando nao ha resultado — RF-CAT-09', async () => {
    montar();
    await aguardarGrade();

    await usuario.type(screen.getByLabelText('Buscar produto'), 'arroz');
    await waitFor(() => {
      expect(screen.getByText('1 produto encontrado')).toBeInTheDocument();
    });

    await usuario.clear(screen.getByLabelText('Buscar produto'));
    await usuario.type(screen.getByLabelText('Buscar produto'), 'caviar');
    expect(await screen.findByText('Nenhum resultado para "caviar"')).toBeInTheDocument();
  });

  it('ordena por menor preco — RF-CAT-10', async () => {
    montar();
    const grade = await aguardarGrade();

    await usuario.selectOptions(screen.getByLabelText('Ordenar por'), 'PRECO_ASC');

    await waitFor(() => {
      const titulos = within(grade).getAllByRole('heading', { level: 3 });
      expect(titulos[0]).toHaveTextContent('Água Mineral 500ml');
    });
  });

  it('pagina preservando o filtro ativo — RF-CAT-04', async () => {
    montar();
    await aguardarGrade();

    await usuario.click(screen.getByRole('button', { name: 'Página 2' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });
    expect(urlAtual()).toContain('pagina=1');
  });

  it('categoria inexistente na URL cai em estado vazio, nunca em erro', async () => {
    montar('/?categoria=inexistente');

    expect(await screen.findByText('Nenhum produto nesta categoria')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Limpar filtros' })).toBeInTheDocument();
  });

  it('pagina alem do total volta para a ultima valida', async () => {
    montar('/?pagina=99');
    await aguardarGrade();

    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
