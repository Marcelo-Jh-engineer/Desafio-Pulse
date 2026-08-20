import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  CHAVE_ARMAZENAMENTO_TEMA,
  ContextoDeTema,
  type Tema,
  type TemaEfetivo,
} from '@/app/provedores/contexto-tema';

function lerPreferenciaDoSistema(): TemaEfetivo {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function lerTemaSalvo(): Tema {
  const salvo = window.localStorage.getItem(CHAVE_ARMAZENAMENTO_TEMA);
  return salvo === 'claro' || salvo === 'escuro' || salvo === 'sistema' ? salvo : 'sistema';
}

export function ProvedorTema({ children }: { children: ReactNode }) {
  const [tema, definirTemaInterno] = useState<Tema>(lerTemaSalvo);
  const [preferenciaSistema, definirPreferenciaSistema] =
    useState<TemaEfetivo>(lerPreferenciaDoSistema);

  useEffect(() => {
    const consulta = window.matchMedia('(prefers-color-scheme: dark)');
    const aoMudar = () => {
      definirPreferenciaSistema(consulta.matches ? 'dark' : 'light');
    };
    consulta.addEventListener('change', aoMudar);
    return () => {
      consulta.removeEventListener('change', aoMudar);
    };
  }, []);

  const temaEfetivo: TemaEfetivo =
    tema === 'sistema' ? preferenciaSistema : tema === 'escuro' ? 'dark' : 'light';

  useEffect(() => {
    // Os tokens de docs/design.md secao 4.1 vivem em `:root` e `.dark`.
    document.documentElement.classList.toggle('dark', temaEfetivo === 'dark');
    document.documentElement.style.colorScheme = temaEfetivo;
  }, [temaEfetivo]);

  const definirTema = useCallback((novo: Tema) => {
    window.localStorage.setItem(CHAVE_ARMAZENAMENTO_TEMA, novo);
    definirTemaInterno(novo);
  }, []);

  const valor = useMemo(
    () => ({ tema, temaEfetivo, definirTema }),
    [tema, temaEfetivo, definirTema],
  );

  return <ContextoDeTema.Provider value={valor}>{children}</ContextoDeTema.Provider>;
}
