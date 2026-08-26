import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatarPreco } from '@/lib/formato';
import type { DivergenciaCarrinho } from '@/types/pedido';

interface PropriedadesAviso {
  divergencias: DivergenciaCarrinho[];
  aoAjustar: () => void;
}

function descrever(divergencia: DivergenciaCarrinho): string {
  switch (divergencia.tipo) {
    case 'PRECO_ALTERADO':
      return divergencia.precoAtualEmCentavos == null
        ? `${divergencia.nome}: o preço mudou desde que o produto entrou no carrinho.`
        : `${divergencia.nome}: o preço mudou de ${formatarPreco(
            divergencia.precoAnteriorEmCentavos ?? 0,
          )} para ${formatarPreco(divergencia.precoAtualEmCentavos)}.`;
    case 'ESTOQUE_INSUFICIENTE':
      return `${divergencia.nome}: restam apenas ${divergencia.quantidadeDisponivel} unidades, e você pediu ${divergencia.quantidadeSolicitada}.`;
    case 'INDISPONIVEL':
      return `${divergencia.nome} não está mais disponível.`;
  }
}

/**
 * RF-CHK-08. Descobrir que o preco mudou **no pagamento** e pior do que
 * descobrir agora: aqui ainda da para decidir sem sensacao de armadilha.
 *
 * O aviso bloqueia o avanco ate o usuario ajustar o carrinho — nao ha botao de
 * "aceitar e seguir", porque aceitar em silencio e o que gera a reclamacao.
 */
export function AvisoDivergencias({ divergencias, aoAjustar }: PropriedadesAviso) {
  if (divergencias.length === 0) return null;

  return (
    <div role="alert" className="space-y-3 rounded-md border border-alerta/40 bg-alerta/10 p-4">
      <p className="flex items-center gap-2 font-medium text-alerta">
        <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />O carrinho mudou desde que
        você montou
      </p>
      <ul className="list-inside list-disc space-y-1 text-sm">
        {divergencias.map((divergencia) => (
          <li key={`${divergencia.produtoId}-${divergencia.tipo}`}>{descrever(divergencia)}</li>
        ))}
      </ul>
      <Button variante="secundario" tamanho="pequeno" onClick={aoAjustar}>
        Voltar ao carrinho
      </Button>
    </div>
  );
}
