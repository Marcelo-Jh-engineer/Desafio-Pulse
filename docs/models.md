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

/** Desfecho do pagamento simulado. */
export type StatusPagamento = 'APROVADO' | 'RECUSADO' | 'AGUARDANDO';

/** Forma de pagamento escolhida no checkout. */
export type MetodoPagamento = 'CARTAO' | 'PIX';
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
  nome: string;        // nome completo
  email: string;
  login: string;       // CPF, CNPJ (só dígitos) ou e-mail
  papeis: Papel[];
  criadoEm: string;
}
```

```json
{
  "id": "u-0001",
  "nome": "Maria Souza",
  "email": "maria@exemplo.com",
  "login": "11144477735",
  "papeis": ["CLIENTE"],
  "criadoEm": "2026-07-15T08:30:00Z"
}
```

**Regras**
- `login` e `email` são **campos separados**. O login é a credencial de acesso e pode ser um documento; mesmo quando é e-mail, não precisa ser o mesmo endereço de contato.
- Quando o login é documento, guarda **só dígitos** — sem ponto, barra ou hífen. É assim que o usuário digita e é assim que fica guardado; não há máscara em lugar nenhum (LGPD, RNF-SEC-03).
- **Não existe campo de tipo de pessoa.** O formato é inferido com `detectarTipoIdentificador()`: contém `@` é e-mail, 11 dígitos é CPF, 14 é CNPJ. Nunca persistido.
- `email` e `login` são únicos, e um não pode colidir com o outro — quem entra digita um valor só, e o servidor procura nos dois campos.
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

#### `detectarTipoDocumento(valor: string): TipoDocumento | undefined`

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

Cinco campos, nada além disso.

```ts
export interface RequisicaoCadastro {
  login: string;   // CPF, CNPJ (só dígitos) ou e-mail
  email: string;
  nome: string;
  senha: string;
}
```

| Campo | Regra |
|---|---|
| Login | CPF, CNPJ ou e-mail. Documento **apenas com números** — sem ponto, barra ou hífen. Dígito verificador validado |
| E-mail | Formato válido, minúsculas, único |
| Nome completo | 3 a 120 caracteres |
| Senha | Mínimo de 6 caracteres |
| Confirmação de senha | Igual à senha — **só no front**, nunca enviada |

`confirmacaoSenha` existe **apenas no schema do formulário**, para o `refine` do Zod.

---

### Resposta de autenticação

```ts
export interface RespostaAutenticacao {
  token: string;       // JWT de acesso
  expiraEm: string;    // ISO 8601 — conveniência; a verdade é a claim exp
  usuario: Usuario;
}
```

### Conteúdo do token

**Não é um JWT.** É uma string base64 com o que a interface precisa para se
montar. Sem header, sem assinatura e sem expiração — nada disso teria contraparte
sem servidor. Ver `lib/token-simulado.ts` e `docs/prd.md` seção 7.6.

```ts
export interface ConteudoDoToken {
  id: string;
  nome: string;
  email: string;
  papeis: Papel[];
}
```

**Regras**
- **Os papéis saem do token, nunca do corpo da resposta.** É o token que o backend vai conferir na F6, quando virar JWT de verdade.
- Token quebrado vira sessão anônima, sem exceção não capturada.
- Isso é seguro porque o front usa o conteúdo **só para montar a interface**. Toda requisição privilegiada é autorizada de novo pelo servidor.

---

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
  slug: string;
  nome: string;
  precoEmCentavos: number;
  urlImagem: string;
  unidade: Unidade;
  quantidade: number;
  totalLinhaEmCentavos: number;   // precoEmCentavos * quantidade
  estoqueDisponivel: number;      // snapshot do estoque, ver regras
}

export interface Carrinho {
  itens: ItemCarrinho[];
  totalEmCentavos: number;        // soma das linhas
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
  "totalEmCentavos": 2397,
  "quantidadeItens": 3
}
```

**Regras**
- `quantidade` mínima 1, máxima igual ao menor valor entre 20 e `produto.quantidadeEstoque`. Chegar em 0 remove a linha.
- Adicionar um produto que já está no carrinho **soma** à quantidade existente, respeitando o teto.
- O snapshot de nome/preço/imagem existe para o carrinho não quebrar se o produto for editado. O preço é **revalidado no checkout**; divergência mostra aviso antes do pagamento.
- Totais são sempre **derivados**, nunca digitados. `totalLinhaEmCentavos` e os totais do carrinho são recalculados a cada mutação por uma função pura testada.
- **Não há frete.** O valor do carrinho é a soma das linhas, e nada mais. Cálculo de frete por CEP está fora de escopo (`docs/prd.md` seção 1.3), e cobrar um valor fixo só para ter um campo de frete seria inventar uma regra de negócio que ninguém pediu.
- `slug` entra no snapshot para a linha do carrinho conseguir linkar de volta para a página do produto sem uma segunda requisição.
- `estoqueDisponivel` é o estoque no momento em que o item entrou. Enquanto o carrinho vive no cliente (F3 a F5), é o único jeito de o teto de quantidade continuar valendo dentro da tela do carrinho. **Na F6 quem impõe o teto é o backend**, e o campo vira redundância informativa — a decisão passa a ser do servidor.

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
  totalEmCentavos: number;
  endereco: Endereco;
  /** Snapshot do comprador — o pedido não depende do usuário atual. */
  nomeComprador: string;
  emailComprador: string;
  loginComprador: string;         // mascarado na exibição quando é documento
  criadoEm: string;
  pagoEm?: string;
  pagamento?: ResumoPagamento;    // preenchido na aprovação; alimenta o comprovante
  motivoRecusa?: string;
}

/** O que o comprovante mostra sobre a forma de pagamento. */
export interface ResumoPagamento {
  metodo: MetodoPagamento;
  finalDoCartao?: string;         // só em cartão; o número completo nunca é guardado
  parcelas?: number;
  valorParcelaEmCentavos?: number;
  pagoEm: string;
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
  "totalEmCentavos": 2397,
  "endereco": {
    "cep": "01310100",
    "logradouro": "Avenida Paulista",
    "numero": "1000",
    "bairro": "Bela Vista",
    "cidade": "São Paulo",
    "uf": "SP"
  },
  "nomeComprador": "Maria Souza",
  "emailComprador": "maria@exemplo.com",
  "loginComprador": "11144477735",
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

Duas formas, um contrato só: as duas terminam num `ResultadoPagamento`.

```ts
export type MetodoPagamento = 'CARTAO' | 'PIX';

export interface PagamentoComCartao {
  metodo: 'CARTAO';
  pedidoId: string;
  numeroCartao: string;     // só dígitos — trafega, nunca é persistido no front
  nomeTitular: string;
  validade: string;         // "MM/AA"
  cvv: string;
  parcelas: number;         // 1, 2, 3, 6 ou 12
}

/** Pix não tem dado sensível: só a intenção de gerar a cobrança. */
export interface PagamentoComPix {
  metodo: 'PIX';
  pedidoId: string;
}

export type RequisicaoPagamento = PagamentoComCartao | PagamentoComPix;

export interface CobrancaPix {
  pedidoId: string;
  codigoCopiaECola: string;      // o que o app do banco aceita
  expiraEm: string;              // ISO 8601
  validadeEmSegundos: number;    // 300
}

export interface ResultadoPagamento {
  pedidoId: string;
  status: StatusPagamento;       // APROVADO | RECUSADO | AGUARDANDO
  motivoRecusa?: string;         // só quando RECUSADO
  cobrancaPix?: CobrancaPix;     // só quando AGUARDANDO
  processadoEm: string;
}
```

**Por que existe `AGUARDANDO`**

Cartão resolve na mesma requisição: aprova ou recusa. Pix não — a cobrança nasce
na hora, mas quem paga é o aplicativo do banco, depois. Sem um terceiro estado, o
Pix teria que mentir que foi aprovado ou que foi recusado.

**Regras de segurança — obrigatórias**
- **Nenhum dado de cartão é persistido no front**: nunca em store, `localStorage`, `sessionStorage`, cache de query ou log. Vive apenas no estado do formulário e é descartado no envio.
- O pagamento é **mutation**, jamais query: query indexa o cache pelos argumentos, e os argumentos aqui são dados de cartão.
- No comprovante aparecem só os quatro últimos dígitos. O número completo não é guardado em lugar nenhum.
- Não há tokenização, porque não há gateway — e é justamente por isso que o front não pode guardar nada.

**Regra do mock, para dar previsibilidade**

| Situação | Resultado |
|---|---|
| Cartão terminado em `0000` | `RECUSADO` — "Saldo insuficiente" |
| Cartão terminado em `1111` | `RECUSADO` — "Cartão expirado" |
| Qualquer outro cartão | `APROVADO` |
| Pix confirmado dentro dos 5 minutos | `APROVADO` |
| Pix confirmado depois dos 5 minutos | `RECUSADO` — "O prazo do Pix expirou" |

**A chave Pix é fictícia.** O `codigoCopiaECola` segue o formato do padrão, e o QR
é um QR de verdade, mas não existe recebedor do outro lado.

---

## 11. Alteração de preço

O administrador ajusta preço; **estoque não se edita à mão**.

```ts
export interface RequisicaoAlteracaoDePreco {
  precoEmCentavos: number;   // inteiro positivo
}
```

**Regras**
- O preço é sempre inteiro em centavos. O formulário aceita "19,90" e converte para `1990` antes de enviar.
- **O estoque tem um caminho só: a venda.** Ele baixa quando um pagamento é aprovado, na transição do pedido para `PAGO`. Não há entrada, saída nem ajuste manual — e por isso também não há histórico de movimentação.
- Alterar o preço **não** altera pedidos já feitos: o pedido congela nome e preço no momento da compra (seção 9). O que muda é o catálogo daqui para frente, e o checkout avisa quem tiver o preço antigo no carrinho (RF-CHK-08).

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

Dois, um de cada papel. Os documentos são válidos por dígito verificador, para a
validação ser exercitada de verdade.

| nome | login | e-mail | senha | papéis |
|---|---|---|---|---|
| Maria Souza | `11144477735` (CPF) | `maria@exemplo.com` | `senha123` | `["CLIENTE"]` |
| Admin Osvaldo | `admin@coracaodagente.com` (e-mail) | `admin@coracaodagente.com` | `admin123` | `["ADMIN"]` |

Os dois formatos de login ficam exercitados desde o início. Qualquer um dos dois
entra pelo `login` **ou** pelo e-mail — o servidor procura nos dois campos.

> As senhas só existem no mock. Nunca versionar credencial real.
