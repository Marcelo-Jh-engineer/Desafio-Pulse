import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useCarrinhoStore } from '@/lib/carrinho-store';
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
  const adicionar = useCarrinhoStore((estado) => estado.adicionar);
  const guardarIntencao = useCarrinhoStore((estado) => estado.guardarIntencao);
  const navegar = useNavigate();

  // Admin nao compra — docs/prd.md secao 2.3. Some o botao em vez de
  // desabilitar: desabilitado sugere "talvez depois", e nunca sera.
  if (autenticado && !temPapel(['CLIENTE'])) return null;

  const indisponivel = obterDisponibilidade(produto) === 'INDISPONIVEL';

  function aoClicar() {
    if (!autenticado) {
      // Guarda a linha inteira: depois do login o item entra sem precisar
      // buscar o produto de novo.
      guardarIntencao(produto, quantidade);
      void navegar(urlDeLoginCom(destinoDeRetorno ?? `/produtos/${produto.id}`));
      return;
    }

    adicionar(produto, quantidade);
    toast.success(`${produto.nome} adicionado ao carrinho`);
  }

  return (
    <Button
      variante="acao"
      tamanho={tamanho}
      className={className}
      disabled={indisponivel}
      aria-disabled={indisponivel}
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
