import { Button } from '@/components/ui/button';
import { Dentinho } from '@/components/dentinho';
import { MENSAGENS_ERRO } from '@/lib/erros';

interface PropriedadesEstadoErro {
  titulo?: string | undefined;
  mensagem?: string | undefined;
  aoTentarDeNovo?: (() => void) | undefined;
}

/**
 * Toda tela com carregamento tem estado de erro com nova tentativa. Sem excecao.
 * Ver docs/behavior.md secao 13.5.
 */
export function EstadoErro({
  titulo = 'Não foi possível carregar',
  mensagem = MENSAGENS_ERRO.servidor,
  aoTentarDeNovo,
}: PropriedadesEstadoErro) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-4 px-4 py-16 text-center"
    >
      <Dentinho tamanho="pequeno" />
      <h2 className="text-xl font-semibold">{titulo}</h2>
      <p className="max-w-prose text-muted-foreground">{mensagem}</p>
      {aoTentarDeNovo ? (
        <Button variante="secundario" onClick={aoTentarDeNovo}>
          Tentar de novo
        </Button>
      ) : null}
    </div>
  );
}
