/**
 * RNF-SEC-06: o destino pos-login aceita **apenas caminho interno**.
 *
 * Comecar com `/` nao basta: `//evil.com` e `/\evil.com` sao caminhos que o
 * navegador resolve como endereco externo. Qualquer coisa fora do padrao vira
 * a raiz, silenciosamente — nao ha o que explicar ao usuario aqui.
 */
const DESTINO_PADRAO = '/';

/** `//host` e `/\host` levam para fora do site mesmo comecando com barra. */
const ESCAPA_DO_SITE = /^\/[/\\]/;

export function sanitizarDestino(valor: string | null | undefined): string {
  if (!valor) return DESTINO_PADRAO;

  const limpo = valor.trim();
  if (!limpo.startsWith('/')) return DESTINO_PADRAO;
  if (ESCAPA_DO_SITE.test(limpo)) return DESTINO_PADRAO;

  return limpo;
}

/** Monta `/login?retornarPara=...` com o destino ja sanitizado e codificado. */
export function urlDeLoginCom(destino: string): string {
  const seguro = sanitizarDestino(destino);
  if (seguro === DESTINO_PADRAO) return '/login';
  return `/login?retornarPara=${encodeURIComponent(seguro)}`;
}
