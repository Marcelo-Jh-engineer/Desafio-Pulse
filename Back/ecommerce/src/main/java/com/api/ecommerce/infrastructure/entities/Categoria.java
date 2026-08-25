package com.api.ecommerce.infrastructure.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import lombok.Getter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * Categoria do catalogo — docs/models.md secao 3.
 *
 * Existe como entidade propria, e nao como texto no produto, porque o filtro
 * precisa de ordem e de estado ativo. Desativar uma categoria a tira do filtro
 * publico sem desfazer o vinculo dos produtos que ja estao nela.
 *
 * O filtro do catalogo chega pelo `idPublico`: nao ha slug.
 */
@Entity
@Table(name = "tb_categorias")
@Getter
public class Categoria {

    /** Chave interna. Nunca sai da API — quem viaja e o idPublico. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private UUID idPublico = UUID.randomUUID();

    @Column(nullable = false, length = 60)
    private String nome;

    @Column(length = 255)
    private String descricao;

    @Column(length = 255)
    private String urlIcone;

    @Column(nullable = false)
    private short ordem;

    @Column(nullable = false)
    private boolean ativa = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant criadoEm;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant atualizadoEm;

    protected Categoria() {
        // Exigido pelo JPA.
    }

    public Categoria(String nome, String descricao, String urlIcone,
                     short ordem, boolean ativa) {
        this.nome = nome;
        this.descricao = descricao;
        this.urlIcone = urlIcone;
        this.ordem = ordem;
        this.ativa = ativa;
    }

    public void alterar(String nome, String descricao, String urlIcone,
                        short ordem, boolean ativa) {
        this.nome = nome;
        this.descricao = descricao;
        this.urlIcone = urlIcone;
        this.ordem = ordem;
        this.ativa = ativa;
    }

    /**
     * Igualdade pelo idPublico, nao pelo id: o id so existe depois do insert, e
     * comparar duas categorias novas por id daria "iguais" para ambas, porque
     * as duas seriam nulas.
     */
    @Override
    public boolean equals(Object outro) {
        return outro instanceof Categoria categoria && idPublico.equals(categoria.idPublico);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(idPublico);
    }
}
