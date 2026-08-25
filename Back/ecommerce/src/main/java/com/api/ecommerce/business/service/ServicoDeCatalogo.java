package com.api.ecommerce.business.service;

import com.api.ecommerce.dtos.CategoriaDto;
import com.api.ecommerce.dtos.PaginaDto;
import com.api.ecommerce.dtos.ProdutoDto;
import com.api.ecommerce.infrastructure.entities.ImagemDeProduto;
import com.api.ecommerce.infrastructure.entities.Produto;
import com.api.ecommerce.infrastructure.exception.ExcecaoDeNaoEncontrado;
import com.api.ecommerce.infrastructure.repositories.RepositorioDeCategoria;
import com.api.ecommerce.infrastructure.repositories.RepositorioDeImagemDeProduto;
import com.api.ecommerce.infrastructure.repositories.RepositorioDeProduto;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Leitura do catalogo publico — RF-CAT-01 a RF-CAT-09.
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

    public ServicoDeCatalogo(RepositorioDeProduto produtos,
                             RepositorioDeCategoria categorias,
                             RepositorioDeImagemDeProduto imagens) {
        this.produtos = produtos;
        this.categorias = categorias;
        this.imagens = imagens;
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
    public PaginaDto<ProdutoDto> listar(UUID idCategoria, String busca,
                                        Integer pagina, Integer tamanho) {
        String padrao = padraoDeBusca(vazioViraNulo(busca));

        return paraDto(produtos.buscarNoCatalogo(idCategoria, padrao, paginacaoDe(pagina, tamanho)));
    }

    /** A lista e curta e estavel, entao sai como array puro, sem paginacao. */
    @Transactional(readOnly = true)
    public List<CategoriaDto> categoriasAtivas() {
        return categorias.findByAtivaTrueOrderByOrdemAsc().stream()
                .map(CategoriaDto::de)
                .toList();
    }

    /** Os bytes da imagem. Unica consulta do projeto que os carrega. */
    @Transactional(readOnly = true)
    public ImagemDeProduto imagemDe(UUID idPublicoDoProduto) {
        return imagens.findByProdutoIdPublico(idPublicoDoProduto)
                .orElseThrow(() -> new ExcecaoDeNaoEncontrado("Nao encontramos esta imagem."));
    }

    /**
     * Pagina sem Sort, sempre.
     *
     * A ordem do catalogo e fixa e vive na propria consulta. Um Sort aqui
     * seria anexado DEPOIS daquele ORDER BY, onde nao decide nada — e daria a
     * impressao de que existe escolha de ordenacao, que nao existe.
     */
    private Pageable paginacaoDe(Integer pagina, Integer tamanho) {
        int indice = pagina == null || pagina < 0 ? 0 : pagina;
        int porPagina = tamanho == null || tamanho < 1
                ? TAMANHO_PADRAO
                : Math.min(tamanho, TAMANHO_MAXIMO);
        return PageRequest.of(indice, porPagina);
    }

    /**
     * Monta o DTO ja com o endereco da imagem resolvido.
     *
     * A foto tem duas origens possiveis — um caminho externo em
     * `url_imagem` ou os bytes em tb_produto_imagens — e este e o UNICO lugar
     * que decide entre as duas. Uma consulta para a pagina inteira, nao uma por
     * produto: perguntar "tem imagem?" doze vezes por tela seria doze idas ao
     * banco para montar uma grade.
     */
    private PaginaDto<ProdutoDto> paraDto(Page<Produto> pagina) {
        Set<UUID> ids = pagina.getContent().stream()
                .map(Produto::getIdPublico)
                .collect(Collectors.toSet());

        Set<UUID> comImagemNoBanco = ids.isEmpty() ? Set.of() : imagens.quaisTemImagem(ids);

        return PaginaDto.de(pagina, produto ->
                ProdutoDto.de(produto, urlDaImagem(produto, comImagemNoBanco)));
    }

    private String urlDaImagem(Produto produto, Set<UUID> comImagemNoBanco) {
        if (comImagemNoBanco.contains(produto.getIdPublico())) {
            return "/api/produtos/" + produto.getIdPublico() + "/imagem";
        }
        return produto.getUrlImagem();
    }

    /**
     * Transforma o termo digitado no padrao que o LIKE espera.
     *
     * **Nao ha normalizacao de acento.** Quem procura digita a palavra como ela
     * e escrita: "maçã" acha "Maçã Gala", "maca" nao acha nada.
     *
     * **Escapar.** `%` e `_` sao curingas do LIKE, e quem digita nao sabe
     * disso: procurar por "50%" traria tudo que comeca com "50", e um `_`
     * sozinho casaria qualquer caractere. Escapados, valem como os simbolos
     * que a pessoa escreveu. A barra invertida vem primeiro — escapar depois
     * dela escaparia as barras que os outros dois passos acabaram de inserir.
     *
     * **Rebaixar a caixa.** O outro lado da comparacao e o LOWER() do
     * Postgres, e a database usa o provedor ICU em pt-BR: LOWER('Água') devolve
     * 'água', acento preservado e em minuscula. O toLowerCase do Java faz o
     * mesmo, e por isso os dois lados casam — inclusive quando a inicial e
     * acentuada.
     *
     * Isso depende do locale da database. Com o locale C que havia antes,
     * LOWER() nao mexia em letra acentuada maiuscula, e procurar "água" nao
     * achava "Água Sanitária". Ver o comentario de POSTGRES_INITDB_ARGS em
     * docker-compose.yml.
     */
    private String padraoDeBusca(String termo) {
        if (termo == null) {
            return null;
        }
        String escapado = termo
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");

        return "%" + escapado.toLowerCase(Locale.ROOT) + "%";
    }

    /**
     * Parametro em branco e o mesmo que parametro ausente.
     *
     * `?busca=` chega como string vazia, e sem isto a consulta procuraria por
     * LIKE '%%' — que casa tudo, mas por acidente. Tratar aqui evita que a
     * diferenca entre "nao filtrei" e "filtrei por nada" exista.
     */
    private String vazioViraNulo(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
