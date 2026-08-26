package com.api.ecommerce.controllers;

import com.api.ecommerce.business.mapper.UsuarioMapper;
import com.api.ecommerce.business.service.ServicoDePagamento;
import com.api.ecommerce.business.service.ServicoDeUsuario;
import com.api.ecommerce.dtos.in.PagamentoDtoIn;
import com.api.ecommerce.dtos.out.ErroDtoOut;
import com.api.ecommerce.dtos.out.PagamentoDtoOut;
import com.api.ecommerce.dtos.out.UsuarioDtoOut;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pedidos/{idPublico}/pagamentos")
@Tag(name = "Pagamentos", description = "Cobranca assincrona de um pedido")
public class PagamentoController {

    private final ServicoDePagamento pagamentos;
    private final ServicoDeUsuario usuarios;
    private final UsuarioMapper usuarioMapper;

    public PagamentoController(ServicoDePagamento pagamentos,
                               ServicoDeUsuario usuarios,
                               UsuarioMapper usuarioMapper) {
        this.pagamentos = pagamentos;
        this.usuarios = usuarios;
        this.usuarioMapper = usuarioMapper;
    }

    /**
     * Pede a cobranca de um pedido PENDENT
     */
    @Operation(summary = "Solicita o pagamento do pedido",
            description = """
                    Responde 202 na hora, com a tentativa em `PENDENTE` e `processadoEm`
                    nulo. O desfecho chega depois, pela fila: consulte o pedido ou a lista
                    de tentativas ate `processadoEm` vir preenchido.

                    Pedir de novo enquanto ha uma tentativa `PENDENTE` devolve AQUELA, sem
                    criar segunda cobranca.

                    Com o broker desligado a rota continua respondendo 202: o evento espera
                    no outbox e sai quando o RabbitMQ voltar.
                    """,
            responses = {
                @ApiResponse(responseCode = "202", description = "Cobranca enfileirada"),
                @ApiResponse(responseCode = "400", description = "Metodo ausente ou desconhecido",
                        content = @Content(schema = @Schema(implementation = ErroDtoOut.class))),
                @ApiResponse(responseCode = "401", description = "Sem token ou token invalido",
                        content = @Content(schema = @Schema(implementation = ErroDtoOut.class))),
                @ApiResponse(responseCode = "403", description = "Token sem o papel CLIENTE",
                        content = @Content(schema = @Schema(implementation = ErroDtoOut.class))),
                @ApiResponse(responseCode = "404", description = "Pedido inexistente, ou de outra pessoa",
                        content = @Content(schema = @Schema(implementation = ErroDtoOut.class))),
                @ApiResponse(responseCode = "409", description = "Pedido ja pago, cancelado, ou nao cobravel",
                        content = @Content(schema = @Schema(implementation = ErroDtoOut.class)))
            })
    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    public PagamentoDtoOut solicitar(
            @AuthenticationPrincipal Jwt token,
            @Parameter(description = "Id publico do pedido") @PathVariable UUID idPublico,
            @Valid @RequestBody PagamentoDtoIn requisicao) {

        return pagamentos.solicitar(donoDaRequisicao(token), idPublico, requisicao.metodo());
    }

    /**
     * As tentativas daquele pedido, mais recentes primeiro.
     *
     * Sao varias de proposito: uma recusa nao apaga o pedido, e o cliente tenta
     * de novo. O historico e o que permite a tela mostrar "a cobranca de ontem
     * foi recusada por saldo" em vez de apenas "nao pago".
     */
    @Operation(summary = "Lista as tentativas de pagamento do pedido",
            responses = {
                @ApiResponse(responseCode = "200", description = "Tentativas, recentes primeiro"),
                @ApiResponse(responseCode = "401", description = "Sem token ou token invalido",
                        content = @Content(schema = @Schema(implementation = ErroDtoOut.class))),
                @ApiResponse(responseCode = "403", description = "Token sem o papel CLIENTE",
                        content = @Content(schema = @Schema(implementation = ErroDtoOut.class))),
                @ApiResponse(responseCode = "404", description = "Pedido inexistente, ou de outra pessoa",
                        content = @Content(schema = @Schema(implementation = ErroDtoOut.class)))
            })
    @GetMapping
    public List<PagamentoDtoOut> listar(
            @AuthenticationPrincipal Jwt token,
            @Parameter(description = "Id publico do pedido") @PathVariable UUID idPublico) {

        return pagamentos.listar(donoDaRequisicao(token), idPublico);
    }

    /** Mesmo caminho do carrinho e do pedido: o `sub` com o espelho garantido. */
    private UUID donoDaRequisicao(Jwt token) {
        UsuarioDtoOut eu = usuarioMapper.paraDto(token);
        UUID sub = UUID.fromString(eu.id());

        usuarios.sincronizar(sub, eu.nome(), eu.email(), eu.login());

        return sub;
    }
}
