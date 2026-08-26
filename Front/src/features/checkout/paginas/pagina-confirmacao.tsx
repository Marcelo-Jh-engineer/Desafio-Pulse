import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { TituloDaPagina } from '@/components/titulo-da-pagina';
import { Dentinho } from '@/components/dentinho';
import { EstadoErro } from '@/components/estado-erro';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DetalhesDoPedido } from '@/features/checkout/componentes/detalhes-do-pedido';
import { IndicadorEtapas } from '@/features/checkout/componentes/indicador-etapas';
import { ResumoDoPagamento } from '@/features/checkout/componentes/resumo-do-pagamento';
import { usePagamentos, usePedido } from '@/features/checkout/hooks/use-checkout';
import { chavesQuery } from '@/lib/chaves-query';
import { ErroDeAplicacao } from '@/lib/erros';

/** Confirmação e comprovante do pedido aprovado. */
export function PaginaConfirmacao() {
  const { id = '' } = useParams();
  const pedido = usePedido(id);
  const pagamentos = usePagamentos(id);
  const clienteQuery = useQueryClient();
  const aprovado = pedido.data?.status === 'PAGO';
  const pagamentoAprovado = pagamentos.data?.find((pagamento) => pagamento.status === 'APROVADO');

  useEffect(() => {
    if (aprovado) {
      void clienteQuery.invalidateQueries({ queryKey: chavesQuery.carrinho.atual() });
    }
  }, [aprovado, clienteQuery]);

  if (pedido.isPending) return <Skeleton className="h-96 w-full" />;

  if (pedido.isError) {
    return (
      <EstadoErro
        titulo="Não foi possível carregar o pedido"
        mensagem={pedido.error instanceof ErroDeAplicacao ? pedido.error.message : undefined}
        aoTentarDeNovo={() => {
          void pedido.refetch();
        }}
      />
    );
  }

  if (!aprovado) return <Navigate to={`/pedidos/${id}`} replace />;

  return (
    <div className="space-y-6">
      <div className="nao-imprimir">
        <IndicadorEtapas atual={2} />
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="nao-imprimir">
            <Dentinho tamanho="grande" alt="" />
          </div>
          <TituloDaPagina tituloDocumento="Pedido confirmado">Pedido confirmado</TituloDaPagina>
          <p className="text-muted-foreground">Obrigado! Já estamos separando os seus itens.</p>
          <p className="rounded-md bg-accent px-4 py-2 text-lg font-bold text-accent-foreground">
            {pedido.data.id}
          </p>
        </CardContent>
      </Card>

      <div className="nao-imprimir flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button
          variante="primario"
          onClick={() => {
            window.print();
          }}
        >
          <Printer aria-hidden="true" />
          Imprimir comprovante
        </Button>
        <Button variante="secundario" asChild>
          <Link to={`/pedidos/${pedido.data.id}`}>Acompanhar pedido</Link>
        </Button>
        <Button variante="fantasma" asChild>
          <Link to="/">Voltar ao catálogo</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6" data-comprovante>
          <div className="hidden border-b border-border pb-4 print:block">
            <p className="text-lg font-bold">Você no Coração da Gente</p>
            <p className="text-sm text-muted-foreground">
              Comprovante do pedido {pedido.data.id}
            </p>
          </div>

          <ResumoDoPagamento pagamento={pagamentoAprovado} />
          <DetalhesDoPedido pedido={pedido.data} />

          <p className="hidden border-t border-border pt-4 text-xs text-muted-foreground print:block">
            Documento sem valor fiscal. Pagamento simulado para fins de demonstração.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
