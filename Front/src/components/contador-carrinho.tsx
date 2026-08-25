import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCarrinho } from '@/hooks/use-carrinho';

/**
 * Contador do cabecalho — RF-CAR-06.
 *
 * O numero so aparece acima de zero, e a mudanca e anunciada por `aria-live`
 * (RNF-A11Y-05): quem nao ve o badge precisa ouvir que o item entrou.
 */
export function ContadorCarrinho() {
  const { carrinho } = useCarrinho();
  const { quantidadeItens } = carrinho;

  return (
    <Button variante="fantasma" tamanho="icone" className="relative" asChild>
      <Link
        to="/carrinho"
        aria-label={
          quantidadeItens > 0
            ? `Carrinho com ${quantidadeItens} ${quantidadeItens === 1 ? 'item' : 'itens'}`
            : 'Carrinho vazio'
        }
      >
        <ShoppingCart aria-hidden="true" />
        {quantidadeItens > 0 ? (
          <span
            aria-hidden="true"
            className="numeros-tabulares absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1 text-xs font-bold text-secondary-foreground"
          >
            {quantidadeItens}
          </span>
        ) : null}
        <span aria-live="polite" className="sr-only">
          {quantidadeItens > 0 ? `${quantidadeItens} no carrinho` : ''}
        </span>
      </Link>
    </Button>
  );
}
