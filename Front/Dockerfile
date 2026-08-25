# ---------------------------------------------------------------
# SPA do projeto "Voce no Coracao da Gente"
#
# Dois estagios: o primeiro gera o `dist` com Vite, o segundo serve os arquivos
# com nginx. A imagem final nao tem Node, nem node_modules, nem codigo-fonte.
#
# Contexto de build: esta pasta (Front).
# ---------------------------------------------------------------
FROM node:22-alpine AS construcao

WORKDIR /construcao

# Manifesto primeiro: enquanto as dependencias nao mudam, `npm ci` fica em cache.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Entra como ARG porque o Vite resolve `import.meta.env` em tempo de BUILD:
# trocar isso depois exigiria reconstruir a imagem, nao reiniciar o container.
# Variavel ja presente no ambiente vence os arquivos .env, entao o ENV abaixo e
# o que manda.
#
# `/api` na mesma origem: o nginx desta imagem faz proxy para a API.
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# `npm run build` roda a verificacao de tipos antes do bundle: erro de tipo
# quebra a imagem em vez de virar bug em producao.
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=construcao /construcao/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
    CMD wget -qO- http://127.0.0.1/ > /dev/null || exit 1
