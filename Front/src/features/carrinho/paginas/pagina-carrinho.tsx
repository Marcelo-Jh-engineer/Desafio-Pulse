import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { TituloDaPagina } from '@/components/titulo-da-pagina';
import { EstadoVazio } from '@/components/estado-vazio';
import { Button } from '@/components/ui/button';
import { LinhaItemCarrinho } from '@/features/carrinho/componentes/linha-item-carrinho';
import { ResumoCarrinho } from '@/features/carrinho/componentes/resumo-carrinho';
import { useCarrinho, useCarrinhoStore } from '@/lib/carrinho-store';
import { tetoDaLinha } from '@/lib/carrinho-calculo';

/** Carrinho — RF-CAR-02 a RF-CAR-05 e RF-CAR-09. */
export function PaginaCarrinho() {
  const carrinho = useCarrinho();
  const definirQuantidade = useCarrinhoStore((estado) => estado.definirQuantidade);
  const remover = useCarrinhoStore((estado) => estado.remover);
  const restaurar = useCarrinhoStore((estado) => estado.restaurar);

  if (carrinho.itens.length === 0) {
    return (
      <div className="space-y-6">
        <TituloDaPagina tituloDocumento="Carrinho">Carrinho</TituloDaPagina>
        <EstadoVazio
          titulo="Seu carrinho está vazio"
          descricao="Escolha seus produtos no catálogo e eles aparecem aqui."
          acao={
            <Button variante="primario" asChild>
              <Link to="/">Ver o catálogo</Link>
            </Button>
          }
        />
      </div>
    );
  }

  // Uma linha acima do estoque trava o checkout ate ser ajustada.
  const bloqueado = carrinho.itens.some(
    (item) => item.quantidade > tetoDaLinha(item.estoqueDisponivel),
  );

  function removerComDesfazer(produtoId: string) {
    const posicao = carrinho.itens.findIndex((item) => item.produtoId === produtoId);
    const removido = remover(produtoId);
    if (!removido) return;

    // RF-CAR-09: remocao imediata, com 5 s para voltar atras.
    toast(`${removido.nome} removido do carrinho`, {
      duration: 5000,
      action: {
        label: 'Desfazer',
        onClick: () => {
          restaurar(removido, posicao);
        },
      },
    });
  }

  return (
    <div className="space-y-6">
      <TituloDaPagina tituloDocumento="Carrinho">Carrinho</TituloDaPagina>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <section aria-label="Itens do carrinho">
          <ul>
            {carrinho.itens.map((item) => (
              <LinhaItemCarrinho
                key={item.produtoId}
                item={item}
                aoMudarQuantidade={(quantidade) => {
                  definirQuantidade(item.produtoId, quantidade);
                }}
                aoRemover={() => {
                  removerComDesfazer(item.produtoId);
                }}
              />
            ))}
          </ul>
        </section>

        <aside aria-label="Resumo do pedido">
          <ResumoCarrinho carrinho={carrinho} bloqueado={bloqueado} />
        </aside>
      </div>
    </div>
  );
}
