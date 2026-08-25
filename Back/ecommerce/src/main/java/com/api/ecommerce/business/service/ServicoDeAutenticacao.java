package com.api.ecommerce.business.service;

import com.api.ecommerce.business.mapper.UsuarioMapper;
import com.api.ecommerce.dtos.in.CadastroDtoIn;
import com.api.ecommerce.dtos.in.LoginDtoIn;
import com.api.ecommerce.dtos.SessaoCriadaDto;
import com.api.ecommerce.dtos.NovoUsuarioDoKeycloak;
import com.api.ecommerce.dtos.RespostaDeTokenDoKeycloak;
import com.api.ecommerce.dtos.out.AutenticacaoDtoOut;
import com.api.ecommerce.infrastructure.client.ClienteDoKeycloak;
import com.api.ecommerce.infrastructure.exception.ExcecaoDeIdentidade;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Service;

/**
 * Login, cadastro, renovacao e saida.
 *
 * A API e um proxy para o provedor de identidade: o front manda login e senha
 * para ca, recebe JWT e refresh token, e nunca descobre que existe um Keycloak
 * atras. Em troca dessa simplicidade a senha trafega pelo backend — e a
 * concessao consciente do direct grant.
 */
@Service
public class ServicoDeAutenticacao {

    private final ClienteDoKeycloak keycloak;
    private final UsuarioMapper usuarioMapper;
    private final JwtDecoder decodificador;

    public ServicoDeAutenticacao(
            ClienteDoKeycloak keycloak, UsuarioMapper usuarioMapper, JwtDecoder decodificador) {
        this.keycloak = keycloak;
        this.usuarioMapper = usuarioMapper;
        this.decodificador = decodificador;
    }

    public SessaoCriadaDto entrar(LoginDtoIn pedido) {
        return traduzir(keycloak.autenticar(pedido.identificador(), pedido.senha()));
    }

    /**
     * Cria a conta e ja devolve a sessao pronta: quem acabou de se cadastrar nao
     * deveria ter que digitar a mesma senha de novo.
     *
     * O papel CLIENTE nao e concedido aqui — ele vem de `default-roles-ecommerce`
     * no realm, entao todo usuario novo ja nasce com ele.
     */
    public SessaoCriadaDto cadastrar(CadastroDtoIn pedido) {
        keycloak.criarUsuario(NovoUsuarioDoKeycloak.de(
                pedido.login(),
                pedido.email(),
                primeiroNomeDe(pedido.nome()),
                sobrenomeDe(pedido.nome()),
                pedido.senha()));

        return traduzir(keycloak.autenticar(pedido.login(), pedido.senha()));
    }

    /**
     * O realm gira o refresh token a cada renovacao: o antigo morre na hora. Por
     * isso a resposta traz um refresh novo, e o controller precisa regravar o
     * cookie — manter o anterior derrubaria a sessao na proxima tentativa.
     */
    public SessaoCriadaDto renovar(String refreshToken) {
        return traduzir(keycloak.renovar(refreshToken));
    }

    public void sair(String refreshToken) {
        keycloak.encerrarSessao(refreshToken);
    }

    /**
     * O usuario devolvido sai do proprio token, nunca da requisicao. Decodificar
     * valida assinatura, issuer e expiracao — o mesmo tratamento que o token
     * recebe depois, a cada chamada da API.
     */
    private SessaoCriadaDto traduzir(RespostaDeTokenDoKeycloak token) {
        Jwt acesso;
        try {
            acesso = decodificador.decode(token.accessToken());
        } catch (JwtException excecao) {
            throw new ExcecaoDeIdentidade("Token recebido do provedor nao passou na validacao", excecao);
        }

        AutenticacaoDtoOut corpo = new AutenticacaoDtoOut(
                token.accessToken(),
                token.expiraEm(),
                usuarioMapper.paraDto(acesso));

        return new SessaoCriadaDto(corpo, token.refreshToken(), token.refreshExpiraEm());
    }

    /**
     * O cadastro pede um nome completo; o Keycloak guarda dois campos. Quem
     * digitou um nome unico fica so com o primeiro, e esta certo assim.
     */
    private static String primeiroNomeDe(String nomeCompleto) {
        String limpo = nomeCompleto.trim();
        int espaco = limpo.indexOf(' ');
        return espaco < 0 ? limpo : limpo.substring(0, espaco);
    }

    private static String sobrenomeDe(String nomeCompleto) {
        String limpo = nomeCompleto.trim();
        int espaco = limpo.indexOf(' ');
        return espaco < 0 ? "" : limpo.substring(espaco + 1).trim();
    }
}
