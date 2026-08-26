import { Link, NavLink } from 'react-router-dom';
import { ClipboardList, LayoutDashboard, LogOut, Moon, Sun, User } from 'lucide-react';
import { Dentinho } from '@/components/dentinho';
import { Permitir } from '@/components/permitir';
import { ContadorCarrinho } from '@/components/contador-carrinho';
import { Button } from '@/components/ui/button';
import { useTema } from '@/app/provedores/contexto-tema';
import { useSair } from '@/hooks/use-sair';
import { useSessaoStore } from '@/lib/sessao-store';
import { cn } from '@/lib/utils';

/**
 * Manifestacao mais visivel do RBAC — docs/behavior.md secao 2.
 *
 * | Elemento              | VISITANTE | CLIENTE | ADMIN |
 * |-----------------------|-----------|---------|-------|
 * | Entrar e Cadastrar    | sim       | nao     | nao   |
 * | Menu do usuario       | nao       | sim     | sim   |
 * | Link administrativo   | nao       | nao     | sim   |
 *
 * O contador de carrinho entra na F3, so para CLIENTE.
 *
 * **O menu mostra nome e email, nunca o documento** — RNF-SEC-04.
 */
export function Cabecalho() {
  const { temaEfetivo, definirTema } = useTema();
  const autenticado = useSessaoStore((estado) => estado.autenticado);
  const usuario = useSessaoStore((estado) => estado.usuario);
  const temPapel = useSessaoStore((estado) => estado.temPapel);
  const sair = useSair();
  const escuro = temaEfetivo === 'dark';
  // Admin nao navega a loja — docs/behavior.md secao 2.
  const ehAdmin = autenticado && temPapel(['ADMIN']);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-6 lg:px-8">
        <Link
          to={ehAdmin ? '/admin/produtos' : '/'}
          className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Dentinho tamanho="marca" alt="" />
          <span className="hidden text-base font-bold leading-tight text-primary sm:inline">
            Você no Coração
            <span className="block text-xs font-medium text-muted-foreground">da Gente</span>
          </span>
        </Link>

        <nav aria-label="Navegação principal" className="ml-2 flex items-center gap-1">
          {ehAdmin ? null : (
            <ItemDeNavegacao para="/" exato>
              Catálogo
            </ItemDeNavegacao>
          )}

          <Permitir papeis={['CLIENTE']}>
            <ItemDeNavegacao para="/pedidos">
              <ClipboardList aria-hidden="true" className="inline size-4 md:mr-1" />
              <span className="sr-only md:not-sr-only">Meus pedidos</span>
            </ItemDeNavegacao>
          </Permitir>

          <Permitir papeis={['ADMIN']}>
            <ItemDeNavegacao para="/admin/produtos">
              <LayoutDashboard aria-hidden="true" className="mr-1 inline size-4" />
              Produtos
            </ItemDeNavegacao>
            <ItemDeNavegacao para="/admin/categorias">Categorias</ItemDeNavegacao>
          </Permitir>
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

          {/* Visitante nao tem carrinho, admin nao compra: so CLIENTE ve. */}
          <Permitir papeis={['CLIENTE']}>
            <ContadorCarrinho />
          </Permitir>

          {autenticado && usuario ? (
            <div className="flex items-center gap-2">
              <span className="hidden max-w-[16ch] items-center gap-1.5 truncate text-sm sm:flex">
                <User aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate font-medium">{usuario.nome}</span>
              </span>
              <Button variante="secundario" tamanho="pequeno" onClick={sair}>
                <LogOut aria-hidden="true" className="size-4" />
                Sair
              </Button>
            </div>
          ) : (
            <>
              <Button variante="fantasma" tamanho="pequeno" asChild>
                <Link to="/login">Entrar</Link>
              </Button>
              <Button variante="primario" tamanho="pequeno" asChild>
                <Link to="/cadastro">Cadastrar</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function ItemDeNavegacao({
  para,
  exato = false,
  children,
}: {
  para: string;
  exato?: boolean;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={para}
      end={exato}
      className={({ isActive }) =>
        cn(
          'rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
        )
      }
    >
      {children}
    </NavLink>
  );
}
