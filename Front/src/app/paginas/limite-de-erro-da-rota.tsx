import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { EstadoErro } from '@/components/estado-erro';
import { PaginaNaoEncontrada } from '@/app/paginas/pagina-nao-encontrada';
import { MENSAGENS_ERRO } from '@/lib/erros';
import { useTituloDaPagina } from '@/hooks/use-titulo-da-pagina';

/**
 * Rede de seguranca da arvore de rotas. A mensagem exibida nunca carrega
 * detalhe interno nem stack trace — docs/behavior.md secao 13.2.
 */
export function LimiteDeErroDaRota() {
  const erro = useRouteError();
  useTituloDaPagina('Algo deu errado');

  if (isRouteErrorResponse(erro) && erro.status === 404) {
    return <PaginaNaoEncontrada />;
  }

  return (
    <EstadoErro
      mensagem={MENSAGENS_ERRO.servidor}
      aoTentarDeNovo={() => {
        window.location.reload();
      }}
    />
  );
}
