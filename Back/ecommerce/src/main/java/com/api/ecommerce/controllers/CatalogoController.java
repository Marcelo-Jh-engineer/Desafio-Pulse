package com.api.ecommerce.controllers;

import com.api.ecommerce.business.service.ServicoDeCatalogo;
import com.api.ecommerce.dtos.out.CategoriaDtoOut;
import com.api.ecommerce.dtos.out.ErroDtoOut;
import com.api.ecommerce.dtos.out.PaginaDtoOut;
import com.api.ecommerce.dtos.out.ProdutoDtoOut;
import com.api.ecommerce.infrastructure.entities.ImagemDeProduto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Catalogo publico — a vitrine.
 *
 * Sem autenticacao por requisito: visitante ve o catalogo (matriz RBAC do
 * CLAUDE.md). Tudo aqui e leitura.
 */
@RestController
@RequestMapping("/api")
@Tag(name = "Catalogo", description = "Vitrine publica: produtos, categorias e imagens")
public class CatalogoController {

    private final ServicoDeCatalogo servico;

    public CatalogoController(ServicoDeCatalogo servico) {
        this.servico = servico;
    }

    /**
     * O catalogo, paginado.
     *
     * Os filtros vivem na query string, e nao em corpo de requisicao, porque e
     * o que torna a tela compartilhavel: colar `/?categoria=bebidas&pagina=1`
     * leva a outra pessoa exatamente ao que voce esta vendo.
     */
    @Operation(summary = "Lista o catalogo paginado",
            description = """
                    Produto inativo nao aparece. Produto sem estoque APARECE, marcado como
                    indisponivel: some o botao de compra, nao o produto.

                    `tamanho` e livre, limitado a 60 por pagina — sem teto, um unico pedido
                    traria o catalogo inteiro.

                    A ordem e fixa e nao se escolhe: disponiveis primeiro, depois pela ordem
                    da categoria, depois pelo nome.
                    """)
    @GetMapping("/produtos")
    public PaginaDtoOut<ProdutoDtoOut> listar(
            @Parameter(description = "Id da categoria. Ausente lista todas",
                    example = "6d362df7-8f32-4da9-aae1-6928fb0eb817")
            @RequestParam(required = false) UUID categoria,

            @Parameter(description = "Indice da pagina, base 0", example = "0")
            @RequestParam(required = false) Integer pagina,

            @Parameter(description = "Itens por pagina. Padrao 10, maximo 60", example = "10")
            @RequestParam(required = false) Integer tamanho) {

        return servico.listar(categoria, null, pagina, tamanho);
    }

    /**
     * Um produto — RF-CAT-07.
     *
     * Enderecado pelo id publico, o mesmo que a listagem devolve. Produto
     * inativo responde 404, como id inexistente.
     */
    @Operation(summary = "Devolve um produto",
            responses = {
                @ApiResponse(responseCode = "200", description = "O produto"),
                @ApiResponse(responseCode = "404", description = "Inexistente ou inativo",
                        content = @Content(schema = @Schema(implementation = ErroDtoOut.class)))
            })
    @GetMapping("/produtos/{id}")
    public ProdutoDtoOut porId(
            @Parameter(description = "Id publico do produto") @PathVariable UUID id) {
        return servico.porId(id);
    }

    /** Lista curta e estavel: array puro, sem envelope de paginacao. */
    @Operation(summary = "Lista as categorias ativas",
            description = "So as ativas, na ordem definida pelo admin. O front nunca codifica esta lista.")
    @GetMapping("/categorias")
    public List<CategoriaDtoOut> categorias() {
        return servico.categoriasAtivas();
    }

    /**
     * A imagem do produto, servida do banco.
     *
     * Existe porque `urlImagem` aponta para ca: desde que as fotos passaram a
     * morar em tb_produto_imagens, sem esta rota todo produto do catalogo
     * viria com um endereco que nao responde.
     *
     * Sem ETag: o Cache-Control de uma hora ja evita que a mesma foto seja
     * buscada de novo a cada tela, e resolve isso sem nenhuma ida ao servidor.
     */
    @Operation(summary = "Devolve a imagem do produto",
            responses = {
                @ApiResponse(responseCode = "200", description = "Bytes da imagem",
                        content = @Content(mediaType = "image/*")),
                @ApiResponse(responseCode = "404", description = "Produto sem imagem gravada",
                        content = @Content(schema = @Schema(implementation = ErroDtoOut.class)))
            })
    @GetMapping("/produtos/{id}/imagem")
    public ResponseEntity<byte[]> imagem(
            @Parameter(description = "Id publico do produto") @PathVariable UUID id) {

        ImagemDeProduto imagem = servico.imagemDe(id);

        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePublic())
                .contentType(MediaType.parseMediaType(imagem.getTipoConteudo()))
                // SVG e XML e aceita script dentro. O sandbox tira da imagem os
                // poderes de uma pagina da loja, e o nosniff impede que o
                // navegador decida sozinho que aquilo e outra coisa. Vale mesmo
                // para o que nos gravamos: barreira que so protege contra o
                // ataque que a gente lembrou nao e barreira.
                .header("Content-Security-Policy", "sandbox")
                .header("X-Content-Type-Options", "nosniff")
                .body(imagem.getConteudo());
    }
}
