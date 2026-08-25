import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAdicionarAoCarrinho } from '@/hooks/use-carrinho';
import { useIntencaoDeCompraStore } from '@/lib/intencao-de-compra-store';
import { ErroDeAplicacao, MENSAGENS_ERRO } from '@/lib/erros';
import { useSessaoStore } from '@/lib/sessao-store';
import { urlDeLoginCom } from '@/lib/redirecionamento';
import { obterDisponibilidade, type Produto } from '@/types/catalogo';

interface PropriedadesBotaoAdicionar {
  produto: Produto;
  quantidade?: number;
  /** Caminho para onde voltar depois do login. Padrao: a pagina do produto. */
  destinoDeRetorno?: string;
  tamanho?: 'padrao' | 'grande';
  className?: string;
}

/**
 * Acao de conversao — RF-CAR-01 e fluxo 12.1.
 *
 * Vive em `components/` e nao dentro de `features/carrinho/` porque quem usa e
 * o catalogo. Feature nao importa de feature (RNF-MAN-06).
 *
 * O comportamento muda com o papel, e essa e a regra inteira:
 *
 * | Papel     | Clique |
 * |-----------|--------|
 * | VISITANTE | guarda a intencao e manda para o login |
 * | CLIENTE   | adiciona ao carrinho |
 * | ADMIN     | o botao nem aparece — admin nao compra |
 */
export function BotaoAdicionarAoCarrinho({
  produto,
  quantidade = 1,
  destinoDeRetorno,
  tamanho = 'padrao',
  className,
}: PropriedadesBotaoAdicionar) {
  const autenticado = useSessaoStore((estado) => estado.autenticado);
  const temPapel = useSessaoStore((estado) => estado.temPapel);
  const adicionar = useAdicionarAoCarrinho();
  const guardarIntencao = useIntencaoDeCompraStore((estado) => estado.guardarIntencao);
  const navegar = useNavigate();

  // Admin nao compra — docs/prd.md secao 2.3. Some o botao em vez de
  // desabilitar: desabilitado sugere "talvez depois", e nunca sera.
  if (autenticado && !temPapel(['CLIENTE'])) return null;

  const indisponivel = obterDisponibilidade(produto) === 'INDISPONIVEL';

  function aoClicar() {
    if (!autenticado) {
      // So o id e a quantidade: quem monta a linha, depois do login, e a API —
      // com o preco e o estoque daquele momento, e nao os desta tela.
      guardarIntencao({ produtoId: produto.id, nome: produto.nome, quantidade });
      void navegar(urlDeLoginCom(destinoDeRetorno ?? `/produtos/${produto.id}`));
      return;
    }

    adicionar.mutate(
      { produtoId: produto.id, quantidade },
      {
        onSuccess: () => {
          toast.success(`${produto.nome} adicionado ao carrinho`);
        },
        // O servidor e quem confere o estoque, e a recusa dele e a que vale:
        // pode ter mudado entre a leitura desta tela e o clique.
        onError: (erro) => {
          toast.error(erro instanceof ErroDeAplicacao ? erro.message : MENSAGENS_ERRO.servidor);
        },
      },
    );
  }

  return (
    <Button
      variante="acao"
      tamanho={tamanho}
      className={className}
      disabled={indisponivel || adicionar.isPending}
      aria-disabled={indisponivel || adicionar.isPending}
      aria-busy={adicionar.isPending}
      aria-label={`Adicionar ${produto.nome} ao carrinho`}
      onClick={aoClicar}
    >
      <ShoppingCart aria-hidden="true" />
      {/* Texto diferente do selo de estoque de proposito: repetir
          "Indisponível" duas vezes na mesma altura da tela e ruido, e o botao
          precisa explicar o proprio estado desabilitado (design.md 8.3). */}
      {indisponivel ? 'Sem estoque' : 'Adicionar'}
    </Button>
  );
}
