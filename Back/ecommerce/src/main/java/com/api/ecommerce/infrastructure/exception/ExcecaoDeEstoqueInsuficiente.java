package com.api.ecommerce.infrastructure.exception;

/**
 * Pediram mais do que existe em estoque.
 *
 * Carrega a quantidade disponivel porque a tela precisa dela para dizer "restam
 * 3" em vez de "nao deu" — e porque, sem isso, o front teria de recarregar o
 * produto so para descobrir o numero que o servidor acabou de conferir.
 *
 * Nao e sigilo: o estoque ja aparece no catalogo publico.
 */
public class ExcecaoDeEstoqueInsuficiente extends RuntimeException {

    private final int disponivel;

    public ExcecaoDeEstoqueInsuficiente(String mensagem, int disponivel) {
        super(mensagem);
        this.disponivel = disponivel;
    }

    public int getDisponivel() {
        return disponivel;
    }
}
