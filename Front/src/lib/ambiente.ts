/**
 * Leitura unica das variaveis de ambiente. Nenhum outro modulo toca
 * `import.meta.env` direto — assim a troca de mock para API real (F6) acontece
 * num lugar so. Ver docs/prd.md secao 7.4.
 */
export const ambiente = {
  modoApi: import.meta.env.VITE_API_MODE ?? 'mock',
  urlBaseApi: import.meta.env.VITE_API_BASE_URL ?? '/api',
} as const;

/**
 * Comparacao direta contra `import.meta.env`, nao contra `ambiente.modoApi`.
 *
 * O Vite substitui `import.meta.env.VITE_API_MODE` por um literal no build,
 * entao esta linha vira `false` constante quando o modo e `http` — e o Rollup
 * elimina o import dinamico do MSW junto. Lendo pelo objeto acima a constante
 * nao se propaga e os 424 kB do MSW acabam no `dist` de producao, violando
 * docs/prd.md secao 7.3.
 */
export const usandoMock = import.meta.env.VITE_API_MODE !== 'http';
