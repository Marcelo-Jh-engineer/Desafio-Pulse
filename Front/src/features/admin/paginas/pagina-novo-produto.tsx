import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { TituloDaPagina } from '@/components/titulo-da-pagina';
import { CampoFormulario } from '@/components/campo-formulario';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCadastrarProduto, useCategoriasDisponiveis } from '@/features/admin/hooks/use-admin';
import { ErroDeAplicacao, MENSAGENS_ERRO } from '@/lib/erros';
import { ROTULO_UNIDADE, type Unidade } from '@/types/dominio';

/**
 * "19,90" vira `1990`. Dinheiro e sempre inteiro em centavos — o formulario e
 * o unico lugar que ve virgula, e a conversao acontece antes de enviar.
 */
function paraCentavos(valor: string): number {
  const normalizado = valor.replace(/\./g, '').replace(',', '.');
  return Math.round(Number.parseFloat(normalizado) * 100);
}

const UNIDADES = Object.keys(ROTULO_UNIDADE) as Unidade[];

const esquema = z.object({
  nome: z.string().trim().min(3, 'O nome precisa ter ao menos 3 caracteres.').max(120),
  descricao: z
    .string()
    .trim()
    .min(10, 'A descrição precisa ter ao menos 10 caracteres.')
    .max(2000),
  preco: z
    .string()
    .refine((valor) => Number.isFinite(paraCentavos(valor)) && paraCentavos(valor) > 0, {
      message: 'Informe um preço válido, como 19,90.',
    }),
  unidade: z.enum(['UN', 'KG', 'G', 'L', 'ML', 'PCT']),
  categoriaId: z.string().min(1, 'Escolha uma categoria.'),
  urlImagem: z.string().trim().min(1, 'Informe o caminho da imagem.'),
  quantidadeEstoque: z.coerce.number().int().min(0, 'O estoque não pode ser negativo.'),
  ativo: z.boolean(),
});

type FormularioProduto = z.infer<typeof esquema>;

/** Cadastro de produto — RF-ADM-02. */
export function PaginaNovoProduto() {
  const categorias = useCategoriasDisponiveis();
  const cadastrar = useCadastrarProduto();
  const navegar = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormularioProduto>({
    resolver: zodResolver(esquema),
    mode: 'onBlur',
    defaultValues: {
      nome: '',
      descricao: '',
      preco: '',
      unidade: 'UN',
      categoriaId: '',
      urlImagem: '',
      quantidadeEstoque: 0,
      ativo: true,
    },
  });

  // Erros de validacao do servidor voltam para o campo correspondente.
  useEffect(() => {
    const erro = cadastrar.error;
    if (!(erro instanceof ErroDeAplicacao) || !erro.errosPorCampo) return;
    for (const [campo, mensagem] of Object.entries(erro.errosPorCampo)) {
      setError(campo as keyof FormularioProduto, { type: 'server', message: mensagem });
    }
  }, [cadastrar.error, setError]);

  function aoEnviar(dados: FormularioProduto) {
    cadastrar.mutate(
      {
        nome: dados.nome,
        descricao: dados.descricao,
        precoEmCentavos: paraCentavos(dados.preco),
        unidade: dados.unidade,
        urlImagem: dados.urlImagem,
        categoriaId: dados.categoriaId,
        quantidadeEstoque: dados.quantidadeEstoque,
        ativo: dados.ativo,
      },
      {
        onSuccess: (produto) => {
          toast.success(`${produto.nome} cadastrado`);
          void navegar('/admin/produtos');
        },
      },
    );
  }

  const erroGeral =
    cadastrar.error &&
    !(cadastrar.error instanceof ErroDeAplicacao && cadastrar.error.errosPorCampo)
      ? cadastrar.error instanceof ErroDeAplicacao
        ? cadastrar.error.message
        : MENSAGENS_ERRO.servidor
      : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <TituloDaPagina tituloDocumento="Novo produto">Novo produto</TituloDaPagina>
        <Link
          to="/admin/produtos"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
        >
          Voltar para a listagem
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          {erroGeral ? (
            <p
              role="alert"
              className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive"
            >
              {erroGeral}
            </p>
          ) : null}

          <form
            noValidate
            className="space-y-4"
            onSubmit={(evento) => void handleSubmit(aoEnviar)(evento)}
          >
            <CampoFormulario id="nome" rotulo="Nome" erro={errors.nome?.message}>
              <Input id="nome" aria-invalid={Boolean(errors.nome)} {...register('nome')} />
            </CampoFormulario>

            <CampoFormulario id="descricao" rotulo="Descrição" erro={errors.descricao?.message}>
              <textarea
                id="descricao"
                rows={4}
                aria-invalid={Boolean(errors.descricao)}
                className="w-full rounded-md border border-input bg-card p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...register('descricao')}
              />
            </CampoFormulario>

            <div className="grid gap-4 sm:grid-cols-2">
              <CampoFormulario id="preco" rotulo="Preço" erro={errors.preco?.message}>
                <Input
                  id="preco"
                  inputMode="decimal"
                  placeholder="19,90"
                  aria-invalid={Boolean(errors.preco)}
                  {...register('preco')}
                />
              </CampoFormulario>

              <CampoFormulario id="unidade" rotulo="Unidade">
                <select
                  id="unidade"
                  className="h-10 w-full cursor-pointer rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  {...register('unidade')}
                >
                  {UNIDADES.map((unidade) => (
                    <option key={unidade} value={unidade}>
                      {unidade} — {ROTULO_UNIDADE[unidade]}
                    </option>
                  ))}
                </select>
              </CampoFormulario>
            </div>

            <CampoFormulario
              id="categoriaId"
              rotulo="Categoria"
              erro={errors.categoriaId?.message}
            >
              <select
                id="categoriaId"
                aria-invalid={Boolean(errors.categoriaId)}
                aria-busy={categorias.isPending}
                disabled={categorias.isPending || categorias.isError}
                className="h-10 w-full cursor-pointer rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...register('categoriaId')}
              >
                <option value="">
                  {categorias.isPending
                    ? 'Carregando categorias...'
                    : categorias.isError
                      ? 'Categorias indisponíveis'
                      : 'Selecione'}
                </option>
                {categorias.data?.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </option>
                ))}
              </select>
            </CampoFormulario>

            {categorias.isError ? (
              <div
                role="alert"
                className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
              >
                <span>Não foi possível carregar as categorias da API.</span>
                <Button
                  type="button"
                  variante="fantasma"
                  tamanho="pequeno"
                  onClick={() => {
                    void categorias.refetch();
                  }}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : null}

            {categorias.isSuccess && categorias.data.length === 0 ? (
              <p role="status" className="rounded-md bg-alerta/10 p-3 text-sm text-alerta">
                Nenhuma categoria ativa foi encontrada. Cadastre uma categoria antes do produto.
              </p>
            ) : null}

            <CampoFormulario
              id="urlImagem"
              rotulo="Caminho da imagem"
              erro={errors.urlImagem?.message}
            >
              <Input
                id="urlImagem"
                aria-invalid={Boolean(errors.urlImagem)}
                {...register('urlImagem')}
              />
            </CampoFormulario>

            <div className="grid gap-4 sm:grid-cols-2">
              <CampoFormulario
                id="quantidadeEstoque"
                rotulo="Estoque inicial"
                erro={errors.quantidadeEstoque?.message}
              >
                <Input
                  id="quantidadeEstoque"
                  type="number"
                  min={0}
                  aria-invalid={Boolean(errors.quantidadeEstoque)}
                  {...register('quantidadeEstoque')}
                />
              </CampoFormulario>

              <div className="flex items-end pb-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <input type="checkbox" className="size-4" {...register('ativo')} />
                  Produto ativo
                </label>
              </div>
            </div>

            <Button
              type="submit"
              variante="primario"
              tamanho="grande"
              className="w-full"
              disabled={
                cadastrar.isPending ||
                categorias.isPending ||
                categorias.isError ||
                categorias.data?.length === 0
              }
              aria-busy={cadastrar.isPending}
            >
              {cadastrar.isPending ? 'Salvando...' : 'Cadastrar produto'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
