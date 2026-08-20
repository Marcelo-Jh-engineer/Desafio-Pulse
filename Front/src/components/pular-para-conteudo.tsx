/** Primeiro elemento focavel da pagina — docs/behavior.md secao 13.1. */
export function PularParaConteudo() {
  return (
    <a
      href="#conteudo"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
    >
      Pular para o conteúdo
    </a>
  );
}
