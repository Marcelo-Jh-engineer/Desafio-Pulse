import { Link, useSearchParams } from 'react-router-dom';
import { EstadoErro } from '@/components/estado-erro';
import { EstadoVazio } from '@/components/estado-vazio';
import { Paginacao } from '@/components/paginacao';
import { TituloDaPagina } from '@/components/titulo-da-pagina';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CartaoPedido } from '@/features/checkout/componentes/cartao-pedido';
import { usePedidos } from '@/features/checkout/hooks/use-checkout';
import { ErroDeAplicacao } from '@/lib/erros';

const TAMANHO_DA_PAGINA = 10;

function lerPagina(valor: string | null): number {
  const pagina = Number(valor);
  return Number.isInteger(pagina) && pagina >= 0 ? pagina : 0;
}

export function PaginaPedidos() {
  const [parametros, definirParametros] = useSearchParams();
  const pagina = lerPagina(parametros.get('pagina'));
  const pedidos = usePedidos(pagina, TAMANHO_DA_PAGINA);

  function mudarPagina(novaPagina: number) {
    const novosParametros = new URLSearchParams(parametros);
    if (novaPagina === 0) novosParametros.delete('pagina');
    else novosParametros.set('pagina', String(novaPagina));
    definirParametros(novosParametros);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (pedidos.isPending) {
    return (
      <div className="space-y-6">
        <TituloDaPagina tituloDocumento="Meus pedidos">Meus pedidos</TituloDaPagina>
        <div className="space-y-4" aria-label="Carregando pedidos">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (pedidos.isError) {
    return (
      <div className="space-y-6">
        <TituloDaPagina tituloDocumento="Meus pedidos">Meus pedidos</TituloDaPagina>
        <EstadoErro
          titulo="Não foi possível carregar seus pedidos"
          mensagem={pedidos.error instanceof ErroDeAplicacao ? pedidos.error.message : undefined}
          aoTentarDeNovo={() => {
            void pedidos.refetch();
          }}
        />
      </div>
    );
  }

  if (pedidos.data.conteudo.length === 0 && pagina === 0) {
    return (
      <div className="space-y-6">
        <TituloDaPagina tituloDocumento="Meus pedidos">Meus pedidos</TituloDaPagina>
        <EstadoVazio
          titulo="Você ainda não fez nenhum pedido"
          descricao="Quando finalizar uma compra, você poderá acompanhar o pedido e os pagamentos por aqui."
          acao={
            <Button variante="primario" asChild>
              <Link to="/">Ir ao catálogo</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <TituloDaPagina tituloDocumento="Meus pedidos">Meus pedidos</TituloDaPagina>
        <p className="mt-2 text-muted-foreground">
          Consulte os itens, o andamento e todas as tentativas de pagamento das suas compras.
        </p>
      </div>

      {pedidos.data.conteudo.length === 0 ? (
        <EstadoVazio
          titulo="Não há pedidos nesta página"
          acao={
            <Button
              variante="secundario"
              onClick={() => {
                mudarPagina(0);
              }}
            >
              Voltar à primeira página
            </Button>
          }
        />
      ) : (
        <section aria-label="Pedidos realizados" className="space-y-4">
          {pedidos.data.conteudo.map((pedido) => (
            <CartaoPedido key={pedido.id} pedido={pedido} />
          ))}
        </section>
      )}

      <Paginacao
        pagina={pedidos.data.pagina}
        totalPaginas={pedidos.data.totalPaginas}
        aoMudarPagina={mudarPagina}
      />
    </div>
  );
}
