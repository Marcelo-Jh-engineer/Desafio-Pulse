import { Link, NavLink } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { Dentinho } from '@/components/dentinho';
import { Button } from '@/components/ui/button';
import { useTema } from '@/app/provedores/contexto-tema';
import { cn } from '@/lib/utils';

/** Sobre o azul solido nenhum botao pode usar `text-primary`: some no fundo. */
const BOTAO_SOBRE_AZUL = 'text-white hover:bg-white/15 hover:text-white';

/**
 * Manifestacao mais visivel do RBAC — docs/behavior.md secao 2.
 *
 * A barra e uma superficie de marca solida (docs/design.md secao 4.3): azul do
 * logotipo com texto branco a 8.26:1 e turquesa marcando o item ativo a 6.04:1.
 *
 * F0 entrega a estrutura com a visao de VISITANTE. Na F2 o header passa a
 * reagir ao papel da sessao: contador de carrinho para CLIENTE, link
 * administrativo para ADMIN, menu do usuario no lugar de Entrar e Cadastrar.
 */
export function Cabecalho() {
  const { temaEfetivo, definirTema } = useTema();
  const escuro = temaEfetivo === 'dark';

  return (
    <header className="superficie-marca sticky top-0 z-40 w-full shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-marca-azul-700 dark:focus-visible:ring-offset-marca-azul-900"
        >
          <Dentinho tamanho="marca" alt="" />
          <span className="hidden text-base font-bold leading-tight text-white sm:inline">
            Você no Coração
            <span className="block text-xs font-medium text-marca-turquesa-300">da Gente</span>
          </span>
        </Link>

        <nav aria-label="Navegação principal" className="ml-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                'relative rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'text-marca-turquesa-300 after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-marca-turquesa-300'
                  : 'text-white/80 hover:text-white',
              )
            }
          >
            Catálogo
          </NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variante="fantasma"
            tamanho="icone"
            className={BOTAO_SOBRE_AZUL}
            onClick={() => {
              definirTema(escuro ? 'claro' : 'escuro');
            }}
            aria-label={escuro ? 'Usar tema claro' : 'Usar tema escuro'}
          >
            {escuro ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
          </Button>

          {/* F2 troca este bloco pelo menu do usuario quando houver sessao.
              O turquesa nao entra aqui: e reservado a acao de conversao — uma
              por vista, docs/design.md secao 8.4. */}
          <Button variante="fantasma" tamanho="pequeno" className={BOTAO_SOBRE_AZUL} asChild>
            <Link to="/login">Entrar</Link>
          </Button>
          <Button
            variante="secundario"
            tamanho="pequeno"
            className="border-white/70 text-white hover:bg-white hover:text-marca-azul-700"
            asChild
          >
            <Link to="/cadastro">Cadastrar</Link>
          </Button>
        </div>
      </div>

      <div aria-hidden="true" className="fio-marca h-0.5 w-full" />
    </header>
  );
}
