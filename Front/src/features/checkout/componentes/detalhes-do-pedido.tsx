import { Preco } from '@/components/preco';
import { Separator } from '@/components/ui/separator';
import { mascararDocumento } from '@/lib/formato';
import { detectarTipoIdentificador } from '@/lib/documento';
import type { Pedido } from '@/types/pedido';

/**
 * Itens congelados, totais, endereco e comprador. Compartilhado entre a
 * confirmacao e a tela de status — as duas mostram o mesmo pedido, mudam so a
 * moldura em volta.
 *
 * O login aparece **mascarado quando é documento**: CPF e CNPJ são dado pessoal
 * e fora do perfil nunca saem por extenso (RNF-SEC-04). Login que é e-mail
 * aparece inteiro — já está logo acima, no campo de contato.
 */
function exibirLogin(login: string): string {
  return detectarTipoIdentificador(login) === 'EMAIL' ? login : mascararDocumento(login);
}

/**
 * Itens congelados, total e comprador. O pedido nao guarda endereco de
 * entrega, entao nao ha o que exibir sobre destino.
 */
export function DetalhesDoPedido({ pedido }: { pedido: Pedido }) {
  return (
    <div className="space-y-6">
      <section aria-labelledby="titulo-itens" className="space-y-3">
        <h2 id="titulo-itens" className="text-xl font-semibold">
          Itens
        </h2>
        <ul className="space-y-2">
          {pedido.itens.map((item) => (
            <li key={item.produtoId} className="flex justify-between gap-3 text-sm">
              <span className="min-w-0">
                {item.quantidade}× {item.nome}
              </span>
              <Preco centavos={item.totalLinhaEmCentavos} className="shrink-0 text-sm" />
            </li>
          ))}
        </ul>

        <Separator />

        <dl className="space-y-1 text-sm">
          <div className="flex items-baseline justify-between">
            <dt className="font-semibold">Total</dt>
            <dd>
              <Preco centavos={pedido.totalEmCentavos} className="text-xl" />
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="titulo-comprador" className="space-y-2">
        <h2 id="titulo-comprador" className="text-xl font-semibold">
          Comprador
        </h2>
        <p className="text-sm text-muted-foreground">
          {pedido.nomeComprador}
          <br />
          {pedido.emailComprador}
          <br />
          {exibirLogin(pedido.loginComprador)}
        </p>
      </section>
    </div>
  );
}
