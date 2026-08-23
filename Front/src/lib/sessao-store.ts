import { create } from 'zustand';
import type { Papel } from '@/types/dominio';
import type { RespostaAutenticacao, Sessao } from '@/types/autenticacao';
import { lerToken } from '@/lib/token';
import { clienteHttp, registrarFornecedorDeToken, registrarRenovadorDeSessao } from '@/lib/http';

/**
 * Sessao do usuario.
 *
 * O access token vive **em memoria** e some ao recarregar. O que atravessa o F5
 * e o cookie HttpOnly de refresh, guardado pelo navegador e invisivel para o
 * JavaScript: ao abrir a pagina o front pede uma renovacao as cegas e, se o
 * cookie ainda valer, a sessao volta sem ninguem digitar senha. Login so e
 * pedido de novo quando o cookie expira — dez horas — ou quando o usuario sai.
 *
 * Mora em `lib/` e nao em `features/autenticacao/` de proposito: o cabecalho,
 * os guardas de rota e, mais adiante, carrinho e checkout dependem da sessao.
 * Dentro de uma feature, todas as outras teriam que importar de uma feature
 * vizinha — exatamente o que RNF-MAN-06 proibe.
 */

const ANONIMA = {
  token: null,
  usuario: null,
  papeis: [] as Papel[],
  autenticado: false,
};

/**
 * Renovar exatamente no vencimento perderia toda chamada em voo no caminho. Um
 * minuto de folga cobre relogio dessincronizado entre navegador e servidor e a
 * latencia da propria troca.
 */
const FOLGA_DE_RENOVACAO_EM_SEGUNDOS = 60;

interface EstadoSessao extends Sessao {
  entrar: (resposta: RespostaAutenticacao) => void;
  sair: () => void;
  /** Verdadeiro quando a sessao tem **algum** dos papeis exigidos. */
  temPapel: (exigidos: Papel[]) => boolean;
}

export const useSessaoStore = create<EstadoSessao>((definir, obter) => ({
  ...ANONIMA,
  // Comeca ligado: ninguem e visitante confirmado antes de a tentativa de
  // restauracao responder.
  restaurando: true,

  entrar: ({ token, usuario, expiraEmSegundos }) => {
    const conteudo = lerToken(token);

    // Token quebrado vira sessao anonima, sem excecao.
    if (!conteudo) {
      cancelarRenovacaoAgendada();
      definir({ ...ANONIMA, restaurando: false });
      return;
    }

    agendarRenovacao(expiraEmSegundos);

    definir({
      token,
      usuario,
      // Os papeis vem do **token**, nao do corpo da resposta: e o token que o
      // backend confere a cada chamada.
      papeis: conteudo.papeis,
      autenticado: true,
      restaurando: false,
    });
  },

  sair: () => {
    cancelarRenovacaoAgendada();
    definir({ ...ANONIMA, restaurando: false });
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

/**
 * Renovacao. Nao ha nada a enviar: o refresh token esta no cookie e o navegador
 * o anexa sozinho. Por isso a mesma chamada serve para dois casos que parecem
 * diferentes — o token que venceu durante a navegacao e a pagina recem-aberta,
 * onde o front ainda nao sabe se ha sessao.
 */
async function renovarPeloCookie(): Promise<boolean> {
  const { entrar, sair } = useSessaoStore.getState();

  try {
    const resposta = await clienteHttp.criar<RespostaAutenticacao>('/autenticacao/renovar');
    entrar(resposta);
    return true;
  } catch {
    // Cookie ausente, expirado ou revogado: acabou mesmo. Limpar aqui evita que
    // a proxima chamada tente renovar de novo em cima do mesmo cookie morto.
    sair();
    return false;
  }
}

// Quem dispara e o cliente HTTP, ao ver um 401 numa rota de dominio.
registrarRenovadorDeSessao(renovarPeloCookie);

let renovacaoAgendada: ReturnType<typeof setTimeout> | undefined;

function cancelarRenovacaoAgendada(): void {
  if (renovacaoAgendada !== undefined) {
    clearTimeout(renovacaoAgendada);
    renovacaoAgendada = undefined;
  }
}

/**
 * Renovacao proativa: troca o token antes de ele vencer, e nao depois de uma
 * chamada falhar. O retry do cliente HTTP continua valendo como rede de
 * seguranca — para o notebook que dormiu, por exemplo, onde o timer atrasa.
 */
function agendarRenovacao(expiraEmSegundos: number): void {
  cancelarRenovacaoAgendada();

  const segundos = Math.max(expiraEmSegundos - FOLGA_DE_RENOVACAO_EM_SEGUNDOS, 1);
  renovacaoAgendada = setTimeout(() => {
    void renovarPeloCookie();
  }, segundos * 1000);
}

/**
 * Chamada uma vez, na subida do app. Enquanto nao responde, `restaurando` fica
 * ligado e os guardas de rota seguram a decisao.
 */
export async function restaurarSessao(): Promise<void> {
  const restaurada = await renovarPeloCookie();
  // Em caso de falha o proprio `sair()` ja desligou a bandeira; aqui so cobre o
  // caso de sucesso, onde `entrar()` fez o mesmo.
  if (!restaurada) {
    useSessaoStore.setState({ restaurando: false });
  }
}

/** Leitura fora de componente: guardas, testes. */
export function obterSessao(): Sessao {
  const { token, usuario, papeis, autenticado, restaurando } = useSessaoStore.getState();
  return { token, usuario, papeis, autenticado, restaurando };
}

/** ADMIN nao compra, entao cai direto na area administrativa apos o login. */
export function rotaDeEntrada(papeis: Papel[]): string {
  return papeis.includes('ADMIN') ? '/admin/produtos' : '/';
}
