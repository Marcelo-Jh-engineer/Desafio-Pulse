# ---------------------------------------------------------------
# Identidade do projeto "Voce no Coracao da Gente"
#
# Imagem de Keycloak com realm, clients, papeis, usuarios de teste e tema de
# login ja dentro. Quem for avaliar o projeto roda `docker compose up -d` e nao
# abre o console administrativo nenhuma vez.
#
# O que NAO entra na imagem: senha de banco, senha do admin e segredo do client.
# Segredo em layer aparece em `docker history` — esses ficam no .env.
# ---------------------------------------------------------------
FROM quay.io/keycloak/keycloak:26.0 AS construcao

# Opcoes de BUILD ficam gravadas na imagem pelo kc.sh build: nao precisam
# existir no ambiente de quem sobe o container.
ENV KC_DB=postgres
ENV KC_HEALTH_ENABLED=true

# Realm versionado: papeis, clients e usuarios de teste.
COPY docker/keycloak/realm-ecommerce.json /opt/keycloak/data/import/realm-ecommerce.json

# Tema de login com a marca. O realm aponta para ele em loginTheme.
COPY docker/keycloak/temas/vcgente /opt/keycloak/themes/vcgente

RUN /opt/keycloak/bin/kc.sh build

# Segundo estagio para nao carregar o cache do build na imagem final.
FROM quay.io/keycloak/keycloak:26.0
COPY --from=construcao /opt/keycloak/ /opt/keycloak/

# As mesmas opcoes de build precisam existir no estagio final: sem elas o
# Keycloak reavalia a configuracao no boot e volta para o banco embutido,
# recusando a URL do Postgres com "Driver does not support the provided URL".
ENV KC_DB=postgres
ENV KC_HEALTH_ENABLED=true

# `start --optimized` usa o build ja gravado na imagem, sem refazer nada no
# boot. HTTP puro e liberado no compose (KC_HTTP_ENABLED) porque isto e
# ambiente de avaliacao local; em producao entraria TLS e hostname reais.
#
# --import-realm so importa se o realm AINDA NAO existe. Depois do primeiro
# start, mudar o JSON nao muda nada ate `docker compose down -v`.
ENTRYPOINT ["/opt/keycloak/bin/kc.sh", "start", "--optimized", "--import-realm"]
