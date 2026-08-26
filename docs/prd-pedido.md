# PRD — Checkout e Pedido

> Fatia 1 de 2. A fatia 2 é `prd-pagamento.md` e depende desta.
> Contrato de dados: `docs/models.md`. Comportamento de tela: `docs/behavior.md`.

## 1. Objetivo

Transformar o carrinho aberto do cliente em um **pedido imutável**, e deixar que ele
acompanhe o status. O pedido nasce `PENDENTE` e não move estoque nenhum — quem move é
a fatia de pagamento.

## 2. Escopo

**Entra**

- Criar pedido a partir do carrinho aberto do cliente autenticado.
- Consultar um pedido pelo `id_publico`.
- Listar os pedidos do próprio cliente, paginado.

**Não entra, e por quê**

| Fora do escopo | Motivo |
|---|---|
| Reserva de estoque | `docs/models.md` §9: a baixa acontece na aprovação. Reserva seria um segundo caminho de escrita |
| Frete e endereço | Removidos do schema por decisão anterior |
| Cupom, desconto, parcelamento | Nenhum requisito pede |
| Cancelamento pelo cliente | Nenhum requisito pede. O único cancelamento é o da fatia 2 |
| Expiração automática do pedido | Exigiria job agendado. Pedido `PENDENTE` fica `PENDENTE` |
| Expiração do preço do carrinho | Ver D2. Carrinho velho honra preço velho, e isso é aceito |
| Edição de pedido | Pedido é imutável por definição |
| Telas e endpoints de admin | Outra feature |

## 3. Decisões tomadas

| # | Decisão | Motivo |
|---|---|---|
| D1 | O checkout **não trava** as linhas de produto | Sem reserva, o checkout não retira estoque. Travar o que não se altera é contenção sem benefício |
| D2 | O item do pedido copia o retrato **do item do carrinho** — nome, unidade, preço e total da linha | O cliente paga o que viu na tela. `tb_carrinho_itens` já guarda tudo isso, então a cópia é linha-a-linha e os produtos são lidos só para validar |
| D3 | O carrinho vira `CONVERTIDO` na mesma transação | O índice parcial `uk_carrinho_aberto_por_usuario` só olha `ABERTO`, então o cliente ganha carrinho novo de graça |
| D4 | Apenas três status: `PENDENTE`, `PAGO`, `CANCELADO` | `EXPIRADO` exigiria job. Cabem em `varchar(10)` |
| D5 | Idempotência é buscada pelo **par** `(usuario_id, chave_idempotencia)` | É exatamente a `uk_pedidos_idempotencia` do schema. A busca espelha a constraint |
| D6 | Replay idempotente devolve **201**, o mesmo status da criação original | Um código só para o front tratar |
| D7 | Pedido de outro dono responde **404**, não 403 | 403 confirmaria que o pedido existe |
| D8 | Sem header `Idempotency-Key`, o servidor gera um UUID | A coluna é `NOT NULL`. Gerar evita a violação sem custo |

### Nota sobre D2 — o que estamos aceitando

Honrar o preço do carrinho significa que um carrinho parado desde a semana passada é
cobrado pelo preço da semana passada. Para um mercado com remarcação frequente isso é
prejuízo real, e a solução de mercado é dar validade ao retrato (revalidar preços com
mais de N horas).

**Não faremos isso agora**: exigiria comparar preço antigo com atual, um erro novo e uma
tela de reconfirmação. Está registrado como limitação conhecida, não como esquecimento.

## 4. Máquina de estados

```
PENDENTE ──> PAGO        (fatia 2)
PENDENTE ──> CANCELADO   (fatia 2)
```

Nenhuma outra transição existe. `StatusPedido.podeIrPara` recusa o resto — a regra fica
no tipo, não espalhada em serviço.

## 5. Requisitos funcionais

| ID | Requisito | Prio |
|---|---|---|
| RF-PED-01 | Cliente autenticado cria pedido a partir do seu carrinho aberto | P0 |
| RF-PED-02 | Pedido nasce `PENDENTE`, com `total_em_centavos` igual à soma das linhas | P0 |
| RF-PED-03 | Cada item do pedido copia do item do carrinho: `nome`, `unidade`, `quantidade`, `preco_em_centavos`, `total_linha_em_centavos` | P0 |
| RF-PED-04 | O total do pedido é **idêntico** ao total exibido no carrinho no momento do checkout | P0 |
| RF-PED-05 | Pedido guarda retrato do comprador: `nome_comprador`, `email_comprador`, `login_comprador` | P0 |
| RF-PED-06 | Carrinho de origem vira `CONVERTIDO` e é referenciado em `carrinho_id` | P0 |
| RF-PED-07 | Checkout revalida cada item contra o produto: `ativo` e `quantidade_estoque >= quantidade` | P0 |
| RF-PED-08 | Falha de validação devolve **todos** os itens problemáticos, não o primeiro | P0 |
| RF-PED-09 | Carrinho inexistente ou vazio impede o checkout | P0 |
| RF-PED-10 | Mesmo par `(usuário, Idempotency-Key)` devolve o pedido já criado, sem criar outro | P0 |
| RF-PED-11 | Cliente consulta um pedido seu pelo `id_publico` | P0 |
| RF-PED-12 | Cliente lista os próprios pedidos, paginado, mais recentes primeiro | P1 |
| RF-PED-13 | Criação grava `PEDIDO_CRIADO` em `tb_outbox_eventos`, na mesma transação | P1 |

## 6. Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF-PED-01 | Todas as rotas exigem `hasRole("CLIENTE")` na cadeia de filtros. ADMIN recebe 403 |
| RNF-PED-02 | Nenhuma rota aceita id de carrinho ou de usuário no corpo ou no caminho. O dono sai do `sub` do token |
| RNF-PED-03 | Todo o checkout cabe em uma transação. Nenhuma chamada de rede dentro dela |
| RNF-PED-04 | Os produtos do carrinho são carregados em **uma** consulta, não uma por item |
| RNF-PED-05 | Resposta documentada no OpenAPI, com o esquema `bearer-jwt` já configurado |
| RNF-PED-06 | Erros no formato do `ExceptionMapper` existente: `mensagem` + `errosPorCampo` |

## 7. Contrato

### `POST /api/pedidos`

Sem corpo. Header opcional `Idempotency-Key`.

```
201  PedidoDtoOut       pedido criado — e também no replay idempotente (D6)
409                     carrinho ausente, vazio, ou item indisponível
401 / 403               sem token / token de ADMIN
```

### `GET /api/pedidos/{idPublico}`

```
200  PedidoDtoOut
404                     não existe, ou não é do solicitante
```

### `GET /api/pedidos?pagina=0&tamanho=10`

```
200  PaginaDtoOut<PedidoDtoOut>
```

### `PedidoDtoOut`

```json
{
  "id": "uuid",
  "status": "PENDENTE",
  "totalEmCentavos": 3995,
  "criadoEm": "2026-08-25T20:14:03Z",
  "pagoEm": null,
  "motivoRecusa": null,
  "itens": [
    {
      "produtoId": "uuid",
      "nome": "Banana Prata",
      "unidade": "KG",
      "quantidade": 2,
      "precoEmCentavos": 649,
      "totalLinhaEmCentavos": 1298
    }
  ]
}
```

Sem retrato do comprador na saída — quem consulta já é ele. As colunas existem para o
registro histórico, não para a resposta.

## 8. Fluxo do checkout

```
BEGIN
  1. busca pedido por (usuario_id, chave)   -> achou: devolve aquele, 201, fim
                                               (o par e a propria uk_pedidos_idempotencia)
  2. carrinho ABERTO do usuário             -> não tem: 409
  3. carrinho sem itens                     -> 409
  4. carrega os produtos das linhas, em uma consulta (sem lock — D1)
  5. valida TODOS: ativo, estoque suficiente
        -> acumula as falhas e devolve 409 com a lista completa
  6. cria tb_pedidos PENDENTE + retrato do comprador + chave de idempotência
  7. tb_carrinho_itens -> tb_pedido_itens, cópia linha-a-linha (D2)
  8. total_em_centavos = soma dos total_linha_em_centavos
  9. carrinho.status = CONVERTIDO, pedido.carrinho_id = carrinho.id
 10. tb_outbox_eventos: PEDIDO_CRIADO
COMMIT
```

O passo 4 lê o produto apenas para os passos de validação. **O preço vem da linha do
carrinho**, então o produto nem precisa entrar na montagem do item.

## 9. Erros

| Situação | HTTP | Corpo |
|---|---|---|
| Sem carrinho aberto | 409 | `"Você ainda não tem um carrinho."` |
| Carrinho vazio | 409 | `"Seu carrinho está vazio."` |
| Item indisponível | 409 | `mensagem` + lista com `produtoId`, `nome`, `solicitado`, `disponivel` |
| Pedido de outro dono | 404 | `"Pedido não encontrado."` |
| Token de ADMIN | 403 | — |

## 10. Testes obrigatórios

Sem banco, com mocks — conforme decisão registrada no `CLAUDE.md`.

| # | Prova |
|---|---|
| T1 | Carrinho vazio não vira pedido |
| T2 | Carrinho inexistente não vira pedido |
| T3 | Produto inativo bloqueia o checkout |
| T4 | Estoque insuficiente bloqueia, e o erro lista **todos** os itens com problema |
| T5 | `total_em_centavos` é igual à soma dos `total_linha_em_centavos` |
| T6 | O item do pedido copia nome, unidade e preço **do item do carrinho** |
| T7 | Preço do produto alterado depois da adição **não** altera o pedido — o valor cobrado é o do carrinho |
| T8 | Carrinho fica `CONVERTIDO` depois do checkout |
| T9 | Mesmo usuário com a mesma chave não cria segundo pedido |
| T10 | Chave repetida por **outro** usuário cria pedidos separados, cada um com o seu dono |
| T11 | Consulta de pedido de outro usuário não encontra |
| T12 | `StatusPedido.podeIrPara` recusa `PAGO -> PENDENTE` e `CANCELADO -> PAGO` |

T7 é o que prova a decisão D2. Sem ele, o PRD promete um preço que o código pode não
cumprir.

**Não coberto, e registrado no README:** os `CHECK` do banco, o índice parcial de carrinho
aberto e o `UNIQUE` da chave de idempotência. Consequência de não usar Testcontainers.

## 11. Código a produzir

Entidades e repositórios já existem. Cinco arquivos novos:

```
business/enums/StatusPedido.java          enum + podeIrPara
business/service/ServicoDePedido.java     criar, buscar, listar
controllers/PedidoController.java         três rotas
dtos/out/PedidoDtoOut.java                + método de(...)
dtos/out/PedidoItemDtoOut.java            + método de(...)
```

Mais uma linha em `ConfiguracaoDeSeguranca` para `/api/pedidos/**` exigir `CLIENTE`, e
um método derivado em `RepositorioDePedido`:

```java
Optional<Pedido> findByUsuarioIdAndChaveIdempotencia(Long usuarioId, String chave);
Page<Pedido> findByUsuarioKeycloakSubOrderByCriadoEmDesc(UUID sub, Pageable pagina);
```

Nenhuma migration. Duas observações sobre isso:

- `RF-PED-13` ordena por `criado_em` filtrando por usuário, e não existe índice
  `(usuario_id, criado_em)`. Irrelevante no volume desta prova; registrado para não
  parecer despercebido.
- `chave_idempotencia` já tem `UNIQUE (usuario_id, chave_idempotencia)` no schema.
  Basta a busca usar o mesmo par. Se um dia a restrição incomodar, é uma linha.

## 12. Definição de pronto

- [ ] Os doze testes passam
- [ ] `POST /api/pedidos` cria pedido a partir de carrinho real, pelo Swagger
- [ ] O total do pedido bate exatamente com o total que o carrinho mostrava
- [ ] Alterar o preço do produto entre a adição e o checkout não muda o valor cobrado
- [ ] Mesma chave repetida devolve o mesmo pedido, com 201
- [ ] Dois usuários com a mesma chave criam pedidos separados
- [ ] Estoque **não** muda depois do checkout
- [ ] Carrinho aparece como `CONVERTIDO` no banco e um novo pode ser aberto
- [ ] Pedido de outro usuário responde 404
- [ ] Backend sobe com o schema validado pelo Hibernate
