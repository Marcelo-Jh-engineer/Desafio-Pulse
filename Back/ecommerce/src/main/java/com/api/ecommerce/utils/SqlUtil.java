package com.api.ecommerce.utils;

import java.util.Locale;

public final class SqlUtil {
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
     */
    public static String padraoDeBusca(String termo) {
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
     * LIKE '%%' — que casa tudo, mas por acidente.
     */
    public static String vazioViraNulo(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }

}
