import { TituloDaPagina } from '@/components/titulo-da-pagina';
import { Dentinho } from '@/components/dentinho';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';

/**
 * Esqueleto da F0. A F1 substitui o conteudo pela grade de produtos, o filtro
 * de categorias vindo da API, busca, ordenacao e paginacao — RF-CAT-01 a
 * RF-CAT-10.
 */
export function PaginaCatalogo() {
  return (
    <div className="space-y-8">
      <section className="rounded-lg bg-accent px-6 py-10 sm:px-10">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
          <Dentinho tamanho="grande" alt="Dentinho, o castor mascote do supermercado" />
          <div className="space-y-3 text-center sm:text-left">
            <TituloDaPagina tituloDocumento="Catálogo" className="text-accent-foreground">
              Feira completa, do jeito que você gosta
            </TituloDaPagina>
            <p className="max-w-prose text-accent-foreground/80">
              Hortifrúti, bebidas, padaria, limpeza e mercearia — com o Dentinho tomando conta de
              tudo desde os anos 90.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="titulo-fundacao" className="space-y-4">
        <h2 id="titulo-fundacao" className="text-xl font-semibold">
          Fundação concluída
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="space-y-2 pt-4">
              <CardTitle>Tokens da marca</CardTitle>
              <CardDescription>
                Azul #004E98 e turquesa #73F1DD aplicados por variável CSS, com tema claro e
                escuro.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 pt-4">
              <CardTitle>Cliente HTTP encapsulado</CardTitle>
              <CardDescription>
                Um ponto único de acesso à API, com 401 e 403 tratados de formas diferentes.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 pt-4">
              <CardTitle>Próxima fase</CardTitle>
              <CardDescription>
                F1 — catálogo público com MSW, filtro por categoria, busca e paginação.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
