import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { TituloDaPagina } from '@/components/titulo-da-pagina';
import { EstadoVazio } from '@/components/estado-vazio';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LinhaItemCarrinho } from '@/features/carrinho/componentes/linha-item-carrinho';
import { ResumoCarrinho } from '@/features/carrinho/componentes/resumo-carrinho';
import { useAdicionarAoCarrinho, useCarrinho, useRemoverDoCarrinho } from '@/hooks/use-carrinho';
import { tetoDaLinha } from '@/lib/carrinho-calculo';
import { ErroDeAplicacao, MENSAGENS_ERRO } from '@/lib/erros';

/**
 * Carrinho — RF-CAR-02 a RF-CAR-05 e RF-CAR-09.
 *
 * O carrinho é do servidor. Cada mudança é uma requisição, e a resposta traz o
 * carrinho inteiro já recalculado — a tela não soma nada.
 */
export function PaginaCarrinho() {
  const { carrinho, isPending, isError, refetch } = useCarrinho();
  const adicionar = useAdicionarAoCarrinho();
  const remover = useRemoverDoCarrinho();

  const salvando = adicionar.isPending || remover.isPending;

  function avisarErro(erro: unknown) {
    toast.error(erro instanceof ErroDeAplicacao ? erro.message : MENSAGENS_ERRO.servidor);
  }

  /**
   * A tela pensa em quantidade final; a API pensa em quanto entra e quanto sai.
   * A conversão é aqui: a diferença vira uma adição ou uma remoção.
   */
  function mudarQuantidade(produtoId: string, atual: number, desejada: number) {
    const diferenca = desejada - atual;
    if (diferenca === 0) return;

    const acao = diferenca > 0 ? adicionar : remover;
    acao.mutate({ produtoId, quantidade: Math.abs(diferenca) }, { onError: avisarErro });
  }

  /**
   * Remoção imediata, com 5 s para voltar atrás — RF-CAR-09.
   *
   * O "desfazer" reenvia a mesma quantidade como adição. Se o estoque tiver
   * acabado nesse intervalo, o servidor recusa — e é o comportamento certo: o
   * item não estava mais reservado para ninguém.
   */
  function removerComDesfazer(produtoId: string, nome: string, quantidade: number) {
    remover.mutate(
      { produtoId, quantidade },
      {
        onError: avisarErro,
        onSuccess: () => {
          toast(`${nome} removido do carrinho`, {
            duration: 5000,
            action: {
              label: 'Desfazer',
              onClick: () => {
                adicionar.mutate({ produtoId, quantidade }, { onError: avisarErro });
              },
            },
          });
        },
      },
    );
  }

  if (isPending) {
    return (
      <div className="space-y-6">
        <TituloDaPagina tituloDocumento="Carrinho">Carrinho</TituloDaPagina>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <TituloDaPagina tituloDocumento="Carrinho">Carrinho</TituloDaPagina>
        <EstadoVazio
          titulo="Não foi possível carregar seu carrinho"
          descricao={MENSAGENS_ERRO.servidor}
          acao={
            <Button
              variante="primario"
              onClick={() => {
                void refetch();
              }}
            >
              Tentar de novo
            </Button>
          }
        />
      </div>
    );
  }

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

  // Uma linha acima do estoque trava o checkout até ser ajustada. O estoque
  // vem do servidor a cada leitura, então pode ter caído desde a adição.
  const bloqueado = carrinho.itens.some(
    (item) => item.quantidade > tetoDaLinha(item.estoqueDisponivel),
  );

  return (
    <div className="space-y-6">
      <TituloDaPagina tituloDocumento="Carrinho">Carrinho</TituloDaPagina>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <section aria-label="Itens do carrinho" aria-busy={salvando}>
          <ul>
            {carrinho.itens.map((item) => (
              <LinhaItemCarrinho
                key={item.produtoId}
                item={item}
                aoMudarQuantidade={(quantidade) => {
                  mudarQuantidade(item.produtoId, item.quantidade, quantidade);
                }}
                aoRemover={() => {
                  removerComDesfazer(item.produtoId, item.nome, item.quantidade);
                }}
              />
            ))}
          </ul>
        </section>

        <aside aria-label="Resumo do pedido">
          <ResumoCarrinho carrinho={carrinho} bloqueado={bloqueado || salvando} />
        </aside>
      </div>
    </div>
  );
}
