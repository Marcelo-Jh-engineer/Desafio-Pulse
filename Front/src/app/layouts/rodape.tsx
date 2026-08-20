import { Dentinho } from '@/components/dentinho';
import { Separator } from '@/components/ui/separator';

export function Rodape() {
  const ano = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3">
            <Dentinho tamanho="marca" alt="" />
            <p className="text-sm font-medium">Você no Coração da Gente</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Hortifrúti, bebidas, padaria, limpeza e mercearia.
          </p>
        </div>
        <Separator className="my-6" />
        <p className="text-center text-xs text-muted-foreground">
          © {ano} Você no Coração da Gente. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
