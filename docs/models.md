# Modelos de Dados

Contrato de dados do frontend. Os tipos em `Front/src/types/` espelham este documento, e o backend Spring Boot expõe **exatamente estes nomes de campo** no JSON — não existe camada de tradução entre front e back.

> Ao alterar qualquer tipo aqui, atualize também `docs/behavior.md` (telas que consomem) e os DTOs do backend, que são quem serve estes dados. Não há mais mock no projeto.

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

/** Status do carrinho no servidor. */
export type StatusCarrinho = 'ABERTO' | 'CONVERTIDO' | 'ABANDONADO';

/**
 * Estado de uma tentativa de pagamento.
 *
 * `PENDENTE` e `AGUARDANDO` são esperas diferentes: a primeira espera o nosso
 * consumidor tirar a mensagem da fila, a segunda esperaria o cliente pagar o Pix
 * lá fora. Só `PENDENTE` acontece hoje.
 */
export type StatusPagamento = 'PENDENTE' | 'APROVADO' | 'RECUSADO' | 'AGUARDANDO';

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
  "descricao": "Frutas, legumes e verduras",
  "urlIcone": "/icones/hortifruti.svg",
  "ordem": 1,
  "ativa": true
}
```

**Regras**
- **Não há `slug`.** Categoria é identificada pelo `id` em todo lugar — filtro do catálogo, URL e formulário do admin. Slug era um segundo identificador para manter em sincronia sem ganho nenhum.
- Categoria com `ativa: false` some do filtro público, mas **não** apaga o vínculo dos produtos já cadastrados.
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
  nome: string;
  descricao: string;
  precoEmCentavos: number;
  unidade: Unidade;
  urlImagem: string;
  categoria: Categoria;      // aninhada na leitura
  quantidadeEstoque: number;
  ativo: boolean;
}
```

```json
{
  "id": "187f774c-4d3a-48ab-921e-e7fa7fdda55b",
  "nome": "Banana Prata",
  "descricao": "Banana prata selecionada, doce e madura. Vendida por quilo.",
  "precoEmCentavos": 799,
  "unidade": "KG",
  "urlImagem": "/api/produtos/187f774c-4d3a-48ab-921e-e7fa7fdda55b/imagem",
  "categoria": {
    "id": "c1a2b3c4-0001-4000-8000-000000000001",
    "nome": "Hortifrúti"
  },
  "quantidadeEstoque": 120,
  "ativo": true
}
```

### Escrita — só o id da categoria

```ts
export interface RequisicaoProduto {
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
- **Não há `slug` nem `sku`.** Os dois foram removidos do banco, da API e do front: `slug` era identificador duplicado, e `sku` era código interno que nenhuma tela do escopo usa. O produto é sempre `idPublico`.
- Na leitura, a categoria vem **resumida** — só `id` e `nome`. Descrição, ícone, ordem e situação são da tela de categorias, não do cartão de produto.
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
/**
 * O refresh token **não** está aqui: viaja num cookie HttpOnly que o JavaScript
 * não lê nem escreve. O front recebe só o access token.
 */
export interface RespostaAutenticacao {
  token: string;               // access token JWT, 5 minutos
  expiraEmSegundos: number;    // usado para agendar a renovação silenciosa
  usuario: Usuario;
}
```

```json
{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6...",
  "expiraEmSegundos": 300,
  "usuario": {
    "id": "8c84cae8-ca95-4250-a38b-6d9d3733e817",
    "nome": "Maria Souza",
    "email": "maria@exemplo.com",
    "login": "11144477735",
    "papeis": ["CLIENTE"]
  }
}
```

As quatro rotas de `/api/autenticacao` — `login`, `cadastro`, `renovar`, `sair` —
manipulam o cookie de sessão sem que o front o veja. `renovar` e `sair` vão **sem
corpo**: o navegador anexa o cookie sozinho.

### Conteúdo do token

**É um JWT de verdade**, emitido pelo Keycloak e conferido pelo backend a cada
requisição. O front decodifica a carga para montar a interface — `lib/token.ts`, 60
linhas — e **não verifica assinatura**: quem valida é o servidor.

```ts
export interface ConteudoDoToken {
  id: string;      // do `sub`
  nome: string;
  email: string;
  login: string;   // CPF, CNPJ (só dígitos) ou e-mail
  papeis: Papel[]; // de `realm_access.roles`
}
```

As claims registradas pela RFC 7519 (`sub`, `iat`, `exp`) ficam em inglês; as
customizadas são em português.

**Regras**
- **Os papéis saem do token, nunca do corpo da resposta.**
- Token quebrado vira sessão anônima, sem exceção não capturada.
- O que o front lê do token serve **só para montar a interface**. Toda requisição
  privilegiada é autorizada de novo pelo servidor.

---

### Sessão (estado de cliente)

```ts
export interface Sessao {
  token: string | null;
  usuario: Usuario | null;
  papeis: Papel[];
  autenticado: boolean;
  /**
   * Verdadeiro enquanto a tentativa de restaurar a sessão pelo cookie não
   * terminou. Sem isto os guardas de rota decidiriam com a sessão ainda vazia e
   * mandariam para o login quem tem sessão válida.
   */
  restaurando: boolean;
}
```

Vive no store Zustand, **em memória e não persistido**. O que sobrevive ao F5 é o
cookie de sessão, no navegador, e nada mais: ao subir, o app chama `renovar` e recebe
uma sessão de volta ou um 401, que significa "siga como visitante".

---

## 7. Carrinho

```ts
export interface ItemCarrinho {
  produtoId: string;
  /** Retrato do momento em que o item entrou no carrinho. */
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
- `quantidade` mínima 1. **Não há teto por linha**: o único limite é `produto.quantidadeEstoque`, conferido pelo servidor a cada adição. Chegar em 0 remove a linha.
- Adicionar um produto que já está no carrinho **soma** à quantidade existente, respeitando o teto.
- O retrato de nome, preço e unidade existe para o carrinho não mudar de valor sozinho se o produto for editado. O servidor marca `precoDivergiu` quando o catálogo andou, e a tela avisa antes do checkout.
- Totais são sempre **derivados**, nunca digitados. `totalLinhaEmCentavos` e os totais do carrinho são recalculados a cada mutação por uma função pura testada.
- **Não há frete.** O valor do carrinho é a soma das linhas, e nada mais. Cálculo de frete por CEP está fora de escopo (`docs/prd.md` seção 1.3), e cobrar um valor fixo só para ter um campo de frete seria inventar uma regra de negócio que ninguém pediu.
- `estoqueDisponivel` é o estoque do produto **agora**, relido a cada leitura do carrinho — não é reserva. Quem impõe o teto é o servidor, a cada adição; o campo existe para a tela avisar antes de o cliente tentar.

---

## 8. Endereço — fora do escopo

O tipo `Endereco` **não existe mais**, e nada no sistema o substitui. Foi retirado
do banco, da API e do front por decisão registrada: o enunciado não pede entrega, e
um endereço que ninguém usa é dado pessoal guardado à toa.

O pedido, por consequência, também não tem `numero` legível nem cópia dos dados do
comprador — ele aponta para o usuário, e é só.

---

## 9. Pedido

O pedido nasce do carrinho aberto do dono do token — `POST /api/pedidos`, **sem
corpo**. Aceitar uma lista de itens do cliente seria deixá-lo escolher o próprio
preço.

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
  status: StatusPedido;
  itens: ItemPedido[];
  totalEmCentavos: number;
  criadoEm: string;
  /** Preenchido apenas em pedido PAGO. */
  pagoEm: string | null;
  /** Preenchido apenas quando a compra terminou por recusa ou falta de estoque. */
  motivoRecusa: string | null;
}
```

```json
{
  "id": "7c3e5a10-2b44-4d8e-9f01-5a6b7c8d9e0f",
  "status": "PAGO",
  "totalEmCentavos": 1947,
  "criadoEm": "2026-08-26T14:05:33Z",
  "pagoEm": "2026-08-26T14:06:04Z",
  "motivoRecusa": null,
  "itens": [
    {
      "produtoId": "187f774c-4d3a-48ab-921e-e7fa7fdda55b",
      "nome": "Banana Prata",
      "precoEmCentavos": 649,
      "unidade": "KG",
      "quantidade": 3,
      "totalLinhaEmCentavos": 1947
    }
  ]
}
```

**Idempotência.** O cabeçalho `Idempotency-Key` identifica a tentativa de checkout:
repetir a mesma chave devolve o pedido já criado, em vez de cobrar duas vezes. Sem o
cabeçalho, o servidor gera a chave — o clique duplo do front continua protegido pela
unique `(usuario_id, chave_idempotencia)` no banco.

**Regras**
- O pedido **congela** nome, preço e unidade de cada linha. Editar o produto depois
  não altera pedido passado.
- Transições válidas: `PENDENTE` para `PAGO`, `FALHOU` ou `CANCELADO`. Nenhuma outra,
  e nada volta de `PAGO`.
- **`FALHOU` está previsto e hoje não é alcançado.** Recusa de cobrança deixa o pedido
  em `PENDENTE`, para o cliente tentar de novo; falta de estoque na aprovação leva a
  `CANCELADO`. A transição existe na entidade (`marcarFalhou`) e nenhum serviço a
  chama.
- **A baixa de estoque só acontece na aprovação do pagamento.** Enquanto o pedido está
  `PENDENTE` nada foi debitado, e não há reserva: por isso a disponibilidade é
  revalidada na hora de aprovar, e não no checkout.

---

## 10. Pagamento (assíncrono, gateway simulado)

`POST /api/pedidos/{idPublico}/pagamentos` responde **202 Accepted**: a cobrança foi
enfileirada, não decidida. A requisição grava a tentativa `PENDENTE` e o evento no
outbox na mesma transação, e volta.

```ts
/** O corpo é só a forma de pagamento. Nenhum dado de cartão entra na API. */
export interface RequisicaoPagamento {
  pedidoId: string;
  metodo: MetodoPagamento;
}

/** Tentativa de pagamento devolvida pela API. */
export interface Pagamento {
  id: string;
  metodo: MetodoPagamento;
  status: StatusPagamento;
  valorEmCentavos: number;        // igual ao total do pedido
  motivoRecusa: string | null;    // só quando RECUSADO
  criadoEm: string;
  /** Nulo enquanto a tentativa espera na fila. É o sinal de "continue consultando". */
  processadoEm: string | null;
}
```

**Como o cliente acompanha.** `GET /api/pedidos/{idPublico}/pagamentos` devolve as
tentativas daquele pedido, recentes primeiro. Enquanto `processadoEm` for `null`, a
mensagem ainda está na fila.

São várias tentativas de propósito: uma recusa não apaga o pedido, e o histórico é o
que permite a tela dizer "a cobrança de ontem foi recusada por saldo" em vez de apenas
"não pago".

**Regra do gateway simulado** — determinística, decidida pelo **último dígito do total
em centavos**:

| Total termina em | Desfecho |
|---|---|
| `3` | `RECUSADO` — "Saldo insuficiente" |
| `8` | `RECUSADO` — "Cartão bloqueado" |
| qualquer outro | `APROVADO` |

Um gateway que sorteasse deixaria todo teste instável e a demonstração impossível de
repetir.

**Nenhum dado de cartão existe em lugar nenhum.** Não há número, titular, validade,
CVV, parcela nem "quatro últimos dígitos" — nem no corpo da requisição, nem na tabela,
nem no comprovante. O que não é coletado não precisa ser protegido.

**Pix não tem backend.** `MetodoPagamento` aceita `'PIX'` e o status `AGUARDANDO`
existe no schema, mas só `CARTAO` percorre o fluxo. `CobrancaPix` continua nos tipos
do front, sem endpoint que a produza.

---

## 11. Alteração de preço

> **Sem backend.** A tela existe no front; não há endpoint de escrita do admin.
> `/api/admin/**` está reservado na configuração de segurança e vazio. O contrato
> abaixo é o que a rota deve receber quando existir.

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
  "tamanho": 10,
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
  categoria?: string;     // id público da categoria (UUID)
  busca?: string;
  pagina?: number;        // base 0
  tamanho?: number;       // padrão 10, máximo 60
}
```

Refletidos na query string do catálogo (`/?busca=banana&pagina=1`), para a URL ser
compartilhável e o botão voltar funcionar.

**Duas rotas, um tipo.** `busca` não existe na API: quando há termo, o serviço do
front chama `GET /api/catalogo/busca?nome=...`; sem termo, chama
`GET /api/produtos`. As duas aceitam `categoria`, `pagina` e `tamanho`, e as duas
devolvem `Pagina<Produto>` — a tela não sabe da diferença.

| Parâmetro | Onde vale | Regra do servidor |
|---|---|---|
| `nome` | só `/api/catalogo/busca` | Trecho do nome; não diferencia maiúscula, minúscula nem acento |
| `categoria` | as duas | UUID do `idPublico`, não slug |
| `pagina` | as duas | Base 0. Valor negativo vira 0 |
| `tamanho` | as duas | Padrão 10, teto **60** no catálogo e **50** na lista de pedidos. Acima do teto, o servidor corta |

Não há escolha de ordenação: a ordem é fixa, decidida pelo servidor.

**Nunca** colocar documento, email ou qualquer dado pessoal em query string.

---

## 14. Dados de exemplo (fixtures)

Carga inicial do banco, em `Back/ecommerce/src/main/resources/db/migration/V6__seed_catalogo.sql`. O catálogo real tem 52 produtos; a tabela abaixo é o núcleo que veio de `docs/models.md` e continua lá.

### Categorias

| nome | ordem | ativa |
|---|---|---|
| Hortifrúti | 1 | sim |
| Bebidas | 2 | sim |
| Padaria | 3 | sim |
| Limpeza | 4 | sim |
| Mercearia | 5 | sim |
| Açougue | 6 | sim |

> Os ids são gerados na inserção (`gen_random_uuid()`), então não são fixos entre
> bancos. Para filtrar por categoria, pegue o `id` em `GET /api/categorias`.

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

Dois, um de cada papel, criados pelo Keycloak na subida. Os documentos são válidos
por dígito verificador, para a validação ser exercitada de verdade.

| nome | login | e-mail | senha | papéis |
|---|---|---|---|---|
| Maria Souza | `11144477735` (CPF) | `maria@exemplo.com` | `senha123` | `["CLIENTE"]` |
| Admin Osvaldo | `admin@coracaodagente.com` (e-mail) | `admin@coracaodagente.com` | `admin123` | `["ADMIN"]` |

Os dois formatos de login ficam exercitados desde o início. Qualquer um dos dois
entra pelo `login` **ou** pelo e-mail — o servidor procura nos dois campos.

> Estes dois usuários são criados na importação do realm — `docker/keycloak/realm-ecommerce.json`. São credenciais de desenvolvimento; nunca versionar credencial real.

---

## 15. Rotas da API, e o tipo de cada uma

O que existe hoje. Rota que não está aqui não existe.

| Método e rota | Papel | Corpo | Resposta |
|---|---|---|---|
| `GET /api/produtos` | público | — | `Pagina<Produto>` |
| `GET /api/produtos/{id}` | público | — | `Produto` |
| `GET /api/produtos/{id}/imagem` | público | — | bytes da imagem |
| `GET /api/categorias` | público | — | `Categoria[]` |
| `GET /api/catalogo/busca` | público | — | `Pagina<Produto>` |
| `POST /api/autenticacao/login` | público | `RequisicaoLogin` | `RespostaAutenticacao` + cookie |
| `POST /api/autenticacao/cadastro` | público | `RequisicaoCadastro` | `RespostaAutenticacao` + cookie |
| `POST /api/autenticacao/renovar` | público | **sem corpo** | `RespostaAutenticacao` ou 401 |
| `POST /api/autenticacao/sair` | público | **sem corpo** | 204, cookie apagado |
| `GET /api/me` | autenticado | — | `Usuario` |
| `POST /api/carrinho` | CLIENTE | `ItemParaOCarrinho` | `Carrinho` (201) |
| `POST /api/carrinho/itens` | CLIENTE | `ItemParaOCarrinho` | `Carrinho` |
| `DELETE /api/carrinho/itens/{produtoId}?quantidade=` | CLIENTE | — | `Carrinho` |
| `GET /api/carrinho` | CLIENTE | — | `Carrinho` |
| `POST /api/pedidos` | CLIENTE | **sem corpo**, `Idempotency-Key` opcional | `Pedido` (201) |
| `GET /api/pedidos/{id}` | CLIENTE | — | `Pedido` |
| `GET /api/pedidos` | CLIENTE | — | `Pagina<Pedido>` |
| `POST /api/pedidos/{id}/pagamentos` | CLIENTE | `{ metodo }` | `Pagamento` (**202**) |
| `GET /api/pedidos/{id}/pagamentos` | CLIENTE | — | `Pagamento[]`, recentes primeiro |

**O que o front chama e não existe**: `POST /api/carrinho/validacao` e
`POST /api/pagamentos/pix/confirmacao`. A conferência de divergência acontece hoje na
leitura do carrinho (`precoDivergiu`, `estoqueDisponivel`) e na criação do pedido.
