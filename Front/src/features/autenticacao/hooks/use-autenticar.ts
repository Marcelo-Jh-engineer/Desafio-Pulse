import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { clienteHttp } from '@/lib/http';
import { rotaDeEntrada, useSessaoStore } from '@/lib/sessao-store';
import { useCarrinhoStore } from '@/lib/carrinho-store';
import { sanitizarDestino } from '@/lib/redirecionamento';
import { lerToken } from '@/lib/token';
import type {
  RequisicaoCadastro,
  RequisicaoLogin,
  RespostaAutenticacao,
} from '@/types/autenticacao';

/**
 * Login e cadastro. Os dois terminam igual: hidratam a sessao, retomam a
 * intencao de compra que o visitante deixou pendente e mandam o usuario para o
 * destino certo — docs/behavior.md fluxos 12.1 e 12.2.
 */

function useConcluir() {
  const entrar = useSessaoStore((estado) => estado.entrar);
  const consumirIntencao = useCarrinhoStore((estado) => estado.consumirIntencao);
  const descartarIntencao = useCarrinhoStore((estado) => estado.descartarIntencao);
  const restaurar = useCarrinhoStore((estado) => estado.restaurar);
  const clienteQuery = useQueryClient();
  const navegar = useNavigate();
  const [parametros] = useSearchParams();

  return useCallback(
    (resposta: RespostaAutenticacao) => {
      entrar(resposta);
      // Sem isso, o cache montado como visitante sobrevive a troca de papel e
      // vaza dado de uma sessao para a proxima.
      clienteQuery.clear();

      const papeis = lerToken(resposta.token)?.papeis ?? [];
      const ehAdmin = papeis.includes('ADMIN');

      if (ehAdmin) {
        // Admin nao compra: a intencao e descartada em silencio, e o destino
        // guardado tambem e ignorado — ele vai para a area administrativa.
        descartarIntencao();
        void navegar(rotaDeEntrada(papeis), { replace: true });
        return;
      }

      // Consumida **uma unica vez**: recarregar depois nao adiciona de novo.
      const intencao = consumirIntencao();
      if (intencao) {
        restaurar(intencao.item, 0);
        toast.success(`${intencao.item.nome} adicionado ao carrinho`);
      }

      const destino = sanitizarDestino(parametros.get('retornarPara'));
      void navegar(destino, { replace: true });
    },
    [entrar, consumirIntencao, descartarIntencao, restaurar, clienteQuery, navegar, parametros],
  );
}

export function useLogin() {
  const concluir = useConcluir();
  return useMutation({
    mutationFn: (dados: RequisicaoLogin) =>
      clienteHttp.criar<RespostaAutenticacao>('/autenticacao/login', dados),
    onSuccess: concluir,
  });
}

export function useCadastro() {
  const concluir = useConcluir();
  return useMutation({
    mutationFn: (dados: RequisicaoCadastro) =>
      clienteHttp.criar<RespostaAutenticacao>('/autenticacao/cadastro', dados),
    onSuccess: concluir,
  });
}
