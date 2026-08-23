-- O Keycloak guarda o estado dele no mesmo servidor Postgres, em database
-- separada da aplicacao. Roda uma unica vez, quando o volume nasce vazio:
-- quem clona o projeto sobe o compose e nao cria database nenhuma na mao.
CREATE DATABASE keycloak;
