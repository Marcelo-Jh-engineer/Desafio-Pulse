import { useEffect, useState } from 'react';

/**
 * Adia a propagacao de um valor que muda a cada tecla. A busca do catalogo usa
 * 300 ms — docs/behavior.md secao 3, interacoes.
 */
export function useValorAdiado<T>(valor: T, atrasoEmMs = 300): T {
  const [adiado, definirAdiado] = useState(valor);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      definirAdiado(valor);
    }, atrasoEmMs);

    return () => {
      clearTimeout(temporizador);
    };
  }, [valor, atrasoEmMs]);

  return adiado;
}
