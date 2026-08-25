package com.api.ecommerce.controllers;

import com.api.ecommerce.business.service.ServicoDeCatalogo;
import com.api.ecommerce.dtos.PaginaDto;
import com.api.ecommerce.dtos.ProdutoDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Busca de produtos por nome, com filtro por categoria.
 *
 * Rota propria, e nao um parametro a mais na listagem, porque a busca e uma
 * intencao diferente: quem lista quer ver o que existe, quem busca ja sabe o
 * que quer. Separadas, cada uma pode evoluir sem mexer na outra — a busca
 * ganhar correcao de digitacao ou destaque do termo nao mexe na vitrine.
 *
 * A CONSULTA, no entanto, e a mesma: as duas chamam ServicoDeCatalogo.listar.
 * Duas rotas com duas implementacoes seriam duas regras de o que aparece no
 * catalogo, e a segunda divergiria da primeira no dia em que uma mudasse.
 *
 * Fica sob /api/catalogo, e nao em /api/produtos/busca, para nao disputar
 * caminho com a rota de um produto — hoje o produto e enderecado por UUID e o
 * conflito nao existiria, mas o desenho nao depende disso continuar verdade.
 */
@RestController
@RequestMapping("/api/catalogo")
@Tag(name = "Busca", description = "Procura produtos por nome e filtra por categoria")
public class BuscaDeProdutosController {

    private final ServicoDeCatalogo servico;

    public BuscaDeProdutosController(ServicoDeCatalogo servico) {
        this.servico = servico;
    }

    /**
     * Procura por pedaco do nome, com filtro opcional de categoria.
     *
     * Os dois parametros sao opcionais e combinam: so nome procura no catalogo
     * inteiro, so categoria devolve a categoria inteira, os dois juntos
     * procuram dentro dela. Nenhum dos dois devolve o catalogo, o que faz esta
     * rota se comportar como a listagem quando chamada sem argumento — em vez
     * de responder erro por uma pergunta que tem resposta.
     */
    @Operation(summary = "Busca produtos por nome e categoria",
            description = """
                    `nome` casa qualquer pedaco do nome do produto, sem diferenciar
                    maiusculas. O indice trigram de tb_produtos atende essa busca; um
                    B-tree comum nao atenderia, porque o termo pode estar no meio.

                    Produto inativo nunca aparece. Sem estoque aparece, indisponivel.

                    A ordem e a mesma da listagem, e tambem nao se escolhe.
                    """)
    @GetMapping("/busca")
    public PaginaDto<ProdutoDto> buscar(
            @Parameter(description = "Pedaco do nome do produto", example = "banana")
            @RequestParam(required = false) String nome,

            @Parameter(description = "Id da categoria",
                    example = "c1a2b3c4-0001-4000-8000-000000000001")
            @RequestParam(required = false) UUID categoria,

            @Parameter(description = "Indice da pagina, base 0", example = "0")
            @RequestParam(required = false) Integer pagina,

            @Parameter(description = "Itens por pagina. Padrao 10, maximo 60", example = "10")
            @RequestParam(required = false) Integer tamanho) {

        return servico.listar(categoria, nome, pagina, tamanho);
    }
}
