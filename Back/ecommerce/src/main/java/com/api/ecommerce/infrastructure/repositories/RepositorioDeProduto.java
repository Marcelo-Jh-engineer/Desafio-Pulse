package com.api.ecommerce.infrastructure.repositories;

import com.api.ecommerce.infrastructure.entities.Produto;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Catalogo.
 *
 * Todas as leituras publicas trazem a categoria junto pelo @EntityGraph: a
 * categoria vai aninhada em cada produto do JSON, e sem isso uma pagina de 12
 * produtos viraria 13 consultas.
 */
public interface RepositorioDeProduto extends JpaRepository<Produto, Long> {

    @EntityGraph(attributePaths = "categoria")
    Optional<Produto> findByIdPublico(UUID idPublico);

    /** A pagina de produto e enderecada por slug, nunca por id. */
    @EntityGraph(attributePaths = "categoria")
    Optional<Produto> findBySlug(String slug);

    boolean existsBySku(String sku);

    boolean existsBySlug(String slug);

    /**
     * Listagem publica. Produto inativo nao aparece; produto sem estoque
     * aparece sim, marcado como indisponivel — some o botao de compra, nao o
     * produto (docs/models.md secao 4).
     *
     * Os dois filtros sao opcionais: nulo significa "nao filtre por isso", e e
     * o que permite uma consulta so atender catalogo inteiro, filtro por
     * categoria, busca, e as duas coisas juntas.
     *
     * O ILIKE tem indice: o gin_trgm_ops de tb_produtos.nome atende busca por
     * pedaco de palavra, que um B-tree comum nao atenderia.
     */
    @EntityGraph(attributePaths = "categoria")
    @Query("""
            SELECT p FROM Produto p
             WHERE p.ativo = TRUE
               AND (:slugCategoria IS NULL OR p.categoria.slug = :slugCategoria)
               AND (:busca IS NULL OR LOWER(p.nome) LIKE LOWER(CONCAT('%', :busca, '%')))
            """)
    Page<Produto> buscarNoCatalogo(@Param("slugCategoria") String slugCategoria,
                                   @Param("busca") String busca,
                                   Pageable paginacao);

    /** Listagem do admin: enxerga tambem o que esta inativo. */
    @EntityGraph(attributePaths = "categoria")
    Page<Produto> findAllBy(Pageable paginacao);

    /**
     * Trava a linha para a baixa de estoque na aprovacao do pagamento.
     *
     * SELECT ... FOR UPDATE: a segunda transacao que pedir o mesmo produto
     * ESPERA a primeira terminar, e so entao le o estoque — ja atualizado.
     * Nenhuma das duas falha, e nenhuma le um numero que a outra esta prestes a
     * mudar.
     *
     * A espera e o comportamento desejado justamente aqui: a aprovacao acontece
     * dentro da transacao que cobra alguem, e segurar a linha por alguns
     * milissegundos e melhor do que devolver erro a quem acabou de pagar.
     *
     * Esta e a UNICA protecao contra a corrida de estoque no momento — nao ha
     * trava otimista no Produto — entao toda baixa precisa passar por aqui.
     * Ler o produto pelo findBy comum e alterar o estoque nao segura nada.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Produto p WHERE p.id = :id")
    Optional<Produto> travarParaBaixa(@Param("id") Long id);
}
