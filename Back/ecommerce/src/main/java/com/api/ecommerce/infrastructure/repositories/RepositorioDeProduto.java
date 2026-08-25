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

    /**
     * Listagem publica do catalogo, com os dois unicos filtros que existem:
     * categoria (pelo id publico dela) e nome.
     *
     * Produto inativo nao aparece; produto sem estoque aparece sim, marcado
     * como indisponivel — some o botao de compra, nao o produto
     * (docs/models.md secao 4).
     *
     * Os dois filtros sao opcionais: nulo significa "nao filtre por isso", e e
     * o que permite uma consulta so atender catalogo inteiro, filtro por
     * categoria, busca por nome, e as duas coisas juntas.
     *
     * `padraoDeNome` chega PRONTO — minusculo e ja com os `%` nas pontas,
     * montado em ServicoDeCatalogo. Nao ha normalizacao de acento: quem procura
     * digita a palavra como ela e escrita.
     *
     * Montar o padrao aqui dentro, com CONCAT, nao funciona — o parametro fica
     * sem tipo quando vem nulo, e o Postgres responde `function lower(bytea)
     * does not exist`. Comparado direto num LIKE contra coluna de texto, o
     * tipo se resolve sozinho.
     *
     * Sem clausula ESCAPE de proposito: a barra invertida ja e o escape padrao
     * do LIKE no PostgreSQL. Declarada dentro de um text block do Java, ela e
     * consumida antes de chegar ao Hibernate, que entao recusa a consulta por
     * literal de escape vazio.
     *
     * A ORDEM E FIXA e vive aqui dentro, nao no Pageable: disponiveis
     * primeiro, depois pela ordem da categoria, depois pelo nome. Nao ha
     * escolha de ordenacao na API. Por isso este metodo exige um Pageable SEM
     * Sort — o Spring Data anexaria a ordenacao dele DEPOIS deste ORDER BY, e
     * a que vem depois nao decide nada.
     */
    @EntityGraph(attributePaths = "categoria")
    @Query("""
            SELECT p FROM Produto p
             WHERE p.ativo = TRUE
               AND (:idCategoria IS NULL OR p.categoria.idPublico = :idCategoria)
               AND (:padraoDeNome IS NULL OR LOWER(p.nome) LIKE :padraoDeNome)
             ORDER BY CASE WHEN p.quantidadeEstoque > 0 THEN 0 ELSE 1 END,
                      p.categoria.ordem,
                      p.nome
            """)
    Page<Produto> buscarNoCatalogo(@Param("idCategoria") UUID idCategoria,
                                   @Param("padraoDeNome") String padraoDeNome,
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
