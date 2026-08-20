import { useEffect } from 'react';

export const NOME_DA_MARCA = 'Você no Coração da Gente';

/**
 * Titulo do documento a cada rota: "Carrinho · Você no Coração da Gente".
 * Ver docs/behavior.md secao 13.1.
 *
 * Nunca receba dado pessoal aqui — o titulo vai para o historico do navegador.
 */
export function useTituloDaPagina(titulo?: string) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · ${NOME_DA_MARCA}` : NOME_DA_MARCA;
  }, [titulo]);
}
