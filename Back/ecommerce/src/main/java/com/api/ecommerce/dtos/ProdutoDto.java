package com.api.ecommerce.dtos;

import com.api.ecommerce.infrastructure.entities.Produto;
import com.api.ecommerce.infrastructure.enums.Unidade;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Produto como o front espera — docs/models.md secao 4.
 *
 * A categoria vai ANINHADA, e resumida: a tela precisa do slug para montar o
 * link do filtro e do nome com acento para exibir, e resolver isso no cliente
 * exigiria uma segunda requisicao por produto.
 *
 * O produto e identificado pelo `id`, um UUID, e por nada mais: nao ha slug nem
 * sku. E o `id` que endereca o produto na loja e que monta a URL da imagem.
 *
 * `criadoEm` e `atualizadoEm` tambem nao saem daqui: nenhuma tela os desenha, e
 * numa pagina de dez produtos seriam vinte datas ISO carregadas para nada.
 *
 * `quantidadeEstoque` sai mesmo quando e zero, e o produto continua na
 * listagem. Estoque zerado nao esconde o produto — tira o botao de compra
 * (docs/models.md secao 4). Some da listagem so o que estiver inativo.
 */
@Schema(name = "Produto")
public record ProdutoDto(
        @Schema(description = "Identifica o produto na loja e na URL",
                example = "187f774c-4d3a-48ab-921e-e7fa7fdda55b") String id,
        @Schema(example = "Cerveja Pilsen Lata 350ml") String nome,
        String descricao,
        @Schema(description = "Inteiro em centavos. Preco unitario, por `unidade`", example = "399")
        long precoEmCentavos,
        @Schema(description = "Rotulo de venda, nao fator de conversao") Unidade unidade,
        String urlImagem,
        CategoriaResumidaDto categoria,
        @Schema(description = "Estoque disponivel. Zero deixa o produto indisponivel, nao invisivel",
                example = "240")
        int quantidadeEstoque,
        boolean ativo) {

    public static ProdutoDto de(Produto produto, String urlImagem) {
        return new ProdutoDto(
                produto.getIdPublico().toString(),
                produto.getNome(),
                produto.getDescricao(),
                produto.getPrecoEmCentavos(),
                produto.getUnidade(),
                urlImagem,
                CategoriaResumidaDto.de(produto.getCategoria()),
                produto.getQuantidadeEstoque(),
                produto.isAtivo());
    }
}
