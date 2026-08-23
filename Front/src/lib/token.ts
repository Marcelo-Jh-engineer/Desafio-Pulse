import type { ConteudoDoToken } from '@/types/autenticacao';
import type { Papel } from '@/types/dominio';

/**
 * Leitura da carga do JWT emitido pelo backend.
 *
 * **Nada aqui e verificacao de seguranca.** Ler a carga sem conferir assinatura
 * serve para montar a interface — decidir o que aparece no menu, qual rota o
 * papel alcanca — e mais nada. Quem valida o token e o backend, a cada chamada.
 */

const PAPEIS_CONHECIDOS: readonly Papel[] = ['CLIENTE', 'ADMIN'];

/** JWT usa base64url e omite o preenchimento; `atob` espera base64 completo. */
function deBase64Url(segmento: string): string {
  const base64 = segmento.replace(/-/g, '+').replace(/_/g, '/');
  const completo = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binario = atob(completo);
  const bytes = Uint8Array.from(binario, (caractere) => caractere.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Os papeis chegam em `realm_access.roles` junto de papeis tecnicos do provedor
 * (`offline_access`, `uma_authorization`). So os do dominio interessam.
 */
function papeisDe(carga: Record<string, unknown>): Papel[] {
  const acessoDoRealm = carga.realm_access;
  if (typeof acessoDoRealm !== 'object' || acessoDoRealm === null) return [];

  const { roles } = acessoDoRealm as Record<string, unknown>;
  if (!Array.isArray(roles)) return [];

  return roles.filter((papel): papel is Papel => PAPEIS_CONHECIDOS.includes(papel as Papel));
}

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor : '';
}

/** Token quebrado devolve `undefined` em vez de lancar: a sessao vira anonima. */
export function lerToken(token: string): ConteudoDoToken | undefined {
  const partes = token.split('.');
  const carga64 = partes[1];
  if (partes.length !== 3 || carga64 === undefined) return undefined;

  try {
    const carga: unknown = JSON.parse(deBase64Url(carga64));
    if (typeof carga !== 'object' || carga === null) return undefined;

    const registro = carga as Record<string, unknown>;
    // `sub` e obrigatoria pela RFC 7519; sem ela nao ha usuario.
    if (typeof registro.sub !== 'string') return undefined;

    // `preferred_username` e o login: e nele que o Keycloak guarda o CPF, o
    // CNPJ ou o e-mail que a pessoa escolheu para entrar.
    const login = texto(registro.preferred_username);

    return {
      id: registro.sub,
      nome: texto(registro.name) || login,
      email: texto(registro.email),
      login,
      papeis: papeisDe(registro),
    };
  } catch {
    return undefined;
  }
}
