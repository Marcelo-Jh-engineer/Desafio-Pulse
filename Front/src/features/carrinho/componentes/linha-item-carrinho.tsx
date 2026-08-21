import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImagemProduto } from '@/components/imagem-produto';
import { Preco } from '@/components/preco';
import { SeletorQuantidade } from '@/components/seletor-quantidade';
import { tetoDaLinha } from '@/lib/carrinho-calculo';
import type { ItemCarrinho } from '@/types/carrinho';
import { Link } from 'react-router-dom';

interface PropriedadesLinha {
  item: ItemCarrinho;
  aoMudarQuantidade: (quantidade: number) => void;
  aoRemover: () => void;
}

/** Uma linha do carrinho — RF-CAR-02 e RF-CAR-03. */
export function LinhaItemCarrinho({ item, aoMudarQuantidade, aoRemover }: PropriedadesLinha) {
  const teto = tetoDaLinha(item.estoqueDisponivel);
  // O estoque pode ter caido desde que o item entrou no carrinho.
  const acimaDoEstoque = item.quantidade > teto;

  return (
    <li className="flex gap-4 border-b border-border py-4 last:border-0">
      <Link
        to={`/produtos/${item.slug}`}
        className="w-20 shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-24"
        tabIndex={-1}
        aria-hidden="true"
      >
        <ImagemProduto src={item.urlImagem} nome={item.nome} />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/produtos/${item.slug}`}
            className="rounded-sm font-medium leading-snug hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {item.nome}
          </Link>
          <Button
            variante="fantasma"
            tamanho="icone"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            aria-label={`Remover ${item.nome} do carrinho`}
            onClick={aoRemover}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>

        <Preco centavos={item.precoEmCentavos} unidade={item.unidade} className="text-sm" />

        {acimaDoEstoque ? (
          <p role="status" className="text-xs font-medium text-alerta">
            Restam apenas {teto} unidades deste produto.
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-1">
          <SeletorQuantidade
            valor={item.quantidade}
            estoqueDisponivel={item.estoqueDisponivel}
            nomeDoProduto={item.nome}
            aoMudar={aoMudarQuantidade}
          />
          <Preco centavos={item.totalLinhaEmCentavos} className="text-lg" />
        </div>
      </div>
    </li>
  );
}
