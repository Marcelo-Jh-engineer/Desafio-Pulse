import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Preco } from '@/components/preco';
import type { Carrinho } from '@/types/carrinho';

interface PropriedadesResumo {
  carrinho: Carrinho;
  /** Bloqueia o checkout quando alguma linha passou do estoque disponivel. */
  bloqueado: boolean;
}

/** Total do carrinho — RF-CAR-04. Derivado das linhas, nunca digitado. */
export function ResumoCarrinho({ carrinho, bloqueado }: PropriedadesResumo) {
  return (
    <Card className="sticky top-24">
      <CardContent className="space-y-4 pt-6">
        <h2 className="text-xl font-semibold">Resumo</h2>

        <p className="text-sm text-muted-foreground">
          {carrinho.quantidadeItens} {carrinho.quantidadeItens === 1 ? 'item' : 'itens'}
        </p>

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
