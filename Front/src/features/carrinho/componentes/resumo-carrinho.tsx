import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Preco } from '@/components/preco';
import { faltaParaFreteGratis } from '@/lib/carrinho-calculo';
import { formatarPreco } from '@/lib/formato';
import type { Carrinho } from '@/types/carrinho';

interface PropriedadesResumo {
  carrinho: Carrinho;
  /** Bloqueia o checkout quando alguma linha passou do estoque disponivel. */
  bloqueado: boolean;
}

/** Subtotal, frete e total — RF-CAR-04. Todos derivados, nenhum digitado. */
export function ResumoCarrinho({ carrinho, bloqueado }: PropriedadesResumo) {
  const falta = faltaParaFreteGratis(carrinho.subtotalEmCentavos);

  return (
    <Card className="sticky top-24">
      <CardContent className="space-y-4 pt-6">
        <h2 className="text-xl font-semibold">Resumo</h2>

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              Subtotal ({carrinho.quantidadeItens}{' '}
              {carrinho.quantidadeItens === 1 ? 'item' : 'itens'})
            </dt>
            <dd>
              <Preco centavos={carrinho.subtotalEmCentavos} className="font-medium" />
            </dd>
          </div>

          <div className="flex justify-between">
            <dt className="text-muted-foreground">Frete</dt>
            <dd>
              {carrinho.freteEmCentavos === 0 ? (
                <span className="font-medium text-sucesso">Grátis</span>
              ) : (
                <Preco centavos={carrinho.freteEmCentavos} className="font-medium" />
              )}
            </dd>
          </div>
        </dl>

        {falta > 0 ? (
          <p className="rounded-md bg-accent p-2 text-xs text-accent-foreground">
            Faltam {formatarPreco(falta)} para o frete sair de graça.
          </p>
        ) : null}

        <Separator />

        <div className="flex items-baseline justify-between">
          <span className="font-semibold">Total</span>
          {/* Mudanca de total anunciada por leitor de tela — RNF-A11Y-05. */}
          <span aria-live="polite">
            <Preco centavos={carrinho.totalEmCentavos} className="text-2xl" />
          </span>
        </div>

        <Button
          variante="acao"
          tamanho="grande"
          className="w-full"
          disabled={bloqueado}
          aria-disabled={bloqueado}
          asChild={!bloqueado}
        >
          {bloqueado ? (
            <span>Finalizar compra</span>
          ) : (
            <Link to="/checkout">Finalizar compra</Link>
          )}
        </Button>

        {bloqueado ? (
          <p role="status" className="text-xs text-muted-foreground">
            Ajuste as quantidades acima do estoque para continuar.
          </p>
        ) : null}

        <p className="text-center text-xs text-muted-foreground">
          O pagamento entra na próxima fase do projeto.
        </p>
      </CardContent>
    </Card>
  );
}
