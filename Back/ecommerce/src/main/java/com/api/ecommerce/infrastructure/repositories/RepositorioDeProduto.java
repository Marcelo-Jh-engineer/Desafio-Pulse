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

    /**
     * Uma linha da listagem: o produto e a resposta de "tem foto no banco?",
     * nas duas colunas que a mesma consulta ja trouxe.
     *
     * Aninhado aqui porque so buscarNoCatalogo o produz e so ele o consome —
     * e o formato de saida daquela consulta, nao um tipo do dominio.
     *
     * Da imagem vem o `idPublico`, e NADA MAIS: trazer a entidade arrastaria o
     * `conteudo` junto, um bytea por linha. Nulo significa "sem foto no banco",
     * que e tudo o que a montagem da URL precisa saber.
     */
    record ProdutoDoCatalogo(Produto produto, UUID idPublicoDaImagem) {

        public boolean temImagemNoBanco() {
            return idPublicoDaImagem != null;
        }
    }

    @EntityGraph(attributePaths = "categoria")
    Optional<Produto> findByIdPublico(UUID idPublico);

    //lista produtos ativos pela categoria e padrão de nomee ordena pelo pelo nome primeiro os disponiveis
    //
    // Uma consulta so traz o produto, a categoria e a resposta de "tem foto no
    // banco?". O LEFT JOIN e de entidade, com ON: nao ha associacao do Produto
    // para a imagem, e continua nao havendo — um @OneToOne inverso seria
    // carregado mesmo declarado LAZY, uma consulta por produto da pagina.
    //
    // Da imagem sai `i.idPublico` e nada mais. `i` inteiro traria o `conteudo`,
    // um bytea por linha: doze fotos completas para desenhar doze miniaturas.
    //
    // A linha nao duplica porque uk_produto_imagens_produto (V7) garante uma
    // imagem por produto — sem isso o LEFT JOIN quebraria a paginacao.
    //
    // countQuery a mao: o derivado pelo Spring Data copiaria o JOIN FETCH, e
    // Hibernate recusa fetch numa consulta que nao devolve o dono.
    @Query(value = """
            SELECT new com.api.ecommerce.infrastructure.repositories.RepositorioDeProduto$ProdutoDoCatalogo(p, i.idPublico)
              FROM Produto p
              JOIN FETCH p.categoria
              LEFT JOIN ImagemDeProduto i ON i.produto = p
             WHERE p.ativo = TRUE
               AND (:idCategoria IS NULL OR p.categoria.idPublico = :idCategoria)
               AND (:padraoDeNome IS NULL OR LOWER(p.nome) LIKE :padraoDeNome)
             ORDER BY CASE WHEN p.quantidadeEstoque > 0 THEN 0 ELSE 1 END,
                      p.categoria.ordem,
                      p.nome
            """,
            countQuery = """
            SELECT COUNT(p) FROM Produto p
             WHERE p.ativo = TRUE
               AND (:idCategoria IS NULL OR p.categoria.idPublico = :idCategoria)
               AND (:padraoDeNome IS NULL OR LOWER(p.nome) LIKE :padraoDeNome)
            """)
    Page<ProdutoDoCatalogo> buscarNoCatalogo(@Param("idCategoria") UUID idCategoria,
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
