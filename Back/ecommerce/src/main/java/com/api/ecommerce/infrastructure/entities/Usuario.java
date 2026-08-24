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

/**
 * Espelho local do usuario — docs/models.md secao 5.
 *
 * A identidade e do Keycloak: senha, papel e verificacao de credencial vivem
 * la, e nada disso e copiado para ca. Esta tabela existe porque pedido e
 * carrinho precisam de uma chave estrangeira estavel, e o `sub` do token e o
 * unico identificador que o provedor garante nunca reaproveitar.
 *
 * Os papeis nao estao aqui de proposito: eles saem do token a cada
 * requisicao. Uma copia no banco seria uma segunda verdade, que envelhece.
 */
@Entity
@Table(name = "tb_usuarios")
@Getter
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** O que a API expoe como `id` do usuario. Vem da claim `sub`. */
    @Column(nullable = false, updatable = false)
    private UUID keycloakSub;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(nullable = false, length = 255)
    private String email;

    /**
     * CPF, CNPJ (so digitos) ou e-mail. Sem mascara em lugar nenhum: o que a
     * pessoa digita e o que fica guardado. Nunca vai para URL, log ou chave de
     * cache (LGPD, RNF-SEC-03).
     */
    @Column(nullable = false, length = 255)
    private String login;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant criadoEm;

    protected Usuario() {
        // Exigido pelo JPA.
    }

    public Usuario(UUID keycloakSub, String nome, String email, String login) {
        this.keycloakSub = keycloakSub;
        this.nome = nome;
        this.email = email;
        this.login = login;
    }

    /** O perfil muda no Keycloak; aqui so se atualiza o espelho. */
    public void sincronizar(String nome, String email, String login) {
        this.nome = nome;
        this.email = email;
        this.login = login;
    }

    @Override
    public boolean equals(Object outro) {
        return outro instanceof Usuario usuario && keycloakSub.equals(usuario.keycloakSub);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(keycloakSub);
    }
}
