import type { Categoria } from '@/types/catalogo';

/** Fixtures de docs/models.md secao 14. As mesmas usadas pelos testes. */
export const categorias: Categoria[] = [
  {
    id: 'c1a2b3c4-0001-4000-8000-000000000001',
    nome: 'Hortifrúti',
    descricao: 'Frutas, legumes e verduras',
    ordem: 1,
    ativa: true,
  },
  {
    id: 'c1a2b3c4-0002-4000-8000-000000000002',
    nome: 'Bebidas',
    descricao: 'Sucos, refrigerantes e água',
    ordem: 2,
    ativa: true,
  },
  {
    id: 'c1a2b3c4-0003-4000-8000-000000000003',
    nome: 'Padaria',
    descricao: 'Pães, bolos e salgados',
    ordem: 3,
    ativa: true,
  },
  {
    id: 'c1a2b3c4-0004-4000-8000-000000000004',
    nome: 'Limpeza',
    descricao: 'Produtos de limpeza para a casa',
    ordem: 4,
    ativa: true,
  },
  {
    id: 'c1a2b3c4-0005-4000-8000-000000000005',
    nome: 'Mercearia',
    descricao: 'Grãos, massas e enlatados',
    ordem: 5,
    ativa: true,
  },
  {
    id: 'c1a2b3c4-0006-4000-8000-000000000006',
    nome: 'Açougue',
    descricao: 'Carnes bovinas, suínas e aves',
    ordem: 6,
    ativa: true,
  },
];

export function encontrarCategoriaPorId(id: string): Categoria | undefined {
  return categorias.find((categoria) => categoria.id === id);
}
