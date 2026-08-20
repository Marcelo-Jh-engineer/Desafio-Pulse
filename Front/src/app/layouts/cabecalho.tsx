import { Link, NavLink } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { Dentinho } from '@/components/dentinho';
import { Button } from '@/components/ui/button';
import { useTema } from '@/app/provedores/contexto-tema';
import { cn } from '@/lib/utils';

/**
 * Manifestacao mais visivel do RBAC — docs/behavior.md secao 2.
 *
 * F0 entrega a estrutura com a visao de VISITANTE. Na F2 o header passa a
 * reagir ao papel da sessao: contador de carrinho para CLIENTE, link
 * administrativo para ADMIN, menu do usuario no lugar de Entrar e Cadastrar.
 */
export function Cabecalho() {
  const { temaEfetivo, definirTema } = useTema();
  const escuro = temaEfetivo === 'dark';

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Dentinho tamanho="marca" alt="" />
          <span className="hidden text-base font-bold leading-tight text-primary sm:inline">
            Você no Coração
            <span className="block text-xs font-medium text-muted-foreground">da Gente</span>
          </span>
        </Link>

        <nav aria-label="Navegação principal" className="ml-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
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
            onClick={() => {
              definirTema(escuro ? 'claro' : 'escuro');
            }}
            aria-label={escuro ? 'Usar tema claro' : 'Usar tema escuro'}
          >
            {escuro ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
          </Button>

          {/* F2 troca este bloco pelo menu do usuario quando houver sessao. */}
          <Button variante="fantasma" tamanho="pequeno" asChild>
            <Link to="/login">Entrar</Link>
          </Button>
          <Button variante="primario" tamanho="pequeno" asChild>
            <Link to="/cadastro">Cadastrar</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
