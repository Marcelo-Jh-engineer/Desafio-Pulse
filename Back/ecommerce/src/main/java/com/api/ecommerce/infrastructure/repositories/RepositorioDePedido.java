package com.api.ecommerce.infrastructure.repositories;

import com.api.ecommerce.infrastructure.entities.Pedido;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Pedidos.
 *
 * Toda leitura de pedido e sempre por dono: a consulta recebe o `sub` de quem
 * pediu e nunca so o id do pedido. Buscar pelo id e conferir o dono depois
 * funciona, mas basta um caminho esquecer a conferencia para o pedido de um
 * cliente aparecer para outro.
 */
public interface RepositorioDePedido extends JpaRepository<Pedido, Long> {

    @EntityGraph(attributePaths = {"itens", "itens.produto", "usuario"})
    Optional<Pedido> findByIdPublicoAndUsuarioKeycloakSub(UUID idPublico, UUID keycloakSub);

    /**
     * Busca SEM dono — a unica do repositorio, e ela existe para o consumidor
     * da fila, que age sobre a mensagem e nao sobre um usuario logado
     * (RNF-PAG-02). Nenhuma rota HTTP chama este metodo: quem vem pela API
     * passa sempre pelo par acima.
     */
    @EntityGraph(attributePaths = {"itens", "itens.produto"})
    Optional<Pedido> findByIdPublico(UUID idPublico);

    /** Reenvio do checkout: devolve o pedido que ja existe em vez de duplicar. */
    @EntityGraph(attributePaths = {"itens", "itens.produto", "usuario"})
    Optional<Pedido> findByUsuarioKeycloakSubAndChaveIdempotencia(UUID keycloakSub, String chave);

    /**
     * Historico do cliente, do mais recente para o mais antigo.
     *
     * O @EntityGraph traz as linhas e o produto de cada uma na mesma consulta —
     * o id publico do produto vai na resposta, e sem isso seria uma consulta
     * por item. O preco de PAGINAR com colecao carregada junto e que o Hibernate
     * aplica o recorte em memoria: aceitavel no volume desta prova, e o motivo
     * de o tamanho de pagina ter teto em ServicoDePedido.
     */
    @EntityGraph(attributePaths = {"itens", "itens.produto"})
    Page<Pedido> findByUsuarioKeycloakSubOrderByCriadoEmDesc(UUID keycloakSub, Pageable paginacao);
}
