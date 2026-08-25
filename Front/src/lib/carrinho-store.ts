import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Carrinho, ItemCarrinho } from '@/types/carrinho';
import type { Produto } from '@/types/catalogo';
import { calcularCarrinho, limitarQuantidade, tetoDaLinha } from '@/lib/carrinho-calculo';

/**
 * Carrinho do cliente — RF-CAR-01 a RF-CAR-09.
 *
 * Vive em `lib/` pelo mesmo motivo da sessao: catalogo, cabecalho e a propria
 * tela do carrinho dependem dele, e nenhuma feature pode importar de outra
 * (RNF-MAN-06).
 *
 * **Persistido em `localStorage`**, ao contrario da sessao. Sao coisas
 * diferentes: token e credencial, carrinho e rascunho de compra. Perder o
 * carrinho ao recarregar seria hostil, e nao ha nada sensivel nele.
 */

/**
 * Intencao guardada quando um visitante tenta comprar — fluxo 12.1.
 * Guarda a linha inteira, ja montada, para consumir sem precisar buscar o
 * produto de novo depois do login.
 */
interface IntencaoDeCompra {
  item: ItemCarrinho;
}

interface EstadoCarrinho {
  itens: ItemCarrinho[];
  intencao: IntencaoDeCompra | null;

  adicionar: (produto: Produto, quantidade?: number) => void;
  definirQuantidade: (produtoId: string, quantidade: number) => void;
  remover: (produtoId: string) => ItemCarrinho | undefined;
  restaurar: (item: ItemCarrinho, posicao: number) => void;
  esvaziar: () => void;

  guardarIntencao: (produto: Produto, quantidade?: number) => void;
  /** Devolve e descarta. Consumida **uma unica vez** — recarregar nao repete. */
  consumirIntencao: () => IntencaoDeCompra | null;
  descartarIntencao: () => void;
}

/** Converte um produto do catalogo na linha do carrinho, com o snapshot. */
function montarItem(produto: Produto, quantidade: number): ItemCarrinho {
  const quantidadeFinal = limitarQuantidade(quantidade, produto.quantidadeEstoque);
  return {
    produtoId: produto.id,
    nome: produto.nome,
    precoEmCentavos: produto.precoEmCentavos,
    urlImagem: produto.urlImagem,
    unidade: produto.unidade,
    quantidade: quantidadeFinal,
    totalLinhaEmCentavos: produto.precoEmCentavos * quantidadeFinal,
    estoqueDisponivel: produto.quantidadeEstoque,
  };
}

export const useCarrinhoStore = create<EstadoCarrinho>()(
  persist(
    (definir, obter) => ({
      itens: [],
      intencao: null,

      adicionar: (produto, quantidade = 1) => {
        if (tetoDaLinha(produto.quantidadeEstoque) === 0) return;

        definir((estado) => {
          const existente = estado.itens.find((item) => item.produtoId === produto.id);

          // Produto ja no carrinho **soma** a quantidade, respeitando o teto —
          // docs/models.md secao 7.
          if (existente) {
            return {
              itens: estado.itens.map((item) =>
                item.produtoId === produto.id
                  ? {
                      ...item,
                      // O estoque do catalogo e mais novo que o do snapshot.
                      estoqueDisponivel: produto.quantidadeEstoque,
                      quantidade: limitarQuantidade(
                        item.quantidade + quantidade,
                        produto.quantidadeEstoque,
                      ),
                    }
                  : item,
              ),
            };
          }

          return { itens: [...estado.itens, montarItem(produto, quantidade)] };
        });
      },

      definirQuantidade: (produtoId, quantidade) => {
        // Chegar em zero remove a linha — docs/models.md secao 7.
        if (quantidade <= 0) {
          obter().remover(produtoId);
          return;
        }

        definir((estado) => ({
          itens: estado.itens.map((item) =>
            item.produtoId === produtoId
              ? { ...item, quantidade: limitarQuantidade(quantidade, item.estoqueDisponivel) }
              : item,
          ),
        }));
      },

      remover: (produtoId) => {
        const removido = obter().itens.find((item) => item.produtoId === produtoId);
        definir((estado) => ({
          itens: estado.itens.filter((item) => item.produtoId !== produtoId),
        }));
        // Devolve a linha para quem quiser oferecer "Desfazer" — RF-CAR-09.
        return removido;
      },

      restaurar: (item, posicao) => {
        definir((estado) => {
          if (estado.itens.some((atual) => atual.produtoId === item.produtoId)) return estado;
          const itens = [...estado.itens];
          itens.splice(Math.max(0, Math.min(posicao, itens.length)), 0, item);
          return { itens };
        });
      },

      esvaziar: () => {
        definir({ itens: [], intencao: null });
      },

      guardarIntencao: (produto, quantidade = 1) => {
        definir({ intencao: { item: montarItem(produto, quantidade) } });
      },

      consumirIntencao: () => {
        const { intencao } = obter();
        if (intencao) definir({ intencao: null });
        return intencao;
      },

      descartarIntencao: () => {
        definir({ intencao: null });
      },
    }),
    {
      name: 'carrinho',
      // A intencao e de uma navegacao so; persisti-la faria o item entrar no
      // carrinho num login futuro sem relacao com o clique original.
      partialize: (estado) => ({ itens: estado.itens }),
    },
  ),
);

/** Seletor derivado: os totais nunca sao guardados, sempre recalculados. */
export function useCarrinho(): Carrinho {
  const itens = useCarrinhoStore((estado) => estado.itens);
  return calcularCarrinho(itens);
}

/** Leitura fora de componente: testes e handlers. */
export function obterCarrinho(): Carrinho {
  return calcularCarrinho(useCarrinhoStore.getState().itens);
}
