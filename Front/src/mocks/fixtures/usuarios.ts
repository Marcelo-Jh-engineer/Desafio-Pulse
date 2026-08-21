import type { Usuario } from '@/types/usuario';

/**
 * Usuarios de teste. Vivem **em memoria** — recarregar volta a esta lista.
 *
 * O `login` do cliente e um CPF valido por digito verificador; o do admin, um
 * e-mail. Os dois formatos ficam exercitados desde o inicio.
 *
 * As senhas so existem no mock. Nunca versionar credencial real.
 */
export interface UsuarioDeMock extends Usuario {
  senha: string;
}

export const usuarios: UsuarioDeMock[] = [
  {
    id: 'u-0001',
    nome: 'Maria Souza',
    email: 'maria@exemplo.com',
    login: '11144477735',
    papeis: ['CLIENTE'],
    criadoEm: '2026-07-15T08:30:00Z',
    senha: 'senha123',
  },
  {
    id: 'u-0002',
    nome: 'Admin Osvaldo',
    email: 'admin@coracaodagente.com',
    login: 'admin@coracaodagente.com',
    papeis: ['ADMIN'],
    criadoEm: '2026-06-01T09:00:00Z',
    senha: 'admin123',
  },
];

/** Resposta nunca carrega senha — docs/models.md secao 5. */
export function semSenha(usuario: UsuarioDeMock): Usuario {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    login: usuario.login,
    papeis: usuario.papeis,
    criadoEm: usuario.criadoEm,
  };
}

/**
 * Aceita o `login` **ou** o e-mail. Quem resolve isso e o "backend" — o front
 * so manda o valor normalizado, sem dizer de que tipo e.
 */
export function encontrarPorIdentificador(identificador: string): UsuarioDeMock | undefined {
  const alvo = identificador.trim().toLowerCase();
  return usuarios.find(
    (usuario) => usuario.login.toLowerCase() === alvo || usuario.email.toLowerCase() === alvo,
  );
}
