-- ---------------------------------------------------------------
-- Usuario da aplicacao
--
-- A identidade e do Keycloak: senha, papel e credencial de login vivem la.
-- Esta tabela guarda o espelho local, porque pedido e carrinho precisam de
-- uma chave estrangeira estavel e o `sub` do token e o unico identificador
-- que o provedor garante nunca reaproveitar.
--
-- `id` e interno e jamais sai da API. Para o front, o id do usuario e o
-- proprio `keycloak_sub` — docs/models.md secao 5 exige UUID, e criar um
-- segundo UUID ao lado do `sub` seria dois nomes para a mesma pessoa.
-- ---------------------------------------------------------------
CREATE TABLE tb_usuarios (
    id           BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    keycloak_sub UUID         NOT NULL,
    nome         VARCHAR(120) NOT NULL,
    email        VARCHAR(255) NOT NULL,
    -- CPF, CNPJ (so digitos) ou e-mail. Sem mascara e sem campo de tipo de
    -- pessoa: o formato e inferido na leitura (docs/models.md secao 6).
    login        VARCHAR(255) NOT NULL,
    criado_em    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uk_usuarios_sub   UNIQUE (keycloak_sub),
    CONSTRAINT uk_usuarios_email UNIQUE (email),
    CONSTRAINT uk_usuarios_login UNIQUE (login),
    CONSTRAINT ck_usuarios_nome  CHECK (char_length(nome) BETWEEN 3 AND 120),
    -- So digitos, ou algo com arroba. Barra o documento formatado que entrar
    -- por engano — o contrato exige documento sem pontuacao em todo lugar.
    CONSTRAINT ck_usuarios_login CHECK (
        login ~ '^([0-9]{11}|[0-9]{14}|[^@[:space:]]+@[^@[:space:]]+)$')
);

-- O contrato tambem pede que login e e-mail nao colidam ENTRE SI: quem entra
-- digita um valor so, e o servidor procura nos dois campos. Isso e regra de
-- cadastro, verificada no Keycloak antes de gravar aqui — uma constraint de
-- tabela nao alcanca duas colunas de linhas diferentes sem gatilho, e gatilho
-- para uma regra que ja vive no provedor de identidade seria uma segunda
-- verdade sobre o mesmo assunto.
