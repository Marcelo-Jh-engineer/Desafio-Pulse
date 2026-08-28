package com.api.ecommerce.business.service;

import com.api.ecommerce.dtos.out.CategoriaDtoOut;
import com.api.ecommerce.dtos.out.PaginaDtoOut;
import com.api.ecommerce.dtos.out.ProdutoDtoOut;
import com.api.ecommerce.infrastructure.entities.ImagemDeProduto;
import com.api.ecommerce.infrastructure.entities.Produto;
import com.api.ecommerce.infrastructure.exception.ExcecaoDeNaoEncontrado;
import com.api.ecommerce.infrastructure.repositories.RepositorioDeCategoria;
import com.api.ecommerce.infrastructure.repositories.RepositorioDeImagemDeProduto;
import com.api.ecommerce.infrastructure.repositories.RepositorioDeProduto;
import com.api.ecommerce.infrastructure.repositories.RepositorioDeProduto.ProdutoDoCatalogo;
import java.util.List;
import java.util.UUID;

import com.api.ecommerce.utils.SqlUtil;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Leitura do catalogo publico
 *
 * Um servico so atende os dois controllers. A listagem inicial e a busca sao
 * a mesma consulta com parametros diferentes: quem procura "banana" quer o
 * mesmo catalogo, filtrado. Duplicar a regra em dois lugares faria a primeira
 * divergir da segunda no dia em que uma das duas mudasse.
 */
@Service
public class ServicoDeCatalogo {

    /** Padrao de itens por pagina quando o cliente nao pede outro. */
    public static final int TAMANHO_PADRAO = 10;

    /**
     * Teto por pagina.
     *
     * O cliente escolhe o tamanho, mas nao sem limite: `tamanho=100000` numa
     * requisicao publica traz o catalogo inteiro, com a categoria de cada
     * produto, e transforma um parametro de conveniencia em botao de derrubar
     * o servidor.
     */
    public static final int TAMANHO_MAXIMO = 60;

    private final RepositorioDeProduto produtos;
    private final RepositorioDeCategoria categorias;
    private final RepositorioDeImagemDeProduto imagens;
    private final ServicoDeImagemDeProduto enderecoDaImagem;

    public ServicoDeCatalogo(RepositorioDeProduto produtos,
                             RepositorioDeCategoria categorias,
                             RepositorioDeImagemDeProduto imagens,
                             ServicoDeImagemDeProduto enderecoDaImagem) {
        this.produtos = produtos;
        this.categorias = categorias;
        this.imagens = imagens;
        this.enderecoDaImagem = enderecoDaImagem;
    }

    /**
     * O catalogo, paginado e opcionalmente filtrado.
     *
     * Sao dois filtros, e so dois: categoria — pelo id publico dela — e nome.
     * Ambos nulos significam "nao filtre por isso", e e o que permite esta
     * unica consulta atender o catalogo inteiro, o filtro por categoria, a
     * busca por nome, e as duas coisas juntas.
     *
     * A ordem do resultado nao se escolhe: ela e fixa na consulta.
     */
    @Transactional(readOnly = true)
    public PaginaDtoOut<ProdutoDtoOut> listar(UUID idCategoria, String busca,
                                        Integer pagina, Integer tamanho) {
        //limpeza da string de busca
        String padrao = SqlUtil.padraoDeBusca(SqlUtil.vazioViraNulo(busca));
        Page<ProdutoDoCatalogo> encontrados = produtos.buscarNoCatalogo(
                idCategoria, padrao, getPaginacaoDe(pagina, tamanho));
        return paraDto(encontrados);
    }

    /**
     * Um produto 
     *
     * Produto inativo devolve 404 igual a id inventado. A mensagem tambem e a
     * mesma: dizer "este produto foi desativado" entregaria, a quem varre a
     * API, a lista do que ja existiu.
     */
    @Transactional(readOnly = true)
    public ProdutoDtoOut porId(UUID idPublico) {
        Produto produto = produtos.findByIdPublico(idPublico)
                .filter(Produto::isAtivo)
                .orElseThrow(() -> new ExcecaoDeNaoEncontrado("Nao encontramos este produto."));

        return ProdutoDtoOut.fromEntityToDto(produto, enderecoDaImagem.urlDe(produto));
    }

    /** A lista e curta e estavel, entao sai como array puro, sem paginacao. */
    @Transactional(readOnly = true)
    public List<CategoriaDtoOut> categoriasAtivas() {
        List<CategoriaDtoOut> ativas = categorias.findByAtivaTrueOrderByOrdemAsc().stream()
                .map(CategoriaDtoOut::fromEntityToDto)
                .toList();

        return ativas;
    }

    /** Os bytes da imagem. Unica consulta do projeto que os carrega. */
    @Transactional(readOnly = true)
    public ImagemDeProduto imagemDe(UUID idPublicoDoProduto) {
        ImagemDeProduto imagem = imagens.findByProdutoIdPublico(idPublicoDoProduto)
                .orElseThrow(() -> new ExcecaoDeNaoEncontrado("Nao encontramos esta imagem."));

        return imagem;
    }

    /**
     * Pagina sem Sort, sempre.
     *
     * A ordem do catalogo e fixa e vive na propria consulta. Um Sort aqui
     * seria anexado DEPOIS daquele ORDER BY, onde nao decide nada — e daria a
     * impressao de que existe escolha de ordenacao, que nao existe.
     */
    private Pageable getPaginacaoDe(Integer pagina, Integer tamanho) {
        int indice = pagina == null || pagina < 0 ? 0 : pagina;
        int porPagina = tamanho == null || tamanho < 1
                ? TAMANHO_PADRAO
                : Math.min(tamanho, TAMANHO_MAXIMO);

        return PageRequest.of(indice, porPagina);
    }

    /**
     * Monta o DTO ja com o endereco da imagem resolvido, sem tocar no banco.
     *
     * A consulta do catalogo ja trouxe, por linha, se ha foto gravada. Aqui so
     * se decide de onde sai a URL — e quem decide continua sendo o
     * ServicoDeImagemDeProduto, o unico lugar que conhece essa regra.
     */
    private PaginaDtoOut<ProdutoDtoOut> paraDto(Page<ProdutoDoCatalogo> pagina) {
        return PaginaDtoOut.de(pagina, linha ->
                ProdutoDtoOut.fromEntityToDto(
                        linha.produto(),
                        enderecoDaImagem.urlDe(linha.produto(), linha.temImagemNoBanco())));
    }
}
