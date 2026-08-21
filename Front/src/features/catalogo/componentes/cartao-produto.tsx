import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { ImagemProduto } from '@/components/imagem-produto';
import { Preco } from '@/components/preco';
import { SeloEstoque } from '@/components/selo-estoque';
import type { Produto } from '@/types/catalogo';

interface PropriedadesCartaoProduto {
  produto: Produto;
  /** Cartoes da primeira dobra carregam a imagem sem espera. */
  prioritaria?: boolean;
}

/**
 * RF-CAT-02. O cartao inteiro e um unico link acessivel envolvendo imagem e
 * nome — docs/behavior.md secao 3. A acao de compra chega na F3, e o produto
 * indisponivel ja nasce sem ela (RF-CAT-08).
 */
export function CartaoProduto({ produto, prioritaria = false }: PropriedadesCartaoProduto) {
  return (
    <Card className="group h-full overflow-hidden transition-shadow duration-200 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:shadow-md">
      <Link
        to={`/produtos/${produto.slug}`}
        className="flex h-full flex-col outline-none"
        aria-label={`${produto.nome}, ${produto.categoria.nome}`}
      >
        <ImagemProduto
          src={produto.urlImagem}
          nome={produto.nome}
          prioritaria={prioritaria}
          className="rounded-none"
        />
        <CardContent className="flex flex-1 flex-col gap-2 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {produto.categoria.nome}
          </p>
          <h3 className="line-clamp-2 text-base font-medium leading-snug group-hover:text-primary">
            {produto.nome}
          </h3>
          <div className="mt-auto flex flex-col gap-2 pt-2">
            <Preco
              centavos={produto.precoEmCentavos}
              unidade={produto.unidade}
              className="text-lg"
            />
            <SeloEstoque produto={produto} />
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
