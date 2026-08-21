import { Dentinho } from '@/components/dentinho';
import { Separator } from '@/components/ui/separator';

/**
 * Fecha a pagina na mesma superficie de marca do cabecalho, um degrau mais
 * escuro. Branco sobre `marca-azul-900` da 13.88:1 — docs/design.md secao 4.3.
 */
export function Rodape() {
  const ano = new Date().getFullYear();

  return (
    <footer className="superficie-marca mt-auto bg-marca-azul-900">
      <div aria-hidden="true" className="fio-marca h-0.5 w-full" />
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3">
            <Dentinho tamanho="marca" alt="" />
            <p className="text-sm font-medium text-white">Você no Coração da Gente</p>
          </div>
          <p className="text-sm text-marca-turquesa-200">
            Hortifrúti, bebidas, padaria, limpeza e mercearia.
          </p>
        </div>
        <Separator className="my-6 bg-white/20" />
        <p className="text-center text-xs text-white/70">
          © {ano} Você no Coração da Gente. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
