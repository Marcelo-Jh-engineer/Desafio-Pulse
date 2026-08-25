package com.api.ecommerce.business.service;

import com.api.ecommerce.infrastructure.entities.Usuario;
import com.api.ecommerce.infrastructure.repositories.RepositorioDeUsuario;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Mantem o espelho local do usuario do Keycloak.
 *
 * Quem e dono da identidade e o Keycloak — senha, papeis e credencial vivem la,
 * e nada disso e copiado. O espelho existe por um motivo so: carrinho e pedido
 * precisam de uma chave estrangeira estavel, e `usuario_id` e NOT NULL.
 *
 * A sincronizacao acontece na primeira vez que a pessoa faz algo que precisa de
 * dono. Nao ha gatilho no login, e e proposital: o login e um proxy para o
 * Keycloak, e gravar aqui a cada entrada acoplaria autenticacao a uma tabela
 * que a autenticacao nao usa.
 *
 * O nome, o e-mail e o login sao reescritos a cada chamada. Sao dados do
 * provedor, nao daqui: se a pessoa mudar o e-mail no Keycloak, o espelho tem de
 * acompanhar em vez de guardar para sempre o valor do dia em que ela apareceu.
 */
@Service
public class ServicoDeUsuario {

    private final RepositorioDeUsuario usuarios;

    public ServicoDeUsuario(RepositorioDeUsuario usuarios) {
        this.usuarios = usuarios;
    }

    /**
     * Devolve o usuario local daquele `sub`, criando-o se for a primeira vez.
     *
     * O `sub` e a chave, e nao o e-mail: e o unico identificador que o Keycloak
     * garante nunca reaproveitar. E-mail e login mudam.
     */
    @Transactional
    public Usuario sincronizar(UUID sub, String nome, String email, String login) {
        return usuarios.findByKeycloakSub(sub)
                .map(usuario -> {
                    usuario.sincronizar(nome, email, login);
                    return usuario;
                })
                .orElseGet(() -> usuarios.save(new Usuario(sub, nome, email, login)));
    }
}
