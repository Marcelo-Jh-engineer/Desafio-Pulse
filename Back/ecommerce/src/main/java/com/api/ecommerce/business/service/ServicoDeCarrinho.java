package com.api.ecommerce.business.service;

import com.api.ecommerce.dtos.out.CarrinhoDtoOut;
import com.api.ecommerce.infrastructure.entities.Carrinho;
import com.api.ecommerce.infrastructure.entities.ItemCarrinho;
import com.api.ecommerce.infrastructure.entities.Produto;
import com.api.ecommerce.infrastructure.entities.Usuario;
import com.api.ecommerce.infrastructure.exception.ExcecaoDeNaoEncontrado;
import com.api.ecommerce.infrastructure.repositories.RepositorioDeCarrinho;
import com.api.ecommerce.infrastructure.repositories.RepositorioDeProduto;
import com.api.ecommerce.infrastructure.repositories.RepositorioDeUsuario;
import com.api.ecommerce.utils.UsuarioUtils;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Carrinho do servidor.
 *
 * **Todo metodo daqui comeca pelo dono.** Nenhum recebe o id do carrinho sem
 * receber tambem o `sub` de quem esta pedindo, e a busca e sempre pelos dois
 * juntos. Buscar pelo id e conferir o dono depois funciona igual — ate o dia em
 * que um caminho novo esquecer a conferencia e o carrinho de um cliente
 * aparecer para outro.
 *
 * O `sub` vem da claim do JWT, que o resource server ja validou. Se nao houver
 * usuario espelhado para aquele `sub`, o pedido nao segue: carrinho e de gente
 * autenticada, e nao de um token solto.
 */
@Service
public class ServicoDeCarrinho {

    private final RepositorioDeCarrinho carrinhos;
    private final RepositorioDeProduto produtos;
    private final RepositorioDeUsuario usuarios;
    private final ServicoDeEstoque estoque;
    private final ServicoDeImagemDeProduto enderecoDaImagem;

    public ServicoDeCarrinho(RepositorioDeCarrinho carrinhos,
                             RepositorioDeProduto produtos,
                             RepositorioDeUsuario usuarios,
                             ServicoDeEstoque estoque,
                             ServicoDeImagemDeProduto enderecoDaImagem) {
        this.carrinhos = carrinhos;
        this.produtos = produtos;
        this.usuarios = usuarios;
        this.estoque = estoque;
        this.enderecoDaImagem = enderecoDaImagem;
    }

    /**
     * Cria o carrinho ja com o primeiro item.
     *
     * Nao existe carrinho vazio: ele nasce porque alguem colocou alguma coisa
     * dentro. Criar antes seria guardar uma linha que talvez nunca receba item,
     * e depois ter de decidir quando limpa-la.
     *
     * Chamar de novo com um carrinho ABERTO ja existente nao cria um segundo —
     * adiciona no que existe. O indice parcial `uk_carrinho_aberto_por_usuario`
     * recusaria o segundo de qualquer jeito; melhor tratar aqui, com o
     * comportamento que a pessoa espera, do que devolver erro de banco.
     */
    @Transactional
    public CarrinhoDtoOut criar(UUID sub, UUID idPublicoDoProduto, int quantidade) {
        Usuario dono = UsuarioUtils.getUser(usuarios, sub);

        Carrinho carrinho = carrinhos.abertoDe(sub)
                .orElseGet(() -> carrinhos.save(new Carrinho(dono)));

        return adicionarNoCarrinho(carrinho, idPublicoDoProduto, quantidade);
    }

    /**
     * Acrescenta um produto ao carrinho aberto de quem pediu.
     *
     * A quantidade SOMA na linha que ja existe, em vez de criar uma segunda —
     * e o que a unique (carrinho_id, produto_id) exige, e o que a pessoa espera
     * ao clicar "adicionar" duas vezes.
     *
     * O estoque e conferido contra o TOTAL da linha depois da soma, nao contra
     * a quantidade recem-pedida: quem ja tem 3 no carrinho e pede mais 2 esta
     * pedindo 5 ao estoque, e conferir so os 2 deixaria passar.
     */
    @Transactional
    public CarrinhoDtoOut adicionar(UUID sub, UUID idPublicoDoProduto, int quantidade) {
        UsuarioUtils.getUser(usuarios, sub);
        return adicionarNoCarrinho(carrinhoAbertoDe(sub), idPublicoDoProduto, quantidade);
    }

    /**
     * Tira uma quantidade da linha. Chegar a zero remove a linha inteira.
     *
     * Remover mais do que tem nao e erro: significa "tira tudo". Recusar
     * obrigaria quem chama a saber a quantidade exata antes de pedir, e o
     * resultado seria o mesmo.
     */
    @Transactional
    public CarrinhoDtoOut remover(UUID sub, UUID idPublicoDoProduto, int quantidade) {
        if (quantidade < 1) {
            throw new IllegalArgumentException("Quantidade a remover precisa ser pelo menos 1");
        }
        //verifica o usuário existente
        UsuarioUtils.getUser(usuarios, sub);
        //verifica se existe carrinho aberto pro usuario passdo
        Carrinho carrinho = carrinhoAbertoDe(sub);
        //verifica se o produto passado existe e está disponivel
        Produto produto = exigirProduto(idPublicoDoProduto);
        //verifica se o produto passado está no carrinho
        int atual = carrinho.getItens().stream()
                .filter(item -> item.getProduto().equals(produto))
                .mapToInt(ItemCarrinho::getQuantidade)
                .findFirst()
                .orElseThrow(() -> new ExcecaoDeNaoEncontrado(
                        "Este produto não está no seu carrinho."));

        carrinho.alterarQuantidade(produto, atual - quantidade);

        return gravarEMontar(carrinho);
    }

    /** O carrinho aberto de quem pediu, com as linhas e o total. */
    @Transactional(readOnly = true)
    public CarrinhoDtoOut ver(UUID sub) {
        //verificar se o usuário existe e ta autenticado
        UsuarioUtils.getUser(usuarios, sub);
        return montar(carrinhoAbertoDe(sub));
    }

    private CarrinhoDtoOut adicionarNoCarrinho(Carrinho carrinho, UUID idPublicoDoProduto,
                                            int quantidade) {
        if (quantidade < 1) {
            throw new IllegalArgumentException("Quantidade precisa ser pelo menos 1");
        }

        Produto produto = exigirProduto(idPublicoDoProduto);
        //verifica se o produto já está no carrinho e qual quantidade.
        int jaNoCarrinho = carrinho.getItens().stream()
                .filter(item -> item.getProduto().equals(produto))
                .mapToInt(ItemCarrinho::getQuantidade)
                .findFirst()
                .orElse(0);
        // verifica se tem estoque pro ja tem no carrinho mas o que quero colocar em caso do produto ja está no carrinho
        estoque.exigirDisponibilidade(produto, jaNoCarrinho + quantidade);

        carrinho.adicionar(produto, quantidade);

        return gravarEMontar(carrinho);
    }

    /**
     * Grava e monta a resposta.
     *
     * `saveAndFlush`, e nao `save`: o flush empurra as linhas agora, entao uma
     * violacao de CHECK ou de unique estoura aqui dentro, onde da para
     * traduzir, e nao no commit da transacao, ja fora do servico.
     */
    private CarrinhoDtoOut gravarEMontar(Carrinho carrinho) {
        carrinhos.saveAndFlush(carrinho);
        return montar(carrinho);
    }

    /**
     * Monta a resposta com o endereco das fotos resolvido — uma consulta para o
     * carrinho inteiro, e nao uma por linha.
     */
    private CarrinhoDtoOut montar(Carrinho carrinho) {
        List<Produto> daLinha = carrinho.getItens().stream()
                .map(ItemCarrinho::getProduto)
                .toList();

        return CarrinhoDtoOut.fromEntityToDto(carrinho, enderecoDaImagem.urlsDe(daLinha));
    }

    //verifica a existencia do carrinho pro usuário com subIdPassado
    private Carrinho carrinhoAbertoDe(UUID sub) {
        return carrinhos.abertoDe(sub)
                .orElseThrow(() -> new ExcecaoDeNaoEncontrado("Você ainda não tem um carrinho."));
    }

    //verifica se o produto existe
    private Produto exigirProduto(UUID idPublico) {
        return produtos.findByIdPublico(idPublico)
                .orElseThrow(() -> new ExcecaoDeNaoEncontrado("Não encontramos este produto."));
    }
}
