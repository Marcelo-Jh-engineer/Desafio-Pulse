import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TituloDaPagina } from '@/components/titulo-da-pagina';
import { EstadoErro } from '@/components/estado-erro';
import { ImagemProduto } from '@/components/imagem-produto';
import { Preco } from '@/components/preco';
import { SeloEstoque } from '@/components/selo-estoque';
import { Button } from '@/components/ui/button';
import { BotaoAdicionarAoCarrinho } from '@/components/botao-adicionar-ao-carrinho';
import { SeletorQuantidade } from '@/components/seletor-quantidade';
import { Separator } from '@/components/ui/separator';
import { EsqueletoProduto } from '@/features/catalogo/componentes/esqueleto-produto';
import { TrilhaNavegacao } from '@/features/catalogo/componentes/trilha-navegacao';
import { useProduto } from '@/features/catalogo/hooks/use-produto';
import { PaginaNaoEncontrada } from '@/app/paginas/pagina-nao-encontrada';
import { limitarQuantidade } from '@/lib/carrinho-calculo';
import { ErroDeAplicacao } from '@/lib/erros';
import { ROTULO_UNIDADE } from '@/types/dominio';
import { obterDisponibilidade } from '@/types/catalogo';

/**
 * Pagina do produto — RF-CAT-07 e RF-CAT-08.
 *
 * A acao de compra chega na F3. Aqui ela ja nasce desabilitada para produto sem
 * estoque, com o motivo em texto e nao apenas na cor.
 */
export function PaginaProduto() {
  const { id = '' } = useParams();
  const consulta = useProduto(id);
  const [quantidade, definirQuantidade] = useState(1);

  if (consulta.isPending) {
    return <EsqueletoProduto />;
  }

  // Slug inexistente ou produto inativo: 404 com mascote, nunca tela em branco.
  if (consulta.error instanceof ErroDeAplicacao && consulta.error.ehNaoEncontrado) {
    return <PaginaNaoEncontrada />;
  }

  if (consulta.isError) {
    return (
      <EstadoErro
        titulo="Não foi possível carregar o produto"
        mensagem={consulta.error instanceof ErroDeAplicacao ? consulta.error.message : undefined}
        aoTentarDeNovo={() => {
          void consulta.refetch();
        }}
      />
    );
  }

  const produto = consulta.data;
  const indisponivel = obterDisponibilidade(produto) === 'INDISPONIVEL';

  return (
    <article className="space-y-6">
      <TrilhaNavegacao
        passos={[
          { rotulo: 'Catálogo', para: '/' },
          { rotulo: produto.categoria.nome, para: `/?categoria=${produto.categoria.id}` },
          { rotulo: produto.nome },
        ]}
      />

      <div className="grid gap-8 md:grid-cols-2">
        <ImagemProduto src={produto.urlImagem} nome={produto.nome} prioritaria />

        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {produto.categoria.nome}
          </p>

          <TituloDaPagina tituloDocumento={produto.nome}>{produto.nome}</TituloDaPagina>

          <Preco
            centavos={produto.precoEmCentavos}
            unidade={produto.unidade}
            className="text-3xl"
          />
          <p className="text-sm text-muted-foreground">
            Preço por {ROTULO_UNIDADE[produto.unidade]}
          </p>

          <SeloEstoque produto={produto} />

          {indisponivel ? (
            <p role="status" className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              Produto indisponível no momento. Volte em breve ou veja outros itens da categoria.
            </p>
          ) : null}

          <Separator />

          {indisponivel ? null : (
            <div className="flex flex-wrap items-center gap-3">
              <span id="rotulo-quantidade" className="text-sm font-medium">
                Quantidade
              </span>
              <SeletorQuantidade
                valor={quantidade}
                estoqueDisponivel={produto.quantidadeEstoque}
                nomeDoProduto={produto.nome}
                aoMudar={(novaQuantidade) => {
                  definirQuantidade(limitarQuantidade(novaQuantidade, produto.quantidadeEstoque));
                }}
              />
              <span className="text-sm text-muted-foreground">
                {produto.quantidadeEstoque} em estoque
              </span>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <BotaoAdicionarAoCarrinho
              produto={produto}
              quantidade={quantidade}
              tamanho="grande"
              className="flex-1"
            />
            <Button variante="secundario" tamanho="grande" asChild>
              <Link to={`/?categoria=${produto.categoria.id}`}>
                Ver mais de {produto.categoria.nome}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <section aria-labelledby="titulo-descricao" className="space-y-2">
        <h2 id="titulo-descricao" className="text-xl font-semibold">
          Descrição
        </h2>
        <p className="max-w-prose text-muted-foreground">{produto.descricao}</p>
      </section>
    </article>
  );
}
