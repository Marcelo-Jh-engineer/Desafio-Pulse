import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSessaoStore } from '@/lib/sessao-store';
import { useCarrinhoStore } from '@/lib/carrinho-store';
import { clienteHttp } from '@/lib/http';

/**
 * Encerra a sessao — RF-AUTH-08.
 *
 * Mora em `hooks/` e nao na feature porque quem chama e o cabecalho, que vive
 * em `app/` e nao pode depender de uma feature (RNF-MAN-06).
 */
export function useSair() {
  const sair = useSessaoStore((estado) => estado.sair);
  const esvaziar = useCarrinhoStore((estado) => estado.esvaziar);
  const clienteQuery = useQueryClient();
  const navegar = useNavigate();

  return useCallback(() => {
    // Sem corpo: o refresh token esta no cookie, e o navegador o envia sozinho.
    //
    // Limpar o store nao bastaria. A sessao continuaria de pe no provedor e o
    // cookie continuaria no navegador — bastaria um F5 para o usuario voltar
    // logado. So o servidor apaga o cookie, e e isso que esta chamada pede. Ela
    // sai sem esperar resposta: a interface nao pode ficar presa a ela.
    void clienteHttp.criar('/autenticacao/sair').catch(() => {
      // Provedor fora do ar nao pode prender ninguem logado na interface.
    });

    sair();
    // O carrinho e do usuario que estava logado; deixar para o proximo seria
    // vazamento entre sessoes — docs/behavior.md secao 2.
    esvaziar();
    clienteQuery.clear();
    void navegar('/', { replace: true });
  }, [sair, esvaziar, clienteQuery, navegar]);
}
