package com.api.ecommerce.business.service;

import com.api.ecommerce.infrastructure.entities.Produto;
import com.api.ecommerce.infrastructure.repositories.RepositorioDeImagemDeProduto;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

/**
 * Decide o endereco da foto de um produto.
 *
 * A foto tem duas origens possiveis — os bytes em tb_produto_imagens ou um
 * caminho externo em `tb_produtos.url_imagem` — e este e o UNICO lugar que
 * escolhe entre elas. Catalogo e carrinho perguntam aqui; se cada um decidisse
 * por conta propria, a regra existiria em dois lugares e divergiria no dia em
 * que um deles mudasse.
 */
@Service
public class ServicoDeImagemDeProduto {

    private final RepositorioDeImagemDeProduto imagens;

    public ServicoDeImagemDeProduto(RepositorioDeImagemDeProduto imagens) {
        this.imagens = imagens;
    }

    /**
     * O endereco da foto de cada produto da lista, numa consulta so.
     *
     * Em lote de proposito: perguntar "tem imagem?" por produto seria uma ida
     * ao banco por linha da tela — dez produtos, dez consultas, para montar uma
     * grade.
     */
    public Map<UUID, String> urlsDe(Collection<Produto> produtos) {
        Set<UUID> ids = produtos.stream()
                .map(Produto::getIdPublico)
                .collect(Collectors.toSet());

        Set<UUID> comImagemNoBanco = ids.isEmpty() ? Set.of() : imagens.quaisTemImagem(ids);

        Map<UUID, String> urls = new HashMap<>();
        for (Produto produto : produtos) {
            String url = montar(produto, comImagemNoBanco.contains(produto.getIdPublico()));
            if (url != null) {
                urls.put(produto.getIdPublico(), url);
            }
        }
        return urls;
    }

    /** Para um produto so. Use urlsDe quando houver mais de um. */
    public String urlDe(Produto produto) {
        return montar(produto, imagens.existsByProdutoIdPublico(produto.getIdPublico()));
    }

    private String montar(Produto produto, boolean temImagemNoBanco) {
        if (temImagemNoBanco) {
            return "/api/produtos/" + produto.getIdPublico() + "/imagem";
        }
        return produto.getUrlImagem();
    }
}
