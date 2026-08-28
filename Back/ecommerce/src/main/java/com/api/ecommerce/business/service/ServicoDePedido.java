package com.api.ecommerce.business.service;

import com.api.ecommerce.dtos.out.PaginaDtoOut;
import com.api.ecommerce.dtos.out.PedidoDtoOut;
import com.api.ecommerce.infrastructure.entities.Carrinho;
import com.api.ecommerce.infrastructure.entities.ItemCarrinho;
import com.api.ecommerce.infrastructure.entities.Pedido;
import com.api.ecommerce.infrastructure.entities.Produto;
import com.api.ecommerce.infrastructure.entities.Usuario;
import com.api.ecommerce.infrastructure.exception.ExcecaoDeConflito;
import com.api.ecommerce.infrastructure.exception.ExcecaoDeNaoEncontrado;
import com.api.ecommerce.infrastructure.repositories.RepositorioDeCarrinho;
import com.api.ecommerce.infrastructure.repositories.RepositorioDePedido;
import com.api.ecommerce.infrastructure.repositories.RepositorioDeUsuario;
import com.api.ecommerce.utils.UsuarioUtils;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 *
 * O carrinho aberto vira um pedido IMUTAVEL, e nada mais acontece: o pedido
 * nasce PENDENTE e o estoque continua intocado
 *
 * **Todo metodo comeca pelo dono**, como no carrinho: nenhum recebe id de
 * pedido sem receber tambem o `sub` de quem esta pedindo, e a busca e sempre
 * pelos dois juntos . Pedido de outro dono responde 404, e nao 403:
 * 403 confirmaria que aquele pedido existe .
 */
@Service
public class ServicoDePedido {

    /** Itens por pagina quando o cliente nao pede outro. */
    public static final int TAMANHO_PADRAO = 10;

    /**
     * Teto por pagina.
     *
     * A consulta do historico traz as linhas de cada pedido junto, e com
     * colecao carregada o Hibernate recorta a pagina em memoria. Sem teto,
     * `tamanho=100000` traria o historico inteiro para dentro da JVM.
     */
    public static final int TAMANHO_MAXIMO = 50;

    /** Limite da coluna `chave_idempotencia`. */
    private static final int TAMANHO_MAXIMO_DA_CHAVE = 80;

    private final RepositorioDePedido pedidos;
    private final RepositorioDeCarrinho carrinhos;
    private final RepositorioDeUsuario usuarios;
    private final ServicoDeEstoque estoque;

    public ServicoDePedido(RepositorioDePedido pedidos,
                           RepositorioDeCarrinho carrinhos,
                           RepositorioDeUsuario usuarios,
                           ServicoDeEstoque estoque) {
        this.pedidos = pedidos;
        this.carrinhos = carrinhos;
        this.usuarios = usuarios;
        this.estoque = estoque;
    }

       @Transactional
    public PedidoDtoOut criar(UUID sub, String chaveRecebida) {
        Usuario dono = UsuarioUtils.getUser(usuarios, sub);
        //SE NAO RECEBER CRIA UMA CHAVE
        String chave = chaveDeIdempotencia(chaveRecebida);

        // Replay: mesmo par (usuario, chave) devolve o mesmo pedido
        Optional<Pedido> jaCriado =
                pedidos.findByUsuarioKeycloakSubAndChaveIdempotencia(sub, chave);
        if (jaCriado.isPresent()) {
            return PedidoDtoOut.fromEntityToDto(jaCriado.get());
        }

        Carrinho carrinho = carrinhos.abertoDe(sub)
                .orElseThrow(() -> new ExcecaoDeConflito("Você ainda não tem um carrinho."));

        if (carrinho.getItens().isEmpty()) {
            throw new ExcecaoDeConflito("Seu carrinho está vazio.");
        }
        verificacaoEstoqueItensCarrinho(carrinho);

        Pedido pedido = new Pedido(dono, carrinho, chave);
        // A copia e linha-a-linha, do CARRINHO: o cliente paga o preco que viu
        carrinho.getItens().forEach(pedido::adicionar);

        //conveter o status para CONVERTIDO, para que o carrinho nao seja mais aberto e possa ser usado novamente
        carrinho.converter();

        pedidos.saveAndFlush(pedido);
        carrinhos.save(carrinho);

        return PedidoDtoOut.fromEntityToDto(pedido);
    }

    @Transactional(readOnly = true)
    public PedidoDtoOut buscar(UUID sub, UUID idPublico) {
        UsuarioUtils.getUser(usuarios, sub);
        return pedidos.findByIdPublicoAndUsuarioKeycloakSub(idPublico, sub)
                .map(PedidoDtoOut::fromEntityToDto)
                // Pedido de outro dono responde igual a id inventado: dizer
                .orElseThrow(() -> new ExcecaoDeNaoEncontrado("Pedido não encontrado."));
    }

    @Transactional(readOnly = true)
    public PaginaDtoOut<PedidoDtoOut> listar(UUID sub, Integer pagina, Integer tamanho) {
        UsuarioUtils.getUser(usuarios, sub);
        return PaginaDtoOut.de(
                pedidos.findByUsuarioKeycloakSubOrderByCriadoEmDesc(sub, paginacaoDe(pagina, tamanho)),
                PedidoDtoOut::fromEntityToDto);
    }

    /**
     * Revalida o carrinho inteiro contra o estoque de agora.
     * Verifica o estoque de novo ao criar o pedido
     */
    private void verificacaoEstoqueItensCarrinho(Carrinho carrinho) {
        Map<String, String> indisponiveis = new LinkedHashMap<>();

        for (ItemCarrinho linha : carrinho.getItens()) {
            Produto produto = linha.getProduto();
            if (!estoque.temDisponibilidade(produto, linha.getQuantidade())) {
                indisponiveis.put(produto.getIdPublico().toString(), faltaDe(linha, produto));
            }
        }
        if (!indisponiveis.isEmpty()) {
            throw new ExcecaoDeConflito(
                    "Alguns itens do seu carrinho não estão mais disponíveis.", indisponiveis);
        }
    }

    /**
     * Produto inativo nao esta "sem estoque": ele saiu de linha. Mesma recusa,
     * texto diferente — quem le precisa saber que nao adianta voltar amanha.
     */
    private String faltaDe(ItemCarrinho linha, Produto produto) {
        if (!produto.isAtivo()) {
            return linha.getNome() + " não está mais disponível.";
        }
        return linha.getNome() + ": você pediu " + linha.getQuantidade()
                + " e restam " + produto.getQuantidadeEstoque() + ".";
    }

    /**
     * A chave que identifica esta tentativa de checkout.
     *
     * Sem header, o servidor gera uma (D8): a coluna e NOT NULL, e gerar evita
     * a violacao sem custo. Uma chave gerada nao protege contra clique duplo —
     * cada envio traria a sua — mas isso e escolha de quem chama, e o front
     * manda a dele.
     */
    private String chaveDeIdempotencia(String chaveRecebida) {
        if (chaveRecebida == null || chaveRecebida.isBlank()) {
            return UUID.randomUUID().toString();
        }
        String chave = chaveRecebida.strip();
        if (chave.length() > TAMANHO_MAXIMO_DA_CHAVE) {
            throw new IllegalArgumentException(
                    "A chave de idempotência aceita no máximo "
                            + TAMANHO_MAXIMO_DA_CHAVE + " caracteres.");
        }
        return chave;
    }

    /** Sem Sort: a ordem e fixa no metodo do repositorio, e nao se escolhe. */
    private Pageable paginacaoDe(Integer pagina, Integer tamanho) {
        int indice = pagina == null || pagina < 0 ? 0 : pagina;
        int porPagina = tamanho == null || tamanho < 1
                ? TAMANHO_PADRAO
                : Math.min(tamanho, TAMANHO_MAXIMO);
        return PageRequest.of(indice, porPagina);
    }
}
