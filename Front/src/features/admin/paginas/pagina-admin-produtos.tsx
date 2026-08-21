import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { TituloDaPagina } from '@/components/titulo-da-pagina';
import { EstadoErro } from '@/components/estado-erro';
import { EstadoVazio } from '@/components/estado-vazio';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { LinhaProdutoAdmin } from '@/features/admin/componentes/linha-produto-admin';
import { useCategoriasAdmin, useProdutosAdmin } from '@/features/admin/hooks/use-admin';
import { useValorAdiado } from '@/hooks/use-valor-adiado';

/**
 * Listagem administrativa — RF-ADM-01, RF-ADM-03 e RF-ADM-08.
 *
 * É a **única** visão de produtos que o administrador tem: ele não navega o
 * catálogo como cliente. Por isso a linha mostra tudo que importa para operar —
 * SKU, categoria, preço, estoque e situação — e o preço se edita aqui mesmo,
 * sem sair da lista.
 */
export function PaginaAdminProdutos() {
  const [busca, definirBusca] = useState('');
  const [categoria, definirCategoria] = useState('');
  const [situacao, definirSituacao] = useState('');
  const buscaAdiada = useValorAdiado(busca, 300);

  const categorias = useCategoriasAdmin();
  const produtos = useProdutosAdmin({
    ...(buscaAdiada.trim() ? { busca: buscaAdiada } : {}),
    ...(categoria ? { categoria } : {}),
    ...(situacao === 'ATIVO' || situacao === 'INATIVO' ? { situacao } : {}),
    ordenacao: 'ESTOQUE_ASC',
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <TituloDaPagina tituloDocumento="Produtos">Produtos</TituloDaPagina>
          <p className="text-muted-foreground">
            Ordenados por menor estoque — o que está acabando aparece primeiro.
          </p>
        </div>
        <Button variante="primario" asChild>
          <Link to="/admin/produtos/novo">
            <Plus aria-hidden="true" />
            Novo produto
          </Link>
        </Button>
      </div>

      <section aria-label="Filtros" className="flex flex-wrap gap-4">
        <div className="min-w-48 flex-1">
          <label htmlFor="busca-admin" className="mb-1.5 block text-sm font-medium">
            Buscar por nome ou SKU
          </label>
          <Input
            id="busca-admin"
            type="search"
            value={busca}
            onChange={(evento) => {
              definirBusca(evento.target.value);
            }}
          />
        </div>

        <div>
          <label htmlFor="categoria-admin" className="mb-1.5 block text-sm font-medium">
            Categoria
          </label>
          <select
            id="categoria-admin"
            value={categoria}
            onChange={(evento) => {
              definirCategoria(evento.target.value);
            }}
            className="h-10 w-full cursor-pointer rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-44"
          >
            <option value="">Todas</option>
            {categorias.data?.map((atual) => (
              <option key={atual.id} value={atual.slug}>
                {atual.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="situacao-admin" className="mb-1.5 block text-sm font-medium">
            Situação
          </label>
          <select
            id="situacao-admin"
            value={situacao}
            onChange={(evento) => {
              definirSituacao(evento.target.value);
            }}
            className="h-10 w-full cursor-pointer rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-36"
          >
            <option value="">Todas</option>
            <option value="ATIVO">Ativos</option>
            <option value="INATIVO">Inativos</option>
          </select>
        </div>
      </section>

      {produtos.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }, (_, indice) => (
            <Skeleton key={indice} className="h-20 w-full" />
          ))}
        </div>
      ) : produtos.isError ? (
        <EstadoErro
          titulo="Não foi possível carregar os produtos"
          aoTentarDeNovo={() => {
            void produtos.refetch();
          }}
        />
      ) : produtos.data.totalElementos === 0 ? (
        <EstadoVazio
          titulo="Nenhum produto encontrado"
          descricao="Ajuste os filtros ou cadastre um produto novo."
        />
      ) : (
        <>
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {produtos.data.totalElementos} produtos
          </p>
          {/* No celular a tabela vira lista de cartoes — docs/behavior.md 11.1. */}
          <ul className="space-y-2">
            {produtos.data.conteudo.map((produto) => (
              <LinhaProdutoAdmin key={produto.id} produto={produto} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
