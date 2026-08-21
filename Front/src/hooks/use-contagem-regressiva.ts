import { useEffect, useState } from 'react';

function calcularRestante(expiraEmMs: number | null): number {
  if (expiraEmMs === null) return 0;
  return Math.max(0, Math.ceil((expiraEmMs - Date.now()) / 1000));
}

/**
 * Conta para tras a partir de um instante de expiracao.
 *
 * Recebe o alvo em milissegundos, nao a duracao: assim recarregar a tela nao
 * reinicia o relogio — o prazo continua sendo o que o servidor definiu.
 *
 * O valor inicial sai do proprio render, e o efeito so cuida do intervalo. Isso
 * evita um primeiro quadro com o contador zerado e nao chama `setState` de
 * forma sincrona dentro do efeito.
 */
export function useContagemRegressiva(expiraEmMs: number | null): number {
  const [restanteEmSegundos, definirRestante] = useState(() => calcularRestante(expiraEmMs));
  const [alvoSincronizado, definirAlvoSincronizado] = useState(expiraEmMs);

  // Alvo novo (outra cobranca): ajusta durante o render, nao em efeito.
  if (expiraEmMs !== alvoSincronizado) {
    definirAlvoSincronizado(expiraEmMs);
    definirRestante(calcularRestante(expiraEmMs));
  }

  useEffect(() => {
    if (expiraEmMs === null) return;

    const intervalo = setInterval(() => {
      definirRestante(calcularRestante(expiraEmMs));
    }, 1000);

    return () => {
      clearInterval(intervalo);
    };
  }, [expiraEmMs]);

  return restanteEmSegundos;
}

/** `05:00` — sempre com dois digitos, para o contador nao dancar. */
export function formatarContagem(segundos: number): string {
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;
  return `${String(minutos).padStart(2, '0')}:${String(resto).padStart(2, '0')}`;
}
