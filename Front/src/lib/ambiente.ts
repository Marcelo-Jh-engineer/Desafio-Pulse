/**
 * Leitura unica das variaveis de ambiente. Nenhum outro modulo toca
 * `import.meta.env` direto — assim a troca de mock para API real (F6) acontece
 * num lugar so. Ver docs/prd.md secao 7.4.
 */
export const ambiente = {
  modoApi: import.meta.env.VITE_API_MODE ?? 'mock',
  urlBaseApi: import.meta.env.VITE_API_BASE_URL ?? '/api',
} as const;

export const usandoMock = ambiente.modoApi === 'mock';
