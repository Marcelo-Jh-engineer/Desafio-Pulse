import { createContext, useContext } from 'react';

export type Tema = 'claro' | 'escuro' | 'sistema';
export type TemaEfetivo = 'light' | 'dark';

export const CHAVE_ARMAZENAMENTO_TEMA = 'tema';

export interface ContextoTema {
  tema: Tema;
  /** O tema realmente aplicado, ja resolvendo `sistema`. */
  temaEfetivo: TemaEfetivo;
  definirTema: (tema: Tema) => void;
}

export const ContextoDeTema = createContext<ContextoTema | null>(null);

export function useTema(): ContextoTema {
  const contexto = useContext(ContextoDeTema);
  if (!contexto) {
    throw new Error('useTema precisa estar dentro de <ProvedorTema>.');
  }
  return contexto;
}
