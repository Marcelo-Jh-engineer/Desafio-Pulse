package com.api.ecommerce.infrastructure.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import lombok.Getter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * Foto do produto guardada no proprio banco.
 *
 * Entidade separada do Produto de proposito: a listagem do catalogo carrega o
 * produto inteiro a cada pagina, e com os bytes na mesma entidade uma grade de
 * doze miniaturas traria doze imagens junto. Aqui os bytes so saem do banco
 * quando alguem pede exatamente esta imagem.
 *
 * E uma das duas origens possiveis da foto. A outra e `Produto.urlImagem`, um
 * caminho para arquivo servido em outro lugar. Nenhum produto precisa das duas.
 */
@Entity
@Table(name = "tb_produto_imagens")
@Getter
public class ImagemDeProduto {

    /** Dois megabytes. Foto de produto passa longe; o teto e contra o engano. */
    public static final int TAMANHO_MAXIMO_EM_BYTES = 2 * 1024 * 1024;

    /**
     * Formatos que esta classe aceita GRAVAR — e por aqui que passa toda
     * escrita da aplicacao, upload do admin inclusive.
     *
     * SVG fica de fora de proposito: SVG e XML e aceita script dentro, e servir
     * um arquivo enviado por terceiro na mesma origem da loja daria a ele o
     * mesmo poder que o codigo da propria pagina tem. Foto de produto e imagem
     * de pixels; nao ha ganho que pague esse risco.
     *
     * O CHECK da tabela e mais permissivo e aceita image/svg+xml, porque a
     * carga inicial do catalogo e feita de SVG. A diferenca e proposital: SVG
     * nosso, escrito numa migration revisada, entra; SVG de quem envia um
     * arquivo, nao. Ver V8__seed_imagens.sql.
     *
     * Se um dia o upload precisar aceitar SVG, a decisao tem de ser tomada
     * aqui, junto com a sanitizacao — nao herdada da migration por descuido.
     */
    public static final Set<String> TIPOS_ACEITOS =
            Set.of("image/jpeg", "image/png", "image/webp", "image/avif");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private UUID idPublico = UUID.randomUUID();

    /** Uma imagem por produto: o contrato expoe um `urlImagem`, no singular. */
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "produto_id", nullable = false, unique = true)
    private Produto produto;

    @Column(nullable = false, columnDefinition = "bytea")
    private byte[] conteudo;

    /**
     * Vai no cabecalho Content-Type ao servir. Guardado, e nao deduzido da
     * extensao do arquivo: extensao e o que quem envia diz, nao o que o arquivo
     * e.
     */
    @Column(nullable = false, length = 40)
    private String tipoConteudo;

    @Column(nullable = false)
    private int tamanhoEmBytes;

    @Column(length = 255)
    private String nomeArquivo;

    /**
     * SHA-256 do conteudo, em hexadecimal. Serve de ETag: o navegador guarda a
     * imagem e so a baixa de novo quando ela muda de verdade. Sem isso, cada
     * visita ao catalogo puxaria as fotos inteiras do banco outra vez.
     */
    @Column(nullable = false, length = 64)
    private String hashSha256;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant criadoEm;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant atualizadoEm;

    protected ImagemDeProduto() {
        // Exigido pelo JPA.
    }

    public ImagemDeProduto(Produto produto, byte[] conteudo, String tipoConteudo,
                           String nomeArquivo) {
        this.produto = produto;
        this.nomeArquivo = nomeArquivo;
        substituir(conteudo, tipoConteudo);
    }

    /** Trocar a foto reescreve esta linha; nao acumula versoes. */
    public final void substituir(byte[] conteudo, String tipoConteudo) {
        exigirTipoAceito(tipoConteudo);
        exigirTamanhoValido(conteudo);
        // Copia na entrada e na saida: byte[] e mutavel, e quem chamou continua
        // com a referencia na mao. Sem a copia, alterar o array depois mudaria
        // o conteudo da entidade sem passar por nenhuma validacao — e o hash
        // ja calculado deixaria de corresponder aos bytes.
        this.conteudo = conteudo.clone();
        this.tipoConteudo = tipoConteudo;
        this.tamanhoEmBytes = conteudo.length;
        this.hashSha256 = calcularHash(this.conteudo);
    }

    public byte[] getConteudo() {
        return conteudo.clone();
    }

    /** O que vai no ETag da resposta, ja no formato que o cabecalho espera. */
    public String etag() {
        return "\"" + hashSha256 + "\"";
    }

    private static void exigirTipoAceito(String tipoConteudo) {
        if (tipoConteudo == null || !TIPOS_ACEITOS.contains(tipoConteudo)) {
            throw new IllegalArgumentException(
                    "Formato de imagem nao aceito: " + tipoConteudo);
        }
    }

    private static void exigirTamanhoValido(byte[] conteudo) {
        if (conteudo == null || conteudo.length == 0) {
            throw new IllegalArgumentException("Imagem vazia");
        }
        if (conteudo.length > TAMANHO_MAXIMO_EM_BYTES) {
            throw new IllegalArgumentException(
                    "Imagem maior que o limite de " + TAMANHO_MAXIMO_EM_BYTES + " bytes");
        }
    }

    private static String calcularHash(byte[] conteudo) {
        try {
            MessageDigest digestor = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digestor.digest(conteudo));
        } catch (NoSuchAlgorithmException excecao) {
            // SHA-256 e obrigatorio em toda JVM desde a especificacao 1.4. Se
            // faltar, o ambiente esta quebrado de um jeito que nao cabe tratar.
            throw new IllegalStateException("JVM sem SHA-256", excecao);
        }
    }

    @Override
    public boolean equals(Object outro) {
        return outro instanceof ImagemDeProduto imagem && idPublico.equals(imagem.idPublico);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(idPublico);
    }
}
