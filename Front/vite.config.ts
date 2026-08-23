import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const ambiente = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        // Com VITE_API_MODE=mock o worker do MSW intercepta antes da rede e este
        // proxy nunca e usado. Com `http`, ele mantem o SPA e a API na mesma
        // origem: sem isso o login vira um passeio entre 5173, 8080 e 8081 com
        // CORS no meio, para nenhum ganho.
        '/api': {
          target: ambiente.VITE_API_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
  };
});
