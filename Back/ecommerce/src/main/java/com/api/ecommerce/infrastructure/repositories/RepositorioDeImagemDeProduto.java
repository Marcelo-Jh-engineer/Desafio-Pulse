package com.api.ecommerce.infrastructure.repositories;

import com.api.ecommerce.infrastructure.entities.ImagemDeProduto;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Fotos de produto guardadas no banco.
 *
 * Nao existe caminho a partir do Produto para chegar aqui, e isso e
 * deliberado: um @OneToOne inverso no Produto seria carregado junto com ele
 * mesmo declarado LAZY — a JPA precisa saber se o outro lado existe para
 * decidir entre o objeto e o nulo, e para isso vai ao banco. Uma pagina de
 * catalogo viraria uma consulta de imagem por produto. Quem quiser a foto pede
 * por aqui, explicitamente.
 */
public interface RepositorioDeImagemDeProduto extends JpaRepository<ImagemDeProduto, Long> {

    /** Os bytes, para servir a imagem. E a unica consulta que os traz. */
    Optional<ImagemDeProduto> findByProdutoIdPublico(UUID idPublicoDoProduto);

    /**
     * Quais destes produtos tem foto no banco.
     *
     * Uma consulta para a pagina inteira, e nao uma por produto: a montagem do
     * DTO precisa saber, para cada item da listagem, se o `urlImagem` aponta
     * para o arquivo externo ou para o endereco que serve os bytes.
     */
    @Query("""
            SELECT i.produto.idPublico FROM ImagemDeProduto i
             WHERE i.produto.idPublico IN :idsPublicos
            """)
    Set<UUID> quaisTemImagem(@Param("idsPublicos") Set<UUID> idsPublicos);

    boolean existsByProdutoIdPublico(UUID idPublicoDoProduto);

    void deleteByProdutoIdPublico(UUID idPublicoDoProduto);
}
