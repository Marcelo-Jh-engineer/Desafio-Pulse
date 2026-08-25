/**
 * Leitura unica das variaveis de ambiente. Nenhum outro modulo toca
 * `import.meta.env` direto.
 *
 * Sobrou uma variavel so. Nao ha mais modo de API: o front fala com a API de
 * verdade, sempre — o que ela ainda nao expoe simplesmente nao funciona, em vez
 * de funcionar contra um servidor imaginario.
 */
export const ambiente = {
  urlBaseApi: import.meta.env.VITE_API_BASE_URL ?? '/api',
} as const;
