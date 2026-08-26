package com.api.ecommerce.utils;

import com.api.ecommerce.infrastructure.entities.Usuario;
import com.api.ecommerce.infrastructure.exception.ExcecaoDeAutenticacao;
import com.api.ecommerce.infrastructure.repositories.RepositorioDeUsuario;
import java.util.UUID;

/**
 * O espelho local do usuario autenticado, a partir do `sub` do token.
 *
 * Estava repetido, identico, em cada servico que precisa de dono — carrinho e
 * pedido. Duplicado, o dia em que a mensagem ou a regra mudasse ela mudaria em
 * um lugar so, e os outros continuariam respondendo diferente para o mesmo
 * caso.
 *
 * Estatico e recebendo o repositorio porque a busca nao tem estado proprio:
 * injetar um componente so para isso trocaria a duplicacao por uma dependencia
 * a mais no construtor de cada servico e nos testes dele.
 */
public final class UsuarioUtils {

    private UsuarioUtils() {
    }

    /**
     * Token valido cujo `sub` nao tem usuario espelhado nao serve: sem dono nao
     * ha a quem carrinho ou pedido pertencer, e `usuario_id` e NOT NULL
     * justamente por isso.
     *
     * O `sub` nulo cai na mesma resposta do sub sem espelho — nos dois casos a
     * sessao nao identifica ninguem, e distinguir so daria ao cliente uma
     * pista sobre o que existe do lado de ca.
     */
    public static Usuario getUser(RepositorioDeUsuario usuarios, UUID sub) {
        if (sub == null) {
            throw new ExcecaoDeAutenticacao("Sessao ausente ou expirada");
        }
        return usuarios.findByKeycloakSub(sub)
                .orElseThrow(() -> new ExcecaoDeAutenticacao("Sessao ausente ou expirada"));
    }
}
