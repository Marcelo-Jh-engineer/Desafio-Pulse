# Modelos de Dados

Contrato de dados do frontend. Os tipos em `Front/src/types/` espelham este documento, e o backend Spring Boot expõe **exatamente estes nomes de campo** no JSON — não existe camada de tradução entre front e back.

> Ao alterar qualquer tipo aqui, atualize também `docs/behavior.md` (telas que consomem) e as fixtures de mock em `Front/src/mocks/`.

---

## 1. Convenções

| Assunto | Regra |
|---|---|
| Identificadores | `id: string` (UUID v4). Nunca número. |
| Datas | String ISO 8601 em UTC com sufixo `Z`: `"2026-08-20T14:32:00Z"`. Nunca `Date` no modelo — a conversão acontece na view. |
| Dinheiro | **Inteiro em centavos**: `precoEmCentavos: 1990` = R$ 19,90. Nunca ponto flutuante. |
| Enums | Union type de string literal em `SCREAMING_SNAKE_CASE`. Sem `enum` do TypeScript. |
| Campos opcionais | `campo?: string` quando a API pode omitir. Evitar nulo explícito; o backend omite o campo. |
| Nomenclatura | Português, `camelCase`, **sem acento e sem cedilha** nos identificadores: `descricao`, `precoEmCentavos`, `movimentacaoEstoque`. Acento só em texto de UI e comentário. |
| Documento e CEP | Trafegam e são armazenados **só com dígitos**. Formatação é responsabilidade exclusiva da camada de apresentação. |
| Coleções | Sempre dentro de `Pagina<T>` quando a listagem pagina; array puro só para listas pequenas e fechadas (ex.: categorias). |

**Exceções em inglês** (não são domínio, são plataforma): APIs de biblioteca (`useQuery`, `isLoading`, `data`, `onSubmit`) e as claims registradas do JWT pela RFC 7519 (`sub`, `iat`, `exp`).

---

## 2. Enums e tipos base

```ts
/** Papel do usuário no RBAC. Vem das claims do JWT. */
export type Papel = 'CLIENTE' | 'ADMIN';

/** Unidade de venda do produto. */
export type Unidade = 'UN' | 'KG' | 'G' | 'L' | 'ML' | 'PCT';

/** Status do pedido. */
export type StatusPedido = 'PENDENTE' | 'PAGO' | 'FALHOU' | 'CANCELADO';

/** Direção da movimentação de estoque. */
export type TipoMovimentacao = 'ENTRADA' | 'SAIDA';

/** Desfecho do pagamento simulado. */
export type StatusPagamento = 'APROVADO' | 'RECUSADO';
```

Rótulos de exibição ficam em mapas na camada de apresentação, nunca no modelo:

```ts
export const ROTULO_UNIDADE: Record<Unidade, string> = {
  UN: 'unidade',
  KG: 'quilo',
  G: 'grama',
  L: 'litro',
  ML: 'mililitro',
  PCT: 'pacote',
};
```

---

## 3. Categoria

Modelo próprio — o produto **não** guarda categoria como string solta.

```ts
export interface Categoria {
  id: string;
  nome: string;        // "Hortifrúti" — com acento, é texto de exibição
  slug: string;        // "hortifruti" — sem acento, usado na URL do filtro
  descricao?: string;
  urlIcone?: string;
  ordem: number;       // ordenação no filtro do catálogo, crescente
  ativa: boolean;
}
```

```json
{
  "id": "c1a2b3c4-0001-4000-8000-000000000001",
  "nome": "Hortifrúti",
  "slug": "hortifruti",
  "descricao": "Frutas, legumes e verduras",
  "urlIcone": "/icones/hortifruti.svg",
  "ordem": 1,
  "ativa": true
}
```

**Regras**
- `slug` é único e derivado de `nome` sem acento, em minúsculas, com hífen. Gerado pelo backend.
- Categoria com `ativa: false` some do filtro público, mas **não** apaga o vínculo dos produtos já cadastrados.
- O filtro do catálogo usa `slug` (é o que aparece na URL); o formulário do admin usa `id`.
- A lista de categorias é curta e estável — retorna como array puro, não paginada.

### Escrita (admin)

```ts
export interface RequisicaoCategoria {
  nome: string;
  descricao?: string;
  urlIcone?: string;
  ordem: number;
  ativa: boolean;
}
```

---

## 4. Produto

### Leitura — categoria aninhada

```ts
export interface Produto {
  id: string;
  sku: string;
  slug: string;
  nome: string;
  descricao: string;
  precoEmCentavos: number;
  unidade: Unidade;
  urlImagem: string;
  categoria: Categoria;      // aninhada na leitura
  quantidadeEstoque: number;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}
```

```json
{
  "id": "p1a2b3c4-0001-4000-8000-000000000001",
  "sku": "HF-BAN-001",
  "slug": "banana-prata-kg",
  "nome": "Banana Prata",
  "descricao": "Banana prata selecionada, doce e madura. Vendida por quilo.",
  "precoEmCentavos": 799,
  "unidade": "KG",
  "urlImagem": "/produtos/banana-prata.jpg",
  "categoria": {
    "id": "c1a2b3c4-0001-4000-8000-000000000001",
    "nome": "Hortifrúti",
    "slug": "hortifruti",
    "ordem": 1,
    "ativa": true
  },
  "quantidadeEstoque": 120,
  "ativo": true,
  "criadoEm": "2026-08-01T10:00:00Z",
  "atualizadoEm": "2026-08-18T09:12:00Z"
}
```

### Escrita — só o id da categoria

```ts
export interface RequisicaoProduto {
  sku: string;
  nome: string;
  descricao: string;
  precoEmCentavos: number;
  unidade: Unidade;
  urlImagem: string;
  categoriaId: string;         // só o id, não o objeto
  quantidadeEstoque: number;   // estoque inicial, só no cadastro
  ativo: boolean;
}
```

**Regras**
- `quantidadeEstoque === 0` → produto aparece no catálogo como **indisponível**, sem botão de compra. Não some da listagem.
- `ativo: false` → some do catálogo público, continua visível na listagem admin.
- `slug` e `sku` são únicos. `slug` é gerado pelo backend a partir de `nome`.
- `precoEmCentavos` é inteiro positivo. O formulário aceita "19,90" e converte para `1990` antes de enviar.
- Produtos vendidos por peso (`KG`, `G`, `L`, `ML`) ainda usam `quantidade` inteira no carrinho — a unidade é só rótulo.

---

## 5. Usuário

```ts
export interface Usuario {
  id: string;
  nome: string;        // nome completo ou razão social
  email: string;
  documento: string;   // só dígitos: 11 = CPF, 14 = CNPJ
  telefone?: string;   // só dígitos, com DDD
  papeis: Papel[];
  criadoEm: string;
}
```

```json
{
  "id": "u1a2b3c4-0001-4000-8000-000000000001",
  "nome": "Maria Souza",
  "email": "maria@exemplo.com",
  "documento": "11144477735",
  "telefone": "11987654321",
  "papeis": ["CLIENTE"],
  "criadoEm": "2026-07-15T08:30:00Z"
}
```

**Regras**
- `documento` é sempre armazenado e trafegado **sem pontuação**. Formatar é papel exclusivo da view.
- **Não existe campo de tipo de pessoa.** O tipo do documento é inferido pelo comprimento: 11 dígitos = CPF, 14 = CNPJ, qualquer outro tamanho é inválido. Quando a UI precisa do tipo (rótulo, máscara), deriva com `detectarTipoDocumento(documento)` — nunca persiste essa informação.
- `email` e `documento` são únicos no sistema.
- O objeto **nunca** carrega senha, nem hash, em nenhuma resposta.
- `papeis` é array porque o backend pode conceder mais de um papel; o front sempre trata como conjunto, nunca assume `papeis[0]`.

---

## 6. Identificação e autenticação

### Tipos derivados (só UI)

Nenhum dos dois é campo persistido. Servem para decidir máscara e validação em tempo de digitação.

```ts
export type TipoDocumento = 'CPF' | 'CNPJ';
export type TipoIdentificador = 'EMAIL' | 'CPF' | 'CNPJ';
```

#### `detectarTipoDocumento(documento: string): TipoDocumento | undefined`

| Entrada (após remover não-dígitos) | Resultado |
|---|---|
| 11 dígitos | `'CPF'` |
| 14 dígitos | `'CNPJ'` |
| qualquer outro comprimento | `undefined` |

#### `detectarTipoIdentificador(valor: string): TipoIdentificador | undefined`

| Condição, avaliada nesta ordem | Resultado |
|---|---|
| Contém `@` | `'EMAIL'` |
| Só dígitos após remover pontuação, 11 dígitos | `'CPF'` |
| Só dígitos após remover pontuação, 14 dígitos | `'CNPJ'` |
| Qualquer outro caso | `undefined` |

Casos de borda cobertos por teste: valor colado já formatado (`529.982.247-25`), espaços nas pontas, email em maiúsculas, documento incompleto durante a digitação (retorna `undefined` sem erro visível até o `blur`), CPF com 11 dígitos iguais (`11111111111` — comprimento válido, dígito verificador inválido).

### Login

```ts
export interface RequisicaoLogin {
  identificador: string;   // email, CPF ou CNPJ — já normalizado
  senha: string;
}
```

```json
{ "identificador": "11144477735", "senha": "senha123" }
```

```json
{ "identificador": "maria@exemplo.com", "senha": "senha123" }
```

**Contrato**: o **backend** resolve o identificador para o usuário. O front só normaliza (documento sem pontuação, email em minúsculas e sem espaços) e valida o formato — não decide por qual coluna buscar, e não envia nenhuma dica de tipo.

### Cadastro

```ts
export interface RequisicaoCadastro {
  nome: string;
  email: string;
  documento: string;   // só dígitos, 11 ou 14
  telefone?: string;
  senha: string;
}
```

`confirmacaoSenha` existe **apenas no schema do formulário**, para o `refine` do Zod. Nunca é enviada ao backend.

### Resposta de autenticação

```ts
export interface RespostaAutenticacao {
  token: string;       // JWT de acesso
  expiraEm: string;    // ISO 8601 — conveniência; a verdade é a claim exp
  usuario: Usuario;
}
```

### Claims do JWT

**O contrato mais crítico deste documento.** O mock da F2 emite exatamente esta forma, então a F6 não altera nada no consumo.

```ts
export interface ClaimsJwt {
  /** Registradas pela RFC 7519 — permanecem em inglês. */
  sub: string;         // id do usuário
  iat: number;         // emitido em, epoch em segundos
  exp: number;         // expira em, epoch em segundos
  /** Customizadas — em português, espelhadas pelo backend. */
  email: string;
  nome: string;
  papeis: Papel[];
}
```

Payload decodificado de exemplo:

```json
{
  "sub": "u1a2b3c4-0001-4000-8000-000000000001",
  "iat": 1755691200,
  "exp": 1755694800,
  "email": "maria@exemplo.com",
  "nome": "Maria Souza",
  "papeis": ["CLIENTE"]
}
```

**Regras**
- `decodificarToken()` faz apenas a decodificação base64 do segundo segmento e o parse do JSON. **Não valida assinatura** — isso é responsabilidade do backend.
- Isso é seguro porque o front usa as claims **só para montar a UI**. Qualquer requisição privilegiada é autorizada de novo pelo servidor.
- O mock emite um token com assinatura falsa, com header e payload em base64 válidos. Formato idêntico, conteúdo não confiável — exatamente como o real, do ponto de vista do front.
- Token malformado, expirado ou sem `papeis` → sessão tratada como anônima, sem exceção não capturada.

### Sessão (estado de cliente)

```ts
export interface Sessao {
  token: string | null;
  usuario: Usuario | null;
  papeis: Papel[];
  autenticado: boolean;
  expiraEm: number | null;   // epoch em segundos, vindo de exp
}
```

Vive no store Zustand, **não persistido** (ver a decisão de segurança em `docs/prd.md`).

---

## 7. Carrinho

```ts
export interface ItemCarrinho {
  produtoId: string;
  /** Snapshot no momento em que o item entrou no carrinho. */
  nome: string;
  precoEmCentavos: number;
  urlImagem: string;
  unidade: Unidade;
  quantidade: number;
  totalLinhaEmCentavos: number;   // precoEmCentavos * quantidade
}

export interface Carrinho {
  itens: ItemCarrinho[];
  subtotalEmCentavos: number;
  freteEmCentavos: number;
  totalEmCentavos: number;        // subtotal + frete
  quantidadeItens: number;        // soma das quantidades, não o número de linhas
}
```

```json
{
  "itens": [
    {
      "produtoId": "p1a2b3c4-0001-4000-8000-000000000001",
      "nome": "Banana Prata",
      "precoEmCentavos": 799,
      "urlImagem": "/produtos/banana-prata.jpg",
      "unidade": "KG",
      "quantidade": 3,
      "totalLinhaEmCentavos": 2397
    }
  ],
  "subtotalEmCentavos": 2397,
  "freteEmCentavos": 990,
  "totalEmCentavos": 3387,
  "quantidadeItens": 3
}
```

**Regras**
- `quantidade` mínima 1, máxima igual ao menor valor entre 20 e `produto.quantidadeEstoque`. Chegar em 0 remove a linha.
- Adicionar um produto que já está no carrinho **soma** à quantidade existente, respeitando o teto.
- O snapshot de nome/preço/imagem existe para o carrinho não quebrar se o produto for editado. O preço é **revalidado no checkout**; divergência mostra aviso antes do pagamento.
- Totais são sempre **derivados**, nunca digitados. `totalLinhaEmCentavos` e os totais do carrinho são recalculados a cada mutação por uma função pura testada.
- Frete na fase mockada é fixo: `990` (R$ 9,90), grátis acima de `15000` (R$ 150,00).

---

## 8. Endereço

```ts
export interface Endereco {
  cep: string;          // só dígitos, 8 caracteres
  logradouro: string;
  numero: string;       // string: aceita "s/n"
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;           // 2 letras maiúsculas
}
```

```json
{
  "cep": "01310100",
  "logradouro": "Avenida Paulista",
  "numero": "1000",
  "complemento": "Apto 52",
  "bairro": "Bela Vista",
  "cidade": "São Paulo",
  "uf": "SP"
}
```

---

## 9. Pedido

```ts
export interface ItemPedido {
  produtoId: string;
  nome: string;                   // congelado no momento da compra
  precoEmCentavos: number;        // congelado
  unidade: Unidade;
  quantidade: number;
  totalLinhaEmCentavos: number;
}

export interface Pedido {
  id: string;
  numero: string;                 // legível pelo cliente: "PED-2026-000123"
  status: StatusPedido;
  itens: ItemPedido[];
  subtotalEmCentavos: number;
  freteEmCentavos: number;
  totalEmCentavos: number;
  endereco: Endereco;
  /** Snapshot do comprador — o pedido não depende do usuário atual. */
  nomeComprador: string;
  documentoComprador: string;     // só dígitos
  emailComprador: string;
  criadoEm: string;
  pagoEm?: string;
}
```

```json
{
  "id": "o1a2b3c4-0001-4000-8000-000000000001",
  "numero": "PED-2026-000123",
  "status": "PAGO",
  "itens": [
    {
      "produtoId": "p1a2b3c4-0001-4000-8000-000000000001",
      "nome": "Banana Prata",
      "precoEmCentavos": 799,
      "unidade": "KG",
      "quantidade": 3,
      "totalLinhaEmCentavos": 2397
    }
  ],
  "subtotalEmCentavos": 2397,
  "freteEmCentavos": 990,
  "totalEmCentavos": 3387,
  "endereco": {
    "cep": "01310100",
    "logradouro": "Avenida Paulista",
    "numero": "1000",
    "bairro": "Bela Vista",
    "cidade": "São Paulo",
    "uf": "SP"
  },
  "nomeComprador": "Maria Souza",
  "documentoComprador": "11144477735",
  "emailComprador": "maria@exemplo.com",
  "criadoEm": "2026-08-20T14:30:00Z",
  "pagoEm": "2026-08-20T14:32:00Z"
}
```

**Regras**
- O pedido **congela** nome, preço e dados do comprador. Editar o produto ou o perfil depois não altera pedidos passados.
- Transições válidas: `PENDENTE` para `PAGO`, `PENDENTE` para `FALHOU`, `PENDENTE` para `CANCELADO`. Nenhuma outra.
- **A baixa de estoque acontece no backend somente quando o pagamento é aprovado**, na transição para `PAGO`. Enquanto o pedido está `PENDENTE`, o estoque não foi debitado — por isso o checkout revalida disponibilidade.
- `FALHOU` é recuperável: o cliente tenta pagar de novo sem perder o pedido.

---

## 10. Pagamento (simulado)

```ts
export interface RequisicaoPagamento {
  pedidoId: string;
  numeroCartao: string;     // só dígitos — trafega, nunca é persistido no front
  nomeTitular: string;
  validade: string;         // "MM/AA"
  cvv: string;
  parcelas: number;
}

export interface ResultadoPagamento {
  pedidoId: string;
  status: StatusPagamento;
  motivoRecusa?: string;    // presente somente quando o status é RECUSADO
  processadoEm: string;
}
```

```json
{
  "pedidoId": "o1a2b3c4-0001-4000-8000-000000000001",
  "status": "RECUSADO",
  "motivoRecusa": "Saldo insuficiente",
  "processadoEm": "2026-08-20T14:32:00Z"
}
```

**Regras de segurança — obrigatórias**
- **Nenhum dado de cartão é persistido no front**: nunca em store, `localStorage`, `sessionStorage`, cache de query ou log. Vive apenas no estado do formulário e é descartado no envio.
- Os campos de cartão não entram em nenhuma chave de cache do TanStack Query.
- O pagamento é simulado: o backend responde `APROVADO` ou `RECUSADO` sem gateway real. Não há tokenização — e é justamente por isso que o front não pode guardar nada.
- Regra do mock, para dar previsibilidade nos testes: cartão terminado em `0000` devolve `RECUSADO` com `"Saldo insuficiente"`; terminado em `1111` devolve `RECUSADO` com `"Cartão expirado"`; qualquer outro devolve `APROVADO`.

---

## 11. Movimentação de estoque

```ts
export interface MovimentacaoEstoque {
  id: string;
  produtoId: string;
  tipo: TipoMovimentacao;
  quantidade: number;              // sempre positiva; o tipo dá o sinal
  motivo: string;
  saldoAnterior: number;
  saldoPosterior: number;
  criadoPor: string;               // id do admin
  criadoEm: string;
}

export interface RequisicaoMovimentacaoEstoque {
  tipo: TipoMovimentacao;
  quantidade: number;
  motivo: string;
}
```

```json
{
  "id": "m1a2b3c4-0001-4000-8000-000000000001",
  "produtoId": "p1a2b3c4-0001-4000-8000-000000000001",
  "tipo": "ENTRADA",
  "quantidade": 50,
  "motivo": "Reposição semanal",
  "saldoAnterior": 70,
  "saldoPosterior": 120,
  "criadoPor": "u1a2b3c4-0003-4000-8000-000000000003",
  "criadoEm": "2026-08-18T09:12:00Z"
}
```

**Regras**
- `quantidade` é sempre positiva; `tipo` determina a direção.
- `SAIDA` maior que o saldo é rejeitada — estoque nunca fica negativo. O front bloqueia antes de enviar e o backend valida de novo.
- `motivo` é obrigatório, entre 3 e 200 caracteres.
- O histórico é imutável: correção se faz com uma movimentação contrária, nunca editando ou apagando.

---

## 12. Envelopes de API

### Paginação

Espelha o `Page` do Spring Data, com os nomes em português.

```ts
export interface Pagina<T> {
  conteudo: T[];
  pagina: number;          // índice base 0
  tamanho: number;
  totalElementos: number;
  totalPaginas: number;
  primeira: boolean;
  ultima: boolean;
}
```

```json
{
  "conteudo": [],
  "pagina": 0,
  "tamanho": 12,
  "totalElementos": 47,
  "totalPaginas": 4,
  "primeira": true,
  "ultima": false
}
```

### Erro

```ts
export interface ErroApi {
  status: number;
  mensagem: string;
  /** Erros por campo, para alimentar setError do React Hook Form. */
  errosPorCampo?: Record<string, string>;
  timestamp: string;
}
```

```json
{
  "status": 409,
  "mensagem": "Não foi possível concluir o cadastro.",
  "errosPorCampo": {
    "email": "Este e-mail já está cadastrado.",
    "documento": "Este documento já está cadastrado."
  },
  "timestamp": "2026-08-20T14:30:00Z"
}
```

**Regras**
- `mensagem` é sempre exibível ao usuário — sem stack trace, sem detalhe interno.
- `errosPorCampo` usa a chave **exata** do campo do formulário, para mapear direto em `setError`.
- 401 significa sessão expirada: limpa o store e redireciona. 403 significa sem permissão: vai para `/403`. A distinção é obrigatória (ver `docs/behavior.md`).
- Erro de credencial no login é **sempre genérico**: `"Credenciais inválidas."` — nunca revela se o identificador existe.

---

## 13. Parâmetros de consulta

```ts
export interface ParametrosCatalogo {
  categoria?: string;     // slug da categoria
  busca?: string;
  pagina?: number;        // base 0
  tamanho?: number;       // padrão 12
  ordenacao?: 'RELEVANCIA' | 'PRECO_ASC' | 'PRECO_DESC' | 'NOME_ASC';
}
```

Refletidos na query string do catálogo (`/?categoria=bebidas&pagina=1`), para a URL ser compartilhável e o botão voltar funcionar.

**Nunca** colocar documento, email ou qualquer dado pessoal em query string.

---

## 14. Dados de exemplo (fixtures)

Base das fixtures em `Front/src/mocks/fixtures/`. As mesmas usadas pelos testes.

### Categorias

| id (sufixo) | nome | slug | ordem | ativa |
|---|---|---|---|---|
| `0001` | Hortifrúti | `hortifruti` | 1 | sim |
| `0002` | Bebidas | `bebidas` | 2 | sim |
| `0003` | Padaria | `padaria` | 3 | sim |
| `0004` | Limpeza | `limpeza` | 4 | sim |
| `0005` | Mercearia | `mercearia` | 5 | sim |
| `0006` | Açougue | `acougue` | 6 | sim |

### Produtos (14)

| nome | categoria | preço (centavos) | unidade | estoque |
|---|---|---:|---|---:|
| Banana Prata | Hortifrúti | 799 | KG | 120 |
| Tomate Italiano | Hortifrúti | 1249 | KG | 64 |
| Alface Crespa | Hortifrúti | 349 | UN | 0 |
| Refrigerante Cola 2L | Bebidas | 899 | UN | 200 |
| Suco de Laranja 1L | Bebidas | 1190 | UN | 45 |
| Água Mineral 500ml | Bebidas | 250 | UN | 380 |
| Pão Francês | Padaria | 1899 | KG | 30 |
| Bolo de Cenoura | Padaria | 2450 | UN | 8 |
| Detergente Neutro 500ml | Limpeza | 349 | UN | 150 |
| Sabão em Pó 1kg | Limpeza | 2199 | PCT | 72 |
| Arroz Branco 5kg | Mercearia | 2790 | PCT | 95 |
| Feijão Carioca 1kg | Mercearia | 899 | PCT | 110 |
| Picanha Bovina | Açougue | 8990 | KG | 18 |
| Peito de Frango | Açougue | 1890 | KG | 55 |

`Alface Crespa` entra com estoque 0 de propósito: é a fixture do estado **indisponível**.

### Usuários

Documentos válidos por dígito verificador, para exercitar a validação de verdade.

| nome | email | documento | tipo derivado | senha | papéis |
|---|---|---|---|---|---|
| Maria Souza | `maria@exemplo.com` | `11144477735` | CPF | `senha123` | `["CLIENTE"]` |
| Mercado Bom Preço LTDA | `contato@bompreco.com` | `11222333000181` | CNPJ | `senha123` | `["CLIENTE"]` |
| Admin Osvaldo | `admin@coracaodagente.com` | `52998224725` | CPF | `admin123` | `["ADMIN"]` |

Permite logar pelas três formas desde a F2: por email, por CPF (11 dígitos) e por CNPJ (14 dígitos).

> As senhas só existem no mock. Nunca versionar credencial real.
