package com.api.ecommerce.controllers;

import com.api.ecommerce.business.service.ServicoDeAutenticacao;
import com.api.ecommerce.config.CookieDeSessao;
import com.api.ecommerce.dtos.ErroDto;
import com.api.ecommerce.dtos.RequisicaoCadastroDto;
import com.api.ecommerce.dtos.RequisicaoLoginDto;
import com.api.ecommerce.dtos.RespostaAutenticacaoDto;
import com.api.ecommerce.dtos.SessaoCriadaDto;
import com.api.ecommerce.infrastructure.exception.ExcecaoDeAutenticacao;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Autenticacao. O front conhece estes quatro enderecos e mais nada — nao sabe o
 * nome do provedor, nem o realm, nem o client.
 *
 * As quatro rotas trabalham com um cookie HttpOnly: login e cadastro o emitem,
 * renovar o gira, sair o apaga. O front nunca ve o refresh token — nem para
 * guardar, nem para mandar de volta. Ele so pede a renovacao; o navegador anexa
 * o cookie sozinho.
 *
 * O quinto endereco do fluxo, `GET /api/me`, fica em UsuarioController: ele nao
 * autentica ninguem, so descreve quem o token ja diz que e.
 */
@RestController
@RequestMapping("/api/autenticacao")
@Tag(name = "Autenticacao")
public class AutenticacaoController {

    private final ServicoDeAutenticacao servico;
    private final CookieDeSessao cookie;

    public AutenticacaoController(ServicoDeAutenticacao servico, CookieDeSessao cookie) {
        this.servico = servico;
        this.cookie = cookie;
    }

    @PostMapping("/login")
    @Operation(summary = "Autentica, devolve o access token e grava o cookie de sessao")
    @ApiResponse(responseCode = "200", description = "Sessao criada")
    @ApiResponse(responseCode = "401", description = "Login ou senha incorretos",
            content = @Content(schema = @Schema(implementation = ErroDto.class)))
    public ResponseEntity<RespostaAutenticacaoDto> login(@Valid @RequestBody RequisicaoLoginDto pedido) {
        return comCookie(servico.entrar(pedido), HttpStatus.OK);
    }

    @PostMapping("/cadastro")
    @Operation(summary = "Cria a conta e ja devolve a sessao")
    @ApiResponse(responseCode = "201", description = "Conta criada e sessao iniciada")
    @ApiResponse(responseCode = "409", description = "Login ou e-mail ja em uso",
            content = @Content(schema = @Schema(implementation = ErroDto.class)))
    public ResponseEntity<RespostaAutenticacaoDto> cadastro(@Valid @RequestBody RequisicaoCadastroDto pedido) {
        return comCookie(servico.cadastrar(pedido), HttpStatus.CREATED);
    }

    /**
     * Renovacao. Nao exige o access token — ele ja pode ter vencido, e e por isso
     * que esta chamada existe — e nao tem corpo: o refresh token chega no cookie.
     *
     * E tambem o que sustenta o F5: ao abrir a pagina o front chama esta rota as
     * cegas, e ou recebe uma sessao de volta ou segue como visitante.
     */
    @PostMapping("/renovar")
    @Operation(summary = "Troca o cookie de sessao por um access token novo")
    @ApiResponse(responseCode = "200", description = "Sessao renovada")
    @ApiResponse(responseCode = "401", description = "Cookie ausente, expirado ou revogado",
            content = @Content(schema = @Schema(implementation = ErroDto.class)))
    public ResponseEntity<RespostaAutenticacaoDto> renovar(
            @CookieValue(name = CookieDeSessao.NOME, required = false) String refreshToken) {
        // Sem cookie nao ha sessao a renovar. 401 e a resposta honesta, e e o que
        // o front interpreta como "siga como visitante".
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new ExcecaoDeAutenticacao("Sessao ausente ou expirada");
        }
        return comCookie(servico.renovar(refreshToken), HttpStatus.OK);
    }

    /**
     * Encerra a sessao no provedor e apaga o cookie.
     *
     * Sem cookie tambem responde 204: quem pediu para sair ja esta fora, e um
     * erro aqui so atrapalharia a interface.
     */
    @PostMapping("/sair")
    @Operation(summary = "Revoga a sessao no provedor e apaga o cookie")
    @ApiResponse(responseCode = "204", description = "Sessao encerrada")
    public ResponseEntity<Void> sair(
            @CookieValue(name = CookieDeSessao.NOME, required = false) String refreshToken) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            servico.sair(refreshToken);
        }
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookie.limpar().toString())
                .build();
    }

    /** O corpo leva o access token; o cookie, o refresh. Nunca o contrario. */
    private ResponseEntity<RespostaAutenticacaoDto> comCookie(SessaoCriadaDto sessao, HttpStatus status) {
        ResponseCookie cookieResponse = cookie.criar(sessao.refreshToken(), sessao.refreshExpiraEmSegundos());
        return ResponseEntity.status(status)
                .header(HttpHeaders.SET_COOKIE, cookieResponse.toString())
                .body(sessao.corpo());
    }
}
