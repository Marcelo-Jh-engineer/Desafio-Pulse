package com.api.ecommerce.infrastructure.client;

import com.api.ecommerce.config.KeycloakConfig;
import com.api.ecommerce.dtos.NovoUsuarioDoKeycloak;
import com.api.ecommerce.dtos.RespostaDeTokenDoKeycloak;
import com.api.ecommerce.infrastructure.exception.ExcecaoDeAutenticacao;
import com.api.ecommerce.infrastructure.exception.ExcecaoDeConflito;
import com.api.ecommerce.infrastructure.exception.ExcecaoDeIdentidade;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

/**
 * Unico lugar do projeto que conversa com o Keycloak.
 *
 * Todo o resto do backend fala em "autenticar", "renovar", "criar usuario" — o
 * nome do provedor, o segredo do client e o formato snake_case das respostas
 * param aqui dentro.
 *
 * As excecoes ja saem traduzidas: esta classe e a que conhece o significado de
 * cada status que o Keycloak devolve.
 */
@Component
public class ClienteDoKeycloak {

    private static final String CREDENCIAIS_INVALIDAS = "Login ou senha incorretos.";
    private static final String SESSAO_EXPIRADA = "Sua sessao expirou. Entre novamente.";

    private final KeycloakConfig config;
    private final RestClient http = RestClient.create();

    public ClienteDoKeycloak(KeycloakConfig config) {
        this.config = config;
    }

    /**
     * Direct grant: o backend apresenta a senha do usuario ao provedor em nome
     * dele. E o que permite que o front nunca conheca o Keycloak — em troca, a
     * senha passa por aqui, entao ela nao pode ser registrada em log nenhum.
     */
    public RespostaDeTokenDoKeycloak autenticar(String identificador, String senha) {
        MultiValueMap<String, String> formulario = comCredenciaisDoClient();
        formulario.add("grant_type", "password");
        formulario.add("username", identificador);
        formulario.add("password", senha);
        formulario.add("scope", "openid profile email");

        return pedirToken(formulario, CREDENCIAIS_INVALIDAS);
    }

    /** Troca o refresh token por um par novo. O antigo deixa de valer. */
    public RespostaDeTokenDoKeycloak renovar(String refreshToken) {
        MultiValueMap<String, String> formulario = comCredenciaisDoClient();
        formulario.add("grant_type", "refresh_token");
        formulario.add("refresh_token", refreshToken);

        return pedirToken(formulario, SESSAO_EXPIRADA);
    }

    /**
     * Encerra a sessao no provedor. Sem isto o refresh token continuaria valendo
     * depois do "sair", e quem tivesse copiado o valor seguiria com acesso.
     */
    public void encerrarSessao(String refreshToken) {
        MultiValueMap<String, String> formulario = comCredenciaisDoClient();
        formulario.add("refresh_token", refreshToken);

        try {
            http.post()
                    .uri(config.urlDeEncerramentoDeSessao())
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(formulario)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException excecao) {
            // Token ja invalido significa sessao ja encerrada: o efeito desejado
            // aconteceu, entao nao ha erro a reportar.
            if (!excecao.getStatusCode().is4xxClientError()) {
                throw new ExcecaoDeIdentidade("Falha ao encerrar a sessao", excecao);
            }
        } catch (RestClientException excecao) {
            throw new ExcecaoDeIdentidade("Falha ao encerrar a sessao", excecao);
        }
    }

    /**
     * Cria o usuario pela API administrativa, com o token da service account do
     * proprio client — o usuario ainda nao existe, entao nao ha token dele.
     */
    public void criarUsuario(NovoUsuarioDoKeycloak novo) {
        String tokenDeServico = tokenDeServico();
        try {
            http.post()
                    .uri(config.urlDeUsuarios())
                    .header("Authorization", "Bearer " + tokenDeServico)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(novo)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException excecao) {
            if (excecao.getStatusCode() == HttpStatus.CONFLICT) {
                // O Keycloak nao diz qual dos dois colidiu. Apontar o login e o
                // palpite util: e o campo que a pessoa escolhe.
                throw new ExcecaoDeConflito(
                        "Ja existe uma conta com este login ou e-mail.",
                        Map.of("login", "Este login ja esta em uso."));
            }
            throw new ExcecaoDeIdentidade("Falha ao criar o usuario no provedor", excecao);
        } catch (RestClientException excecao) {
            throw new ExcecaoDeIdentidade("Falha ao criar o usuario no provedor", excecao);
        }
    }

    /** client_credentials: o client autenticando a si mesmo, sem usuario envolvido. */
    private String tokenDeServico() {
        MultiValueMap<String, String> formulario = comCredenciaisDoClient();
        formulario.add("grant_type", "client_credentials");
        return pedirToken(formulario, null).accessToken();
    }

    private MultiValueMap<String, String> comCredenciaisDoClient() {
        MultiValueMap<String, String> formulario = new LinkedMultiValueMap<>();
        formulario.add("client_id", config.clientId());
        formulario.add("client_secret", config.clientSecret());
        return formulario;
    }

    /**
     * @param mensagemDe4xx o que dizer ao usuario quando o provedor recusa. Nulo
     *                      quando a recusa nao e culpa de quem esta na tela — ai
     *                      o caso e falha de configuracao, e vira 502
     */
    private RespostaDeTokenDoKeycloak pedirToken(
            MultiValueMap<String, String> formulario, String mensagemDe4xx) {
        RespostaDeTokenDoKeycloak resposta;
        try {
            resposta = http.post()
                    .uri(config.urlDeToken())
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(formulario)
                    .retrieve()
                    .body(RespostaDeTokenDoKeycloak.class);
        } catch (RestClientResponseException excecao) {
            if (mensagemDe4xx != null && excecao.getStatusCode().is4xxClientError()) {
                throw new ExcecaoDeAutenticacao(mensagemDe4xx);
            }
            throw new ExcecaoDeIdentidade("O provedor recusou o pedido de token", excecao);
        } catch (RestClientException excecao) {
            throw new ExcecaoDeIdentidade("Falha ao pedir token ao provedor", excecao);
        }

        if (resposta == null || resposta.accessToken() == null) {
            throw new ExcecaoDeIdentidade("O provedor nao devolveu access token.");
        }
        return resposta;
    }
}
