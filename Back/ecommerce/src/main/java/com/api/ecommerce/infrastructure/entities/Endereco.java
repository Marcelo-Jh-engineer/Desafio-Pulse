package com.api.ecommerce.infrastructure.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Getter;

/**
 * Endereco de entrega — docs/models.md secao 8.
 *
 * Embutido no pedido, e nao apontado por chave estrangeira: o pedido congela o
 * endereco do momento da compra. Se a pessoa se mudar, o comprovante antigo
 * tem que continuar dizendo para onde aquela compra foi.
 *
 * O CEP viaja e fica guardado so com digitos, como o documento.
 */
@Embeddable
@Getter
public class Endereco {

    @Column(nullable = false, length = 8)
    private String cep;

    @Column(nullable = false, length = 160)
    private String logradouro;

    /** Texto, nao inteiro: "s/n" e um numero de porta valido. */
    @Column(nullable = false, length = 20)
    private String numero;

    @Column(length = 80)
    private String complemento;

    @Column(nullable = false, length = 120)
    private String bairro;

    @Column(nullable = false, length = 120)
    private String cidade;

    @Column(nullable = false, length = 2)
    private String uf;

    protected Endereco() {
        // Exigido pelo JPA.
    }

    public Endereco(String cep, String logradouro, String numero, String complemento,
                    String bairro, String cidade, String uf) {
        this.cep = cep;
        this.logradouro = logradouro;
        this.numero = numero;
        this.complemento = complemento;
        this.bairro = bairro;
        this.cidade = cidade;
        this.uf = uf;
    }
}
