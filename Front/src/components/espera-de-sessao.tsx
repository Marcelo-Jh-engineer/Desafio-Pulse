import { Skeleton } from '@/components/ui/skeleton';

/**
 * Ocupa a tela enquanto o front pergunta ao servidor se o cookie de sessao
 * ainda vale.
 *
 * A alternativa seria decidir com a sessao ainda vazia, e o resultado apareceria
 * na cara do usuario: quem recarrega uma rota protegida piscaria o login antes
 * de voltar para onde estava, e o administrador veria a loja por um instante
 * antes do desvio. Sao milissegundos, mas sao os milissegundos errados.
 */
export function EsperaDeSessao() {
  return (
    <div
      className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-16"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Restaurando sua sessão…</span>
      <Skeleton className="h-8 w-52" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
