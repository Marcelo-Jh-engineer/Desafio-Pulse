import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { TituloDaPagina } from '@/components/titulo-da-pagina';
import { CampoFormulario } from '@/components/campo-formulario';
import { EstadoErro } from '@/components/estado-erro';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAtualizarCategoria,
  useCadastrarCategoria,
  useCategoriasAdmin,
} from '@/features/admin/hooks/use-admin';
import { ErroDeAplicacao } from '@/lib/erros';
import type { CategoriaAdmin } from '@/features/admin/servicos/admin-servico';

const esquema = z.object({
  nome: z.string().trim().min(2, 'O nome precisa ter ao menos 2 caracteres.').max(60),
});

type FormularioCategoria = z.infer<typeof esquema>;

/**
 * Gestão de categorias — RF-ADM-05.
 *
 * **Não há exclusão, só desativação.** Apagar quebraria o vínculo histórico dos
 * produtos já cadastrados; desativar tira do filtro público e preserva o resto.
 */
export function PaginaCategorias() {
  const categorias = useCategoriasAdmin();
  const cadastrar = useCadastrarCategoria();
  const atualizar = useAtualizarCategoria();
  const [confirmando, definirConfirmando] = useState<CategoriaAdmin | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormularioCategoria>({
    resolver: zodResolver(esquema),
    mode: 'onBlur',
    defaultValues: { nome: '' },
  });

  function aoCriar(dados: FormularioCategoria) {
    const ordem = (categorias.data?.length ?? 0) + 1;
    cadastrar.mutate(
      { nome: dados.nome, ordem, ativa: true },
      {
        onSuccess: (categoria) => {
          toast.success(`Categoria ${categoria.nome} criada`);
          reset({ nome: '' });
        },
      },
    );
  }

  function alternar(categoria: CategoriaAdmin) {
    // Desativar categoria com produtos vinculados avisa antes — o admin
    // precisa saber que os produtos continuam vinculados, mas somem do filtro.
    if (categoria.ativa && categoria.quantidadeProdutos > 0) {
      definirConfirmando(categoria);
      return;
    }
    confirmarAlternancia(categoria);
  }

  function confirmarAlternancia(categoria: CategoriaAdmin) {
    atualizar.mutate(
      { id: categoria.id, dados: { ativa: !categoria.ativa } },
      {
        onSuccess: (atualizada) => {
          toast.success(`${atualizada.nome} ${atualizada.ativa ? 'ativada' : 'desativada'}`);
          definirConfirmando(null);
        },
      },
    );
  }

  const erroDoCadastro =
    cadastrar.error instanceof ErroDeAplicacao
      ? (cadastrar.error.errosPorCampo?.nome ?? cadastrar.error.message)
      : null;

  return (
    <div className="space-y-6">
      <TituloDaPagina tituloDocumento="Categorias">Categorias</TituloDaPagina>

      <Card>
        <CardContent className="pt-6">
          <form
            noValidate
            className="flex flex-wrap items-end gap-3"
            onSubmit={(evento) => void handleSubmit(aoCriar)(evento)}
          >
            <div className="min-w-48 flex-1">
              <CampoFormulario
                id="nome"
                rotulo="Nova categoria"
                erro={errors.nome?.message ?? erroDoCadastro ?? undefined}
              >
                <Input
                  id="nome"
                  placeholder="Congelados"
                  aria-invalid={Boolean(errors.nome)}
                  {...register('nome')}
                />
              </CampoFormulario>
            </div>
            <Button
              type="submit"
              variante="primario"
              disabled={cadastrar.isPending}
              aria-busy={cadastrar.isPending}
            >
              {cadastrar.isPending ? 'Criando...' : 'Criar'}
            </Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            O identificador da URL é gerado a partir do nome pelo servidor.
          </p>
        </CardContent>
      </Card>

      {confirmando ? (
        <div
          role="alertdialog"
          aria-labelledby="titulo-confirmacao"
          className="space-y-3 rounded-md border border-alerta/40 bg-alerta/10 p-4"
        >
          <p id="titulo-confirmacao" className="font-medium text-alerta">
            Desativar {confirmando.nome}?
          </p>
          <p className="text-sm">
            {confirmando.quantidadeProdutos}{' '}
            {confirmando.quantidadeProdutos === 1 ? 'produto continua' : 'produtos continuam'}{' '}
            vinculados a ela, mas a categoria some do filtro do catálogo público.
          </p>
          <div className="flex gap-2">
            <Button
              variante="destrutivo"
              tamanho="pequeno"
              onClick={() => {
                confirmarAlternancia(confirmando);
              }}
            >
              Desativar
            </Button>
            <Button
              variante="fantasma"
              tamanho="pequeno"
              onClick={() => {
                definirConfirmando(null);
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}

      {categorias.isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : categorias.isError ? (
        <EstadoErro
          titulo="Não foi possível carregar as categorias"
          aoTentarDeNovo={() => {
            void categorias.refetch();
          }}
        />
      ) : (
        <ul className="space-y-2">
          {categorias.data.map((categoria) => (
            <li key={categoria.id}>
              <Card>
                <CardContent className="flex flex-wrap items-center gap-4 p-4">
                  <div className="min-w-40 flex-1">
                    <p className="font-medium">{categoria.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {categoria.slug} · {categoria.quantidadeProdutos}{' '}
                      {categoria.quantidadeProdutos === 1 ? 'produto' : 'produtos'}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      categoria.ativa
                        ? 'bg-sucesso/10 text-sucesso ring-1 ring-inset ring-sucesso/30'
                        : 'bg-muted text-muted-foreground ring-1 ring-inset ring-border'
                    }`}
                  >
                    {categoria.ativa ? 'Ativa' : 'Inativa'}
                  </span>

                  <Button
                    variante="secundario"
                    tamanho="pequeno"
                    disabled={atualizar.isPending}
                    onClick={() => {
                      alternar(categoria);
                    }}
                  >
                    {categoria.ativa ? 'Desativar' : 'Ativar'}
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
