package com.api.ecommerce.controllers;

import com.api.ecommerce.business.mapper.UsuarioMapper;
import com.api.ecommerce.business.service.ServicoDePedido;
import com.api.ecommerce.business.service.ServicoDeUsuario;
import com.api.ecommerce.dtos.out.ErroDtoOut;
import com.api.ecommerce.dtos.out.PaginaDtoOut;
import com.api.ecommerce.dtos.out.PedidoDtoOut;
import com.api.ecommerce.dtos.out.UsuarioDtoOut;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/api/pedidos")
@Tag(name = "Pedidos", description = "Checkout e historico do usuario autenticado")
public class PedidoController {

    private final ServicoDePedido pedidos;
    private final ServicoDeUsuario usuarios;
    private final UsuarioMapper usuarioMapper;

    public PedidoController(ServicoDePedido pedidos,
                            ServicoDeUsuario usuarios,
                            UsuarioMapper usuarioMapper) {
        this.pedidos = pedidos;
        this.usuarios = usuarios;
        this.usuarioMapper = usuarioMapper;
    }


    @Operation(summary = "Cria o pedido a partir do carrinho aberto",
            description = """
                    O pedido copia cada linha do carrinho — nome, unidade, quantidade e o
                    preco congelado na adicao. E esse preco que e cobrado, e nao o do
                    catalogo agora: o cliente paga o que viu na tela.

                    Antes de criar, cada item e revalidado contra o produto — ativo e com
                    estoque. As falhas voltam TODAS juntas, em `errosPorCampo`, com o id
                    publico do produto na chave.

                    `Idempotency-Key` e opcional: repetir o envio com a mesma chave devolve
                    o pedido que ja existe, com 201, em vez de criar um segundo. Sem o
                    header, o servidor gera uma chave — o que grava a linha, mas nao protege
                    contra clique duplo.
                    """,
            responses = {
                @ApiResponse(responseCode = "201",
                        description = "Pedido criado — ou o mesmo pedido, no reenvio com a mesma chave"),
                @ApiResponse(responseCode = "400", description = "Chave de idempotencia longa demais",
                        content = @Content(schema = @Schema(implementation = ErroDtoOut.class))),
                @ApiResponse(responseCode = "401", description = "Sem token ou token invalido",
                        content = @Content(schema = @Schema(implementation = ErroDtoOut.class))),
                @ApiResponse(responseCode = "403", description = "Token sem o papel CLIENTE",
                        content = @Content(schema = @Schema(implementation = ErroDtoOut.class))),
                @ApiResponse(responseCode = "409",
                        description = "Sem carrinho aberto, carrinho vazio, ou item indisponivel",
                        content = @Content(schema = @Schema(implementation = ErroDtoOut.class)))
            })
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PedidoDtoOut criar(
            @AuthenticationPrincipal Jwt token,
            @Parameter(description = "Identifica a tentativa de checkout. Repetir a mesma "
                    + "chave devolve o pedido ja criado")
            @RequestHeader(name = "Idempotency-Key", required = false) String chaveIdempotencia) {

        return pedidos.criar(donoDaRequisicao(token), chaveIdempotencia);
    }


    @Operation(summary = "Mostra um pedido do cliente",
            responses = {
                @ApiResponse(responseCode = "200", description = "O pedido"),
                @ApiResponse(responseCode = "401", description = "Sem token ou token invalido",
                        content = @Content(schema = @Schema(implementation = ErroDtoOut.class))),
                @ApiResponse(responseCode = "403", description = "Token sem o papel CLIENTE",
                        content = @Content(schema = @Schema(implementation = ErroDtoOut.class))),
                @ApiResponse(responseCode = "404", description = "Nao existe, ou nao e de quem pediu",
                        content = @Content(schema = @Schema(implementation = ErroDtoOut.class)))
            })
    @GetMapping("/{idPublico}")
    public PedidoDtoOut buscar(
            @AuthenticationPrincipal Jwt token,
            @Parameter(description = "Id publico do pedido") @PathVariable UUID idPublico) {

        return pedidos.buscar(donoDaRequisicao(token), idPublico);
    }

    /** O historico do proprio cliente, do mais recente para o mais antigo. */
    @Operation(summary = "Lista os pedidos do cliente",
            description = """
                    Paginado, mais recentes primeiro. A ordem nao se escolhe.

                    `tamanho` e limitado a 50 por pagina: a consulta traz as linhas de cada
                    pedido junto, e sem teto um unico pedido carregaria o historico inteiro.
                    """,
            responses = {
                @ApiResponse(responseCode = "200", description = "Pagina de pedidos"),
                @ApiResponse(responseCode = "401", description = "Sem token ou token invalido",
                        content = @Content(schema = @Schema(implementation = ErroDtoOut.class))),
                @ApiResponse(responseCode = "403", description = "Token sem o papel CLIENTE",
                        content = @Content(schema = @Schema(implementation = ErroDtoOut.class)))
            })
    @GetMapping
    public PaginaDtoOut<PedidoDtoOut> listar(
            @AuthenticationPrincipal Jwt token,
            @Parameter(description = "Indice base 0") @RequestParam(required = false) Integer pagina,
            @Parameter(description = "Itens por pagina, no maximo 50")
            @RequestParam(required = false) Integer tamanho) {

        return pedidos.listar(donoDaRequisicao(token), pagina, tamanho);
    }

    /**
     * O `sub` de quem apresentou o token, com o espelho local garantido.
     *
     * Mesmo caminho do carrinho, e pelo mesmo motivo: a sincronizacao acontece
     * aqui porque e aqui que o token existe — o servico trabalha com UUID e nao
     * deve saber o que e um JWT. Sem este passo, o primeiro checkout de alguem
     * recem-cadastrado falharia, porque `usuario_id` e NOT NULL.
     *
     * E tambem o que mantem o retrato do comprador atualizado: o pedido copia
     * nome, e-mail e login do espelho no instante da compra, e o espelho acabou
     * de ser reescrito com o que o Keycloak diz agora.
     */
    private UUID donoDaRequisicao(Jwt token) {
        UsuarioDtoOut eu = usuarioMapper.paraDto(token);
        UUID sub = UUID.fromString(eu.id());

        usuarios.sincronizar(sub, eu.nome(), eu.email(), eu.login());

        return sub;
    }
}
