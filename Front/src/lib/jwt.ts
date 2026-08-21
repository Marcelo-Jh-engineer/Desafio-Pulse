import type { ClaimsJwt } from '@/types/autenticacao';
import type { Papel } from '@/types/dominio';

/**
 * Decodificacao de JWT escrita a mao — docs/prd.md secao 7.5. Dispensa
 * `jwt-decode`: sao poucas linhas de base64url mais `JSON.parse`.
 *
 * **Nao valida assinatura, de proposito.** O front decodifica para montar a
 * interface, nunca para autorizar. Quem valida assinatura e papel em toda
 * requisicao privilegiada e o backend (docs/prd.md secao 3.3).
 */

const PAPEIS_CONHECIDOS: readonly Papel[] = ['CLIENTE', 'ADMIN'];

/** base64url difere de base64 em dois caracteres e no preenchimento. */
function decodificarBase64Url(segmento: string): string {
  const base64 = segmento.replace(/-/g, '+').replace(/_/g, '/');
  const preenchido = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binario = atob(preenchido);

  // Percorre byte a byte para nao quebrar acento no nome do usuario.
  const bytes = Uint8Array.from(binario, (caractere) => caractere.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null;
}

function extrairPapeis(valor: unknown): Papel[] {
  if (!Array.isArray(valor)) return [];
  return valor.filter((item): item is Papel => PAPEIS_CONHECIDOS.includes(item as Papel));
}

/**
 * Devolve as claims, ou `undefined` quando o token e malformado.
 *
 * Token quebrado nunca lanca: vira sessao anonima. Um erro nao capturado aqui
 * derrubaria a aplicacao inteira por causa de um dado que o front nem controla.
 */
export function decodificarToken(token: string): ClaimsJwt | undefined {
  const segmentos = token.split('.');
  if (segmentos.length !== 3) return undefined;

  try {
    const conteudo: unknown = JSON.parse(decodificarBase64Url(segmentos[1] ?? ''));
    if (!ehObjeto(conteudo)) return undefined;

    const { sub, iat, exp, email, nome, papeis } = conteudo;
    if (typeof sub !== 'string' || typeof exp !== 'number') return undefined;

    return {
      sub,
      iat: typeof iat === 'number' ? iat : 0,
      exp,
      email: typeof email === 'string' ? email : '',
      nome: typeof nome === 'string' ? nome : '',
      papeis: extrairPapeis(papeis),
    };
  } catch {
    return undefined;
  }
}

/** `exp` esta em segundos; `Date.now()` em milissegundos. */
export function tokenExpirado(claims: ClaimsJwt, agoraEmSegundos = Date.now() / 1000): boolean {
  return claims.exp <= agoraEmSegundos;
}
