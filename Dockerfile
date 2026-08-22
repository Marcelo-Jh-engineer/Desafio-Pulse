# ---------------------------------------------------------------
# Banco de dados do projeto "Voce no Coracao da Gente"
#
# Imagem unica do Postgres usada pelo backend Spring Boot em Back/ecommerce.
# O schema NAO e criado aqui: quem versiona tabela e o Flyway, em
# Back/ecommerce/src/main/resources/db/migration. Esta imagem so entrega o
# servidor com database, usuario e encoding corretos.
#
# Uso recomendado (le o .env sozinho):
#   docker compose up -d
#
# Uso direto, sem compose:
#   docker build -t pulse-postgres:16 .
#   docker run -d --name pulse-postgres -p 5432:5432 \
#     -e POSTGRES_DB=ecommerce -e POSTGRES_USER=postgres \
#     -e POSTGRES_PASSWORD=postgres \
#     -v dados-postgres:/var/lib/postgresql/data pulse-postgres:16
# ---------------------------------------------------------------
FROM postgres:16-alpine

# UTF-8 e obrigatorio: nome de produto e categoria tem acento.
ENV LANG=C.UTF-8

# --locale=C mantem a ordenacao independente de locale instalado no host,
# entao ORDER BY nome da o mesmo resultado na maquina de cada dev e em CI.
# Acentuacao continua correta porque o encoding e UTF8.
ENV POSTGRES_INITDB_ARGS="--encoding=UTF8 --locale=C"

# Valores de fallback. Compose e docker run sobrescrevem via .env / -e.
ENV POSTGRES_DB=ecommerce
ENV POSTGRES_USER=postgres

# Sem POSTGRES_PASSWORD de fallback de proposito: a imagem falha ao subir se
# a senha nao for injetada, em vez de subir com uma senha conhecida por todos.

EXPOSE 5432

# Flyway e o backend so devem conectar depois que o initdb terminar.
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
    CMD pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" || exit 1
