import type { Produto } from '@/types/catalogo';
import type { Unidade } from '@/types/dominio';
import { categorias } from '@/mocks/fixtures/categorias';

/**
 * Os 14 produtos de docs/models.md secao 14.
 *
 * `Alface Crespa` entra com estoque 0 de proposito: e a fixture do estado
 * indisponivel (RF-CAT-08). `Bolo de Cenoura` com 8 exercita o aviso de
 * ultimas unidades.
 */

interface Semente {
  sku: string;
  slug: string;
  nome: string;
  descricao: string;
  precoEmCentavos: number;
  unidade: Unidade;
  indiceCategoria: number;
  quantidadeEstoque: number;
}

const sementes: Semente[] = [
  {
    sku: 'HF-BAN-001',
    slug: 'banana-prata',
    nome: 'Banana Prata',
    descricao:
      'Banana prata selecionada, doce e madura no ponto certo. Rica em potássio e ideal para o lanche da tarde. Vendida por quilo.',
    precoEmCentavos: 799,
    unidade: 'KG',
    indiceCategoria: 0,
    quantidadeEstoque: 120,
  },
  {
    sku: 'HF-TOM-002',
    slug: 'tomate-italiano',
    nome: 'Tomate Italiano',
    descricao:
      'Tomate italiano de casca firme e polpa carnuda, com poucas sementes. O preferido para molhos caseiros e conservas.',
    precoEmCentavos: 1249,
    unidade: 'KG',
    indiceCategoria: 0,
    quantidadeEstoque: 64,
  },
  {
    sku: 'HF-ALF-003',
    slug: 'alface-crespa',
    nome: 'Alface Crespa',
    descricao:
      'Alface crespa colhida no dia, folhas crocantes e limpas. Vendida por unidade, já higienizada.',
    precoEmCentavos: 349,
    unidade: 'UN',
    indiceCategoria: 0,
    quantidadeEstoque: 0,
  },
  {
    sku: 'BB-REF-004',
    slug: 'refrigerante-cola-2l',
    nome: 'Refrigerante Cola 2L',
    descricao:
      'Refrigerante sabor cola em garrafa PET de 2 litros. Sirva bem gelado; rende cerca de oito copos.',
    precoEmCentavos: 899,
    unidade: 'UN',
    indiceCategoria: 1,
    quantidadeEstoque: 200,
  },
  {
    sku: 'BB-SUC-005',
    slug: 'suco-de-laranja-1l',
    nome: 'Suco de Laranja 1L',
    descricao:
      'Suco de laranja integral, sem adição de açúcar nem conservantes. Conservar refrigerado após aberto.',
    precoEmCentavos: 1190,
    unidade: 'UN',
    indiceCategoria: 1,
    quantidadeEstoque: 45,
  },
  {
    sku: 'BB-AGU-006',
    slug: 'agua-mineral-500ml',
    nome: 'Água Mineral 500ml',
    descricao:
      'Água mineral natural sem gás, garrafa de 500 ml. Fonte própria, com composição analisada e registrada.',
    precoEmCentavos: 250,
    unidade: 'UN',
    indiceCategoria: 1,
    quantidadeEstoque: 380,
  },
  {
    sku: 'PD-PAO-007',
    slug: 'pao-frances',
    nome: 'Pão Francês',
    descricao:
      'Pão francês assado várias vezes ao dia, casca crocante e miolo macio. Vendido por quilo.',
    precoEmCentavos: 1899,
    unidade: 'KG',
    indiceCategoria: 2,
    quantidadeEstoque: 30,
  },
  {
    sku: 'PD-BOL-008',
    slug: 'bolo-de-cenoura',
    nome: 'Bolo de Cenoura',
    descricao:
      'Bolo de cenoura caseiro com cobertura de chocolate, feito na padaria da loja. Rende de oito a dez fatias.',
    precoEmCentavos: 2450,
    unidade: 'UN',
    indiceCategoria: 2,
    quantidadeEstoque: 8,
  },
  {
    sku: 'LP-DET-009',
    slug: 'detergente-neutro-500ml',
    nome: 'Detergente Neutro 500ml',
    descricao:
      'Detergente líquido neutro para louças, com alto poder de remoção de gordura e suave nas mãos.',
    precoEmCentavos: 349,
    unidade: 'UN',
    indiceCategoria: 3,
    quantidadeEstoque: 150,
  },
  {
    sku: 'LP-SAB-010',
    slug: 'sabao-em-po-1kg',
    nome: 'Sabão em Pó 1kg',
    descricao:
      'Sabão em pó concentrado para máquina e lavagem à mão. Pacote de 1 kg, rende até 25 lavagens.',
    precoEmCentavos: 2199,
    unidade: 'PCT',
    indiceCategoria: 3,
    quantidadeEstoque: 72,
  },
  {
    sku: 'MC-ARR-011',
    slug: 'arroz-branco-5kg',
    nome: 'Arroz Branco 5kg',
    descricao: 'Arroz branco tipo 1, grãos longos e selecionados, sem quebras. Pacote de 5 kg.',
    precoEmCentavos: 2790,
    unidade: 'PCT',
    indiceCategoria: 4,
    quantidadeEstoque: 95,
  },
  {
    sku: 'MC-FEI-012',
    slug: 'feijao-carioca-1kg',
    nome: 'Feijão Carioca 1kg',
    descricao:
      'Feijão carioca tipo 1, safra nova, grãos uniformes e de cozimento rápido. Pacote de 1 kg.',
    precoEmCentavos: 899,
    unidade: 'PCT',
    indiceCategoria: 4,
    quantidadeEstoque: 110,
  },
  {
    sku: 'AC-PIC-013',
    slug: 'picanha-bovina',
    nome: 'Picanha Bovina',
    descricao:
      'Picanha bovina resfriada, com capa de gordura preservada. Corte nobre, ideal para churrasco e forno.',
    precoEmCentavos: 8990,
    unidade: 'KG',
    indiceCategoria: 5,
    quantidadeEstoque: 18,
  },
  {
    sku: 'AC-FRA-014',
    slug: 'peito-de-frango',
    nome: 'Peito de Frango',
    descricao:
      'Peito de frango resfriado sem osso e sem pele, embalado a vácuo. Vendido por quilo.',
    precoEmCentavos: 1890,
    unidade: 'KG',
    indiceCategoria: 5,
    quantidadeEstoque: 55,
  },
];

export const produtos: Produto[] = sementes.map((semente, indice) => {
  const numero = String(indice + 1).padStart(4, '0');
  return {
    id: `p1a2b3c4-${numero}-4000-8000-${numero.padStart(12, '0')}`,
    sku: semente.sku,
    slug: semente.slug,
    nome: semente.nome,
    descricao: semente.descricao,
    precoEmCentavos: semente.precoEmCentavos,
    unidade: semente.unidade,
    urlImagem: `/produtos/${semente.slug}.svg`,
    categoria: categorias[semente.indiceCategoria]!,
    quantidadeEstoque: semente.quantidadeEstoque,
    ativo: true,
    criadoEm: '2026-08-01T10:00:00Z',
    atualizadoEm: '2026-08-18T09:12:00Z',
  };
});
