package com.api.ecommerce.controllers;

import com.api.ecommerce.business.mapper.UsuarioMapper;
import com.api.ecommerce.business.service.ServicoDeCarrinho;
import com.api.ecommerce.business.service.ServicoDeUsuario;
import com.api.ecommerce.dtos.CarrinhoDto;
import com.api.ecommerce.dtos.ErroDto;
import com.api.ecommerce.dtos.RequisicaoDeItemDoCarrinho;
import com.api.ecommerce.dtos.UsuarioDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Carrinho de quem esta logado.
 *
 * **Nenhuma rota recebe o id do carrinho.** Ele sai do token: uma pessoa tem no
 * maximo um carrinho ABERTO, e e sempre esse. Aceitar o id no caminho criaria a
 * possibilidade de pedir o carrinho alheio, e a defesa contra isso seria uma
 * conferencia de dono que so precisa existir porque o parametro existe.
 *
 * Todas exigem autenticacao — `anyRequest().authenticated()` em
 * ConfiguracaoDeSeguranca. Visitante ve catalogo; carrinho e de cliente.
 *
 * A validacao de estoque nao esta aqui: ela vive em ServicoDeEstoque, chamada
 * por ServicoDeCarrinho antes de gravar a linha. O controller so traduz HTTP.
 */
@RestController
@RequestMapping("/api/carrinho")
@Tag(name = "Carrinho", description = "Carrinho aberto do usuario autenticado")
public class CarrinhoController {

    private final ServicoDeCarrinho carrinho;
    private final ServicoDeUsuario usuarios;
    private final UsuarioMapper usuarioMapper;

    public CarrinhoController(ServicoDeCarrinho carrinho,
                              ServicoDeUsuario usuarios,
                              UsuarioMapper usuarioMapper) {
        this.carrinho = carrinho;
        this.usuarios = usuarios;
        this.usuarioMapper = usuarioMapper;
    }

    /**
     * Cria o carrinho ja com o primeiro item.
     *
     * 201 na criacao. Chamar de novo com um carrinho ABERTO ja existente nao
     * cria um segundo — acrescenta no que existe e devolve 201 do mesmo jeito,
     * porque para quem chamou o resultado e o mesmo: o produto entrou.
     */
    @Operation(summary = "Cria o carrinho com o primeiro item",
            description = """
                    O dono sai do token; o corpo traz produto e quantidade.

                    O estoque e conferido antes de gravar: sem saldo, 409 com a quantidade
                    disponivel em `errosPorCampo.quantidade`.
                    """,
            responses = {
                @ApiResponse(responseCode = "201", description = "Carrinho com o item dentro"),
                @ApiResponse(responseCode = "400", description = "Produto ausente ou quantidade fora do intervalo",
                        content = @Content(schema = @Schema(implementation = ErroDto.class))),
                @ApiResponse(responseCode = "401", description = "Sem token ou token invalido",
                        content = @Content(schema = @Schema(implementation = ErroDto.class))),
                @ApiResponse(responseCode = "404", description = "Produto inexistente",
                        content = @Content(schema = @Schema(implementation = ErroDto.class))),
                @ApiResponse(responseCode = "409", description = "Estoque insuficiente",
                        content = @Content(schema = @Schema(implementation = ErroDto.class)))
            })
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CarrinhoDto criar(@AuthenticationPrincipal Jwt token,
                             @Valid @RequestBody RequisicaoDeItemDoCarrinho requisicao) {
        return carrinho.criar(donoDaRequisicao(token), requisicao.produtoId(),
                requisicao.quantidade());
    }

    /**
     * Acrescenta um produto ao carrinho aberto.
     *
     * Produto que ja esta no carrinho SOMA na linha existente. O estoque e
     * conferido contra o total da linha depois da soma, e nao contra a
     * quantidade recem-pedida.
     */
    @Operation(summary = "Adiciona um item ao carrinho",
            responses = {
                @ApiResponse(responseCode = "200", description = "Carrinho atualizado"),
                @ApiResponse(responseCode = "401", description = "Sem token ou token invalido",
                        content = @Content(schema = @Schema(implementation = ErroDto.class))),
                @ApiResponse(responseCode = "404", description = "Sem carrinho aberto, ou produto inexistente",
                        content = @Content(schema = @Schema(implementation = ErroDto.class))),
                @ApiResponse(responseCode = "409", description = "Estoque insuficiente",
                        content = @Content(schema = @Schema(implementation = ErroDto.class)))
            })
    @PostMapping("/itens")
    public CarrinhoDto adicionar(@AuthenticationPrincipal Jwt token,
                                 @Valid @RequestBody RequisicaoDeItemDoCarrinho requisicao) {
        return carrinho.adicionar(donoDaRequisicao(token), requisicao.produtoId(),
                requisicao.quantidade());
    }

    /**
     * Tira uma quantidade da linha. Chegar a zero remove a linha inteira.
     *
     * Pedir mais do que tem significa "tira tudo", e nao erro: o resultado seria
     * o mesmo, e recusar obrigaria o front a saber a quantidade exata antes de
     * pedir — um dado que ele so tem se acabou de ler o carrinho.
     */
    @Operation(summary = "Remove quantidade de um item do carrinho",
            responses = {
                @ApiResponse(responseCode = "200", description = "Carrinho atualizado"),
                @ApiResponse(responseCode = "401", description = "Sem token ou token invalido",
                        content = @Content(schema = @Schema(implementation = ErroDto.class))),
                @ApiResponse(responseCode = "404", description = "Sem carrinho aberto, ou produto fora dele",
                        content = @Content(schema = @Schema(implementation = ErroDto.class)))
            })
    @DeleteMapping("/itens/{produtoId}")
    public CarrinhoDto remover(
            @AuthenticationPrincipal Jwt token,
            @Parameter(description = "Id publico do produto") @PathVariable UUID produtoId,
            @Parameter(description = "Quanto tirar da linha. Acima do que ha na linha, tira tudo")
            @RequestParam @Min(value = 1, message = "A quantidade precisa ser pelo menos 1.")
            int quantidade) {

        return carrinho.remover(donoDaRequisicao(token), produtoId, quantidade);
    }

    /**
     * O carrinho aberto: as linhas com o retrato do produto e o total somado.
     *
     * O total vem de `Carrinho.totalEmCentavos()` — preco congelado da linha
     * vezes quantidade, somado. Nao ha coluna de total: total gravado e total
     * que pode discordar das linhas que o formam.
     */
    @Operation(summary = "Mostra o carrinho",
            description = """
                    Devolve o id do carrinho, as linhas — produto, quantidade, unidade,
                    preco congelado na adicao e total da linha — e o total do carrinho.

                    404 quando a pessoa ainda nao tem carrinho aberto: nao existe carrinho
                    vazio, ele nasce quando algo entra.
                    """,
            responses = {
                @ApiResponse(responseCode = "200", description = "O carrinho aberto"),
                @ApiResponse(responseCode = "401", description = "Sem token ou token invalido",
                        content = @Content(schema = @Schema(implementation = ErroDto.class))),
                @ApiResponse(responseCode = "404", description = "Sem carrinho aberto",
                        content = @Content(schema = @Schema(implementation = ErroDto.class)))
            })
    @GetMapping
    public CarrinhoDto ver(@AuthenticationPrincipal Jwt token) {
        return carrinho.ver(donoDaRequisicao(token));
    }

    /**
     * O `sub` de quem apresentou o token, com o espelho local garantido.
     *
     * A sincronizacao acontece aqui porque e aqui que o token existe: o servico
     * de carrinho trabalha com UUID e nao deve saber o que e um JWT. Sem este
     * passo, a primeira compra de qualquer pessoa recem-cadastrada falharia —
     * `usuario_id` e NOT NULL, e nao havia nada gravando essa linha.
     *
     * O UsuarioMapper e reaproveitado de proposito: ele ja e o unico lugar que
     * conhece o formato das claims do Keycloak, e duplicar essa leitura aqui
     * daria dois lugares para ela mudar.
     */
    private UUID donoDaRequisicao(Jwt token) {
        UsuarioDto eu = usuarioMapper.paraDto(token);
        UUID sub = UUID.fromString(eu.id());

        usuarios.sincronizar(sub, eu.nome(), eu.email(), eu.login());

        return sub;
    }
}
