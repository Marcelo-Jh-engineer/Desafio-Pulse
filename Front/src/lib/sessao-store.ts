import { create } from 'zustand';
import type { Papel } from '@/types/dominio';
import type { RespostaAutenticacao, Sessao } from '@/types/autenticacao';
import { lerToken } from '@/lib/token-simulado';
import { registrarFornecedorDeToken } from '@/lib/http';

/**
 * Sessao do usuario. **Em memoria, nunca persistida** — recarregar a pagina
 * desloga. E o combinado da fase mockada e da decisao de seguranca do PRD
 * secao 8.
 *
 * Mora em `lib/` e nao em `features/autenticacao/` de proposito: o cabecalho,
 * os guardas de rota e, mais adiante, carrinho e checkout dependem da sessao.
 * Dentro de uma feature, todas as outras teriam que importar de uma feature
 * vizinha — exatamente o que RNF-MAN-06 proibe.
 */

const ANONIMA: Sessao = { token: null, usuario: null, papeis: [], autenticado: false };

interface EstadoSessao extends Sessao {
  entrar: (resposta: RespostaAutenticacao) => void;
  sair: () => void;
  /** Verdadeiro quando a sessao tem **algum** dos papeis exigidos. */
  temPapel: (exigidos: Papel[]) => boolean;
}

export const useSessaoStore = create<EstadoSessao>((definir, obter) => ({
  ...ANONIMA,

  entrar: ({ token, usuario }) => {
    const conteudo = lerToken(token);

    // Token quebrado vira sessao anonima, sem excecao.
    if (!conteudo) {
      definir(ANONIMA);
      return;
    }

    definir({
      token,
      usuario,
      // Os papeis vem do **token**, nao do corpo da resposta: e o token que o
      // backend real vai conferir na F6.
      papeis: conteudo.papeis,
      autenticado: true,
    });
  },

  sair: () => {
    definir(ANONIMA);
  },

  temPapel: (exigidos) => {
    if (exigidos.length === 0) return true;
    const { papeis } = obter();
    // Conjunto, nunca `papeis[0]` — o backend pode conceder mais de um papel.
    return exigidos.some((papel) => papeis.includes(papel));
  },
}));

// O cliente HTTP le o token a cada requisicao pelo ponto de injecao que ele
// mesmo expoe. A seta e sempre store -> http, nunca o contrario: `lib/http.ts`
// nao conhece a sessao, entao nao ha ciclo.
registrarFornecedorDeToken(() => useSessaoStore.getState().token);

/** Leitura fora de componente: guardas, testes. */
export function obterSessao(): Sessao {
  const { token, usuario, papeis, autenticado } = useSessaoStore.getState();
  return { token, usuario, papeis, autenticado };
}

/** ADMIN nao compra, entao cai direto na area administrativa apos o login. */
export function rotaDeEntrada(papeis: Papel[]): string {
  return papeis.includes('ADMIN') ? '/admin/produtos' : '/';
}
