import { useState } from 'react';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';
import { Preco } from '@/components/preco';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAlterarPreco } from '@/features/admin/hooks/use-admin';
import { ErroDeAplicacao } from '@/lib/erros';
import { cn } from '@/lib/utils';
import type { Produto } from '@/types/catalogo';

/** Abaixo disso a linha destaca o produto — RF-ADM-08. */
export const LIMITE_ESTOQUE_BAIXO = 10;

/** "19,90" vira `1990`. Dinheiro é sempre inteiro em centavos. */
function paraCentavos(valor: string): number {
  const normalizado = valor.replace(/\./g, '').replace(',', '.');
  return Math.round(Number.parseFloat(normalizado) * 100);
}

/** `1990` vira "19,90" — só para preencher o campo de edição. */
function paraTexto(centavos: number): string {
  return (centavos / 100).toFixed(2).replace('.', ',');
}

/**
 * Uma linha da listagem administrativa, com edição de preço no lugar.
 *
 * Editar aqui e não numa tela separada é deliberado: o admin compara preços
 * entre produtos vizinhos, e sair da lista para cada ajuste perderia esse
 * contexto.
 *
 * **Estoque não se edita.** Ele baixa sozinho quando um pagamento é aprovado —
 * é o único caminho que existe para mexer nele.
 */
export function LinhaProdutoAdmin({ produto }: { produto: Produto }) {
  const [editando, definirEditando] = useState(false);
  const [preco, definirPreco] = useState(() => paraTexto(produto.precoEmCentavos));
  const alterarPreco = useAlterarPreco();

  const estoqueBaixo = produto.quantidadeEstoque <= LIMITE_ESTOQUE_BAIXO;
  const centavos = paraCentavos(preco);
  const precoInvalido = !Number.isFinite(centavos) || centavos <= 0;

  function salvar() {
    if (precoInvalido) return;

    alterarPreco.mutate(
      { id: produto.id, precoEmCentavos: centavos },
      {
        onSuccess: (atualizado) => {
          toast.success(`Preço de ${atualizado.nome} atualizado`);
          definirEditando(false);
        },
      },
    );
  }

  const erro =
    alterarPreco.error instanceof ErroDeAplicacao
      ? (alterarPreco.error.errosPorCampo?.preco ?? alterarPreco.error.message)
      : null;

  return (
    <li>
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-4">
          <img
            src={produto.urlImagem}
            alt=""
            width={48}
            height={48}
            loading="lazy"
            className="size-12 shrink-0 rounded-md object-cover"
          />

          <div className="min-w-40 flex-1">
            <p className="font-medium leading-snug">{produto.nome}</p>
            <p className="text-xs text-muted-foreground">
              {produto.sku} · {produto.categoria.nome} · {produto.unidade}
            </p>
          </div>

          {editando ? (
            <div className="flex items-end gap-2">
              <div>
                <label htmlFor={`preco-${produto.id}`} className="mb-1 block text-xs font-medium">
                  Preço de {produto.nome}
                </label>
                <Input
                  id={`preco-${produto.id}`}
                  inputMode="decimal"
                  value={preco}
                  autoFocus
                  aria-invalid={precoInvalido}
                  className="w-28"
                  onChange={(evento) => {
                    definirPreco(evento.target.value);
                  }}
                />
              </div>
              <Button
                variante="primario"
                tamanho="pequeno"
                disabled={precoInvalido || alterarPreco.isPending}
                aria-busy={alterarPreco.isPending}
                onClick={salvar}
              >
                Salvar
              </Button>
              <Button
                variante="fantasma"
                tamanho="pequeno"
                onClick={() => {
                  definirPreco(paraTexto(produto.precoEmCentavos));
                  definirEditando(false);
                }}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <>
              <Preco
                centavos={produto.precoEmCentavos}
                unidade={produto.unidade}
                className="text-sm"
              />

              {/* Cor **mais** rotulo: quem nao distingue as cores continua lendo. */}
              <span
                className={cn(
                  'numeros-tabulares rounded-full px-2 py-0.5 text-xs font-medium',
                  estoqueBaixo
                    ? 'bg-alerta/10 text-alerta ring-1 ring-inset ring-alerta/30'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {produto.quantidadeEstoque} em estoque
                {estoqueBaixo ? ' · acabando' : ''}
              </span>

              {!produto.ativo ? (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  Inativo
                </span>
              ) : null}

              <Button
                variante="secundario"
                tamanho="pequeno"
                aria-label={`Alterar preço de ${produto.nome}`}
                onClick={() => {
                  definirEditando(true);
                }}
              >
                <Pencil aria-hidden="true" className="size-3.5" />
                Alterar preço
              </Button>
            </>
          )}

          {erro ? (
            <p role="alert" className="w-full text-sm font-medium text-destructive">
              {erro}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </li>
  );
}
