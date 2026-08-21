import type { Papel } from '@/types/dominio';

/**
 * Token simulado da fase mockada.
 *
 * **Nao e um JWT.** E uma unica string base64 com o que a interface precisa
 * saber para se montar: quem e o usuario e quais papeis ele tem. Sem header,
 * sem assinatura, sem expiracao — nada disso teria sentido sem um servidor do
 * outro lado para emitir e conferir.
 *
 * Quando o backend real entrar (F6), este modulo e trocado por um decodificador
 * de JWT de verdade. O resto da aplicacao nao muda, porque so consome
 * `ConteudoDoToken`.
 */
export interface ConteudoDoToken {
  id: string;
  nome: string;
  email: string;
  papeis: Papel[];
}

const PAPEIS_CONHECIDOS: readonly Papel[] = ['CLIENTE', 'ADMIN'];

function paraBase64(texto: string): string {
  // TextEncoder em vez de `btoa` direto: preserva acento no nome do usuario.
  const bytes = new TextEncoder().encode(texto);
  let binario = '';
  for (const byte of bytes) binario += String.fromCharCode(byte);
  return btoa(binario);
}

function deBase64(texto: string): string {
  const binario = atob(texto);
  const bytes = Uint8Array.from(binario, (caractere) => caractere.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function criarToken(conteudo: ConteudoDoToken): string {
  return paraBase64(JSON.stringify(conteudo));
}

/**
 * Devolve `undefined` para token quebrado, em vez de lancar. Um erro nao
 * capturado aqui derrubaria a aplicacao inteira; sessao anonima e o desfecho
 * correto.
 */
export function lerToken(token: string): ConteudoDoToken | undefined {
  try {
    const conteudo: unknown = JSON.parse(deBase64(token));
    if (typeof conteudo !== 'object' || conteudo === null) return undefined;

    const { id, nome, email, papeis } = conteudo as Record<string, unknown>;
    if (typeof id !== 'string') return undefined;

    return {
      id,
      nome: typeof nome === 'string' ? nome : '',
      email: typeof email === 'string' ? email : '',
      papeis: Array.isArray(papeis)
        ? papeis.filter((papel): papel is Papel => PAPEIS_CONHECIDOS.includes(papel as Papel))
        : [],
    };
  } catch {
    return undefined;
  }
}
