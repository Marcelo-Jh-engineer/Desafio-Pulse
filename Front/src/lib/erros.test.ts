import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';
import { ErroDeAplicacao, MENSAGENS_ERRO, normalizarErro } from '@/lib/erros';

function erroComResposta(status: number, corpo: unknown): AxiosError {
  const configuracao = { headers: new AxiosHeaders() };
  const erro = new AxiosError('falha', 'ERR_BAD_RESPONSE', configuracao);
  erro.response = {
    status,
    statusText: '',
    data: corpo,
    headers: new AxiosHeaders(),
    config: configuracao,
  };
  return erro;
}

describe('normalizarErro', () => {
  it('usa a mensagem do backend quando o corpo segue o contrato de ErroApi', () => {
    const normalizado = normalizarErro(
      erroComResposta(409, {
        status: 409,
        mensagem: 'Este e-mail já está cadastrado.',
        errosPorCampo: { email: 'Este e-mail já está cadastrado.' },
        timestamp: '2026-08-20T14:30:00Z',
      }),
    );

    expect(normalizado.message).toBe('Este e-mail já está cadastrado.');
    expect(normalizado.status).toBe(409);
    expect(normalizado.errosPorCampo).toEqual({ email: 'Este e-mail já está cadastrado.' });
  });

  it('trata ausência de resposta como falha de rede', () => {
    const erro = new AxiosError('sem resposta', 'ECONNABORTED', { headers: new AxiosHeaders() });

    const normalizado = normalizarErro(erro);

    expect(normalizado.message).toBe(MENSAGENS_ERRO.rede);
    expect(normalizado.status).toBe(0);
  });

  it('distingue 401 de 403 — sessão expirada não é falta de permissão', () => {
    const expirada = normalizarErro(erroComResposta(401, null));
    const semPermissao = normalizarErro(erroComResposta(403, null));

    expect(expirada.ehSessaoExpirada).toBe(true);
    expect(expirada.ehSemPermissao).toBe(false);

    expect(semPermissao.ehSemPermissao).toBe(true);
    expect(semPermissao.ehSessaoExpirada).toBe(false);
  });

  it('não vaza detalhe interno quando o corpo do erro é desconhecido', () => {
    const normalizado = normalizarErro(erroComResposta(500, '<html>stack trace</html>'));

    expect(normalizado.message).toBe(MENSAGENS_ERRO.servidor);
  });

  it('devolve o mesmo objeto quando o erro já está normalizado', () => {
    const original = new ErroDeAplicacao('já normalizado', 422);

    expect(normalizarErro(original)).toBe(original);
  });
});
