import { HttpResponse, delay, http } from 'msw';
import type { ErroApi } from '@/types/api';
import type { RespostaAutenticacao } from '@/types/autenticacao';
import type { Usuario } from '@/types/usuario';
import { criarToken } from '@/lib/token-simulado';
import { detectarTipoIdentificador, validarDocumento } from '@/lib/documento';
import {
  encontrarPorIdentificador,
  semSenha,
  usuarios,
  type UsuarioDeMock,
} from '@/mocks/fixtures/usuarios';
import { obterLatenciaDoMock } from '@/mocks/latencia';

/**
 * Login e cadastro mockados — RF-AUTH-01 e RF-AUTH-02.
 *
 * A lista de usuarios vive em memoria: o cadastro acrescenta e o novo usuario
 * ja loga em seguida, ate a pagina ser recarregada.
 */

function erro(status: number, mensagem: string, errosPorCampo?: Record<string, string>) {
  const corpo: ErroApi = {
    status,
    mensagem,
    ...(errosPorCampo ? { errosPorCampo } : {}),
    timestamp: new Date().toISOString(),
  };
  return HttpResponse.json(corpo, { status });
}

function autenticar(usuario: Usuario): RespostaAutenticacao {
  return {
    token: criarToken({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papeis: usuario.papeis,
    }),
    usuario,
  };
}

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor : '';
}

export const handlersAutenticacao = [
  http.post('*/autenticacao/login', async ({ request }) => {
    await delay(obterLatenciaDoMock());

    const corpo = (await request.json()) as Record<string, unknown>;
    const encontrado = encontrarPorIdentificador(texto(corpo.identificador));

    // Mensagem generica de proposito: distinguir "nao existe" de "senha errada"
    // entregaria um enumerador de contas — RF-AUTH-07.
    if (encontrado?.senha !== texto(corpo.senha)) {
      return erro(401, 'Credenciais inválidas.');
    }

    return HttpResponse.json(autenticar(semSenha(encontrado)));
  }),

  http.post('*/autenticacao/cadastro', async ({ request }) => {
    await delay(obterLatenciaDoMock());

    const corpo = (await request.json()) as Record<string, unknown>;
    const email = texto(corpo.email).trim().toLowerCase();
    const login = texto(corpo.login).trim();

    // O backend revalida o que o front ja validou: a checagem do front e UX,
    // a autoritativa e esta (docs/prd.md secao 3.3).
    const tipo = detectarTipoIdentificador(login);
    const loginValido =
      tipo === 'EMAIL' ? /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(login) : validarDocumento(login);

    if (!loginValido) {
      return erro(422, 'Não foi possível concluir o cadastro.', {
        login: 'Informe um CPF, CNPJ ou e-mail válido.',
      });
    }

    // Login e e-mail sao unicos, e um nao pode colidir com o outro: quem entra
    // digita um valor so, e o servidor procura nos dois campos.
    const conflitos: Record<string, string> = {};
    if (usuarios.some((usuario) => usuario.email.toLowerCase() === email)) {
      conflitos.email = 'Este e-mail já está cadastrado.';
    }
    if (
      usuarios.some(
        (usuario) =>
          usuario.login.toLowerCase() === login.toLowerCase() ||
          usuario.email.toLowerCase() === login.toLowerCase(),
      )
    ) {
      conflitos.login = 'Este login já está em uso.';
    }
    if (Object.keys(conflitos).length > 0) {
      return erro(409, 'Não foi possível concluir o cadastro.', conflitos);
    }

    const novo: UsuarioDeMock = {
      id: `u-${String(usuarios.length + 1).padStart(4, '0')}`,
      nome: texto(corpo.nome).trim(),
      email,
      login: tipo === 'EMAIL' ? login.toLowerCase() : login,
      // Quem se cadastra pela loja e sempre CLIENTE. ADMIN so por provisionamento.
      papeis: ['CLIENTE'],
      criadoEm: new Date().toISOString(),
      senha: texto(corpo.senha),
    };

    usuarios.push(novo);
    return HttpResponse.json(autenticar(semSenha(novo)), { status: 201 });
  }),
];
