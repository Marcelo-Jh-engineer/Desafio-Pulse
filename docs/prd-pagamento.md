# PRD — Pagamento Assíncrono com RabbitMQ e Outbox

> Fatia 2 de 2. Depende de `prd-pedido.md`, que entrega o pedido `PENDENTE`.
> Contrato de dados: `docs/models.md`.

## 1. Objetivo

Levar um pedido `PENDENTE` a um desfecho — `PAGO` ou `CANCELADO` — através de um gateway
simulado, processado por **mensageria**, e debitar o estoque somente quando o pagamento é
aprovado.

O evento nunca é publicado direto pela API. Ele nasce em `tb_outbox_eventos`, na mesma
transação do fato, e um publicador o leva até o broker.

## 2. Escopo

**Entra**

- Solicitar o pagamento de um pedido `PENDENTE`. A API responde na hora.
- Registro do evento no outbox, na transação do fato.
- Publicador agendado: outbox → RabbitMQ, com confirmação do broker.
- Consumidor de `pagamentos.solicitados`: gateway, estoque, desfecho.
- Consumidor de `pedidos.pagos`: simula o envio do comprovante.
- Dead letter queue para mensagem que falha repetidamente.
- Consulta das tentativas de pagamento de um pedido.

**Não entra, e por quê**

| Fora do escopo | Motivo |
|---|---|
| Front-end | Decisão de escopo: backend primeiro. O polling entra numa fatia seguinte |
| Worker de resgate para pagamentos órfãos | Decisão explícita. Ver a limitação assumida em D12 |
| PIX e boleto | Exigiriam `AGUARDANDO` e webhook. `metodo` é `varchar(6)`, cabem depois sem migration |
| Status `ESTORNADO` | Com gateway fake não há dinheiro. Falta de estoque vira recusa |
| Envio real de e-mail | O consumidor de `pedidos.pagos` registra em log estruturado |
| Expiração de cobrança | `expira_em` permanece nulo nesta fatia |
| Parcelamento, antifraude | Nenhum requisito pede |

## 3. Decisões tomadas

| # | Decisão | Motivo |
|---|---|---|
| D1 | **A API nunca publica no broker.** Grava o evento no outbox, na mesma transação do pagamento | Gravar no banco e publicar no Rabbit são duas escritas em sistemas diferentes, sem transação entre elas. É a escrita dupla clássica |
| D2 | O publicador é um `@Scheduled` que lê `publicado_em IS NULL` com `FOR UPDATE SKIP LOCKED` | Duas instâncias da API varrendo o outbox publicariam o mesmo evento duas vezes |
| D3 | `publicado_em` só é gravado **após confirmação do broker** (`publisher-confirm-type`) | Sem confirmação existe uma janela em que o evento é dado como publicado e o broker nunca o recebeu. Como não há resgate (D12), essa é a última proteção |
| D4 | A mensagem carrega **apenas a referência**, nunca o estado | O consumidor relê do banco, que é a fonte da verdade. Evita mensagem desatualizada e mantém dado pessoal fora do broker |
| D5 | **O consumidor é idempotente**, e isso não é opcional | RabbitMQ entrega ao menos uma vez. Sem essa defesa, uma reentrega debita o estoque duas vezes |
| D6 | A API responde **202**, sem esperar o consumidor | Pagamento real é assíncrono. Segurar a requisição até o gateway responder é o comportamento irreal |
| D7 | Só `CARTAO` | Entrega `pendente → aprovado/recusado` sem webhook nem job de expiração |
| D8 | **Nenhum dado de cartão trafega ou é gravado.** O gateway decide por `valor_em_centavos` | O cartão não sobreviveria até o consumidor sem ser persistido, e persistir está proibido |
| D9 | Recusa deixa o pedido **`PENDENTE`** | Cliente solicita de novo. É também o caminho de menos código: nenhuma transição extra |
| D10 | Estoque insuficiente na aprovação vira **recusa** com motivo, e cancela o pedido | Evita o status `ESTORNADO`. Com gateway fake é honesto |
| D11 | `tb_pedidos.motivo_recusa` = motivo do **cancelamento do pedido**. `tb_pagamentos.motivo_recusa` = motivo **daquela tentativa** | São fatos diferentes. Sem essa separação escrita, as duas colunas discordam um dia |
| D12 | Sem worker de resgate. A **DLQ é o sinal operacional** | Ver a limitação abaixo |

### Limitação assumida em D12

Uma mensagem que esgota as tentativas vai para a DLQ. Ninguém a traz de volta
automaticamente, então **o pagamento fica `PENDENTE` indefinidamente** e o cliente nunca
recebe um desfecho.

Em produção isso exigiria alarme na profundidade da DLQ e reprocessamento manual. Aqui é
decisão consciente: a DLQ existe para o problema ficar **visível** em vez de virar um loop
silencioso de reentrega.

O que reduz a chance de chegar lá: D3 fecha a perda entre publicador e broker, D5 torna
reentrega inofensiva, e a fila é durável com mensagem persistente.

## 4. Topologia

```
exchange  ecommerce.eventos            (topic, durable)

  routing key  pagamento.solicitado  ->  fila  pagamentos.solicitados
  routing key  pedido.pago           ->  fila  pedidos.pagos

exchange  ecommerce.eventos.dlx        (fanout, durable)

  ->  pagamentos.solicitados.dlq
  ->  pedidos.pagos.dlq
```

Cada fila de trabalho declara `x-dead-letter-exchange: ecommerce.eventos.dlx`.
Todas duráveis; mensagens persistentes.

O `tipo` do outbox mapeia para a routing key por um enum, não por concatenação de string:

```java
public enum TipoDeEvento {
    PAGAMENTO_SOLICITADO("pagamento.solicitado"),
    PEDIDO_PAGO("pedido.pago");
}
```

## 5. Máquina de estados

```
Pagamento:  PENDENTE ──> APROVADO
            PENDENTE ──> RECUSADO

Pedido:     PENDENTE ──> PAGO        pagamento APROVADO e estoque debitado
            PENDENTE ──> CANCELADO   faltou estoque na aprovação (D10)
            PENDENTE ──> PENDENTE    pagamento RECUSADO (D9)
```

## 6. O fluxo

### 6.1 Solicitação — síncrona

```
POST /api/pedidos/{idPublico}/pagamentos   { "metodo": "CARTAO" }

BEGIN
  pedido é do solicitante?          -> senão 404
  pedido está PENDENTE?             -> senão 409
  já existe pagamento PENDENTE?     -> devolve aquele, 202 (não enfileira duas vezes)
  já existe pagamento APROVADO?     -> 409
  cria tb_pagamentos: PENDENTE, CARTAO, valor = pedido.total, processado_em = NULL
  grava tb_outbox_eventos:
      agregado    = 'PAGAMENTO'
      agregado_id = pagamento.id
      tipo        = 'PAGAMENTO_SOLICITADO'
      conteudo    = { "pagamentoId": "<id_publico>" }        <- só a referência (D4)
COMMIT

202  PagamentoDtoOut  { status: "PENDENTE", processadoEm: null }
```

### 6.2 Publicador — do outbox para o broker

```
@Scheduled(fixedDelay = 2s)
BEGIN
  SELECT * FROM tb_outbox_eventos
   WHERE publicado_em IS NULL
   ORDER BY criado_em
   LIMIT 50
     FOR UPDATE SKIP LOCKED

  para cada evento:
     publica em ecommerce.eventos com a routing key do tipo
     aguarda a confirmação do broker                          (D3)
     confirmou -> publicado_em = now()
     falhou    -> tentativas += 1, ultimo_erro = <mensagem>
COMMIT
```

Broker fora do ar não perde nada: as linhas continuam com `publicado_em` nulo e o próximo
ciclo tenta de novo. É a razão de ser do outbox.

### 6.3 Consumidor de `pagamentos.solicitados`

```
@RabbitListener(queues = "pagamentos.solicitados")
BEGIN
  carrega o pagamento pelo id_publico, FOR UPDATE
  não existe            -> ack e ignora (evento órfão)
  status != PENDENTE    -> ack e ignora — JÁ FOI PROCESSADO (D5)

  resultado = gateway.processar(valor_em_centavos)

  se RECUSADO:
     pagamento: RECUSADO, motivo_recusa, processado_em = now()
     pedido continua PENDENTE

  se APROVADO:
     carrega os itens do pedido
     SELECT ... FOR UPDATE nos produtos, ORDER BY produto_id
     revalida estoque de todos
        faltou -> pagamento RECUSADO ("Estoque insuficiente para <produto>")
                  pedido CANCELADO + motivo_recusa
        ok     -> debita quantidade_estoque
                  pagamento APROVADO, processado_em = now()
                  pedido PAGO, pago_em = now()
                  grava outbox: PEDIDO_PAGO { "pedidoId": "<id_publico>" }
COMMIT
```

Dois pontos que não podem sair daqui:

- **O `FOR UPDATE` no pagamento serializa reentregas simultâneas.** A segunda espera, relê
  `APROVADO` e desiste. Sem ele, duas entregas concorrentes passariam as duas pela
  checagem de status antes de qualquer uma gravar.
- **O `ORDER BY produto_id` evita deadlock.** Dois pedidos com os mesmos produtos em ordens
  diferentes travam em ordens opostas e formam ciclo.

### 6.4 Consumidor de `pedidos.pagos`

```
@RabbitListener(queues = "pedidos.pagos")
carrega o pedido pelo id_publico
log estruturado: comprovante do pedido X enviado para <email_comprador>
```

Simula a notificação. Reentrega gera log duplicado, o que é inofensivo — um notificador
real precisaria de tabela de deduplicação, e isso está registrado como pendência.

## 7. Regra do gateway fake

Decide pelo **último dígito de `valor_em_centavos`**. Documentar no README:

| Último dígito do total | Resultado | Motivo |
|---|---|---|
| `3` | recusado | Saldo insuficiente |
| `7` | recusado | Cartão bloqueado |
| qualquer outro | aprovado | — |

Determinístico: o mesmo valor dá sempre o mesmo desfecho, então o teste não fica instável.
Para demonstrar uma recusa, monte um carrinho cujo total termine em 3 ou 7 — por exemplo,
7 unidades de Detergente a R$ 2,89 dão R$ 20,23.

```java
public record ResultadoDoPagamento(boolean aprovado, String motivo) { }
```

## 8. Requisitos funcionais

| ID | Requisito | Prio |
|---|---|---|
| RF-PAG-01 | Cliente solicita o pagamento de um pedido seu que esteja `PENDENTE` | P0 |
| RF-PAG-02 | A API responde **202** sem esperar o processamento | P0 |
| RF-PAG-03 | Pagamento nasce `PENDENTE`, valor igual ao total do pedido, `processado_em` nulo | P0 |
| RF-PAG-04 | O evento é gravado no outbox **na mesma transação** do pagamento | P0 |
| RF-PAG-05 | A API não publica no broker em nenhuma circunstância | P0 |
| RF-PAG-06 | Solicitar de novo com um pagamento já `PENDENTE` devolve o mesmo, sem novo evento | P0 |
| RF-PAG-07 | Pedido que já tem pagamento `APROVADO` recusa nova solicitação | P0 |
| RF-PAG-08 | O publicador lê o outbox com `FOR UPDATE SKIP LOCKED` | P0 |
| RF-PAG-09 | `publicado_em` só é gravado após confirmação do broker | P0 |
| RF-PAG-10 | Falha na publicação incrementa `tentativas` e grava `ultimo_erro`, sem marcar publicado | P0 |
| RF-PAG-11 | O consumidor ignora, com ack, mensagem cujo pagamento já saiu de `PENDENTE` | P0 |
| RF-PAG-12 | O gateway é simulado e **determinístico** — nunca aleatório | P0 |
| RF-PAG-13 | Aprovação debita `quantidade_estoque` de cada produto do pedido | P0 |
| RF-PAG-14 | A baixa usa lock pessimista, com os produtos ordenados por id | P0 |
| RF-PAG-15 | Aprovação move o pedido para `PAGO`, grava `pago_em` e enfileira `PEDIDO_PAGO` | P0 |
| RF-PAG-16 | Recusa grava `motivo_recusa` no pagamento e mantém o pedido `PENDENTE` | P0 |
| RF-PAG-17 | Estoque insuficiente na aprovação recusa o pagamento e cancela o pedido | P0 |
| RF-PAG-18 | Mensagem que esgota as tentativas vai para a DLQ, sem reentrega infinita | P0 |
| RF-PAG-19 | Cliente lista as tentativas de pagamento de um pedido seu, mais recentes primeiro | P0 |
| RF-PAG-20 | Nenhum dado de cartão é aceito, gravado, logado ou devolvido | P0 |
| RF-PAG-21 | O consumidor de `pedidos.pagos` registra o comprovante em log estruturado | P1 |

## 9. Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF-PAG-01 | Rotas exigem `hasRole("CLIENTE")` |
| RNF-PAG-02 | Consumidores rodam sem contexto de segurança — agem sobre a mensagem, não sobre um usuário |
| RNF-PAG-03 | Duas instâncias da aplicação nunca publicam o mesmo evento |
| RNF-PAG-04 | Filas e exchanges duráveis; mensagens persistentes |
| RNF-PAG-05 | Broker fora do ar não perde evento nem derruba a API |
| RNF-PAG-06 | Nenhum dado pessoal viaja no corpo da mensagem (D4) |
| RNF-PAG-07 | `CHECK (quantidade_estoque >= 0)` permanece como última barreira |
| RNF-PAG-08 | O gateway é acessado por interface, para o fake ser substituível sem tocar o serviço |
| RNF-PAG-09 | `docker compose up` sobe o RabbitMQ e o backend só inicia com o broker saudável |

## 10. Contrato

### `POST /api/pedidos/{idPublico}/pagamentos`

```json
{ "metodo": "CARTAO" }
```

```
202  PagamentoDtoOut    enfileirado — status PENDENTE
404                     pedido não existe ou não é do solicitante
409                     pedido não está PENDENTE, ou já tem pagamento aprovado
400                     método ausente ou inválido
```

### `GET /api/pedidos/{idPublico}/pagamentos`

```
200  List<PagamentoDtoOut>   mais recentes primeiro
404                          pedido não existe ou não é do solicitante
```

### `PagamentoDtoOut`

```json
{
  "id": "uuid",
  "metodo": "CARTAO",
  "status": "RECUSADO",
  "valorEmCentavos": 2023,
  "motivoRecusa": "Saldo insuficiente",
  "criadoEm": "2026-08-25T20:16:31Z",
  "processadoEm": "2026-08-25T20:16:33Z"
}
```

`processadoEm` nulo significa que o consumidor ainda não pegou — é o sinal para o cliente
continuar consultando.

## 11. Infraestrutura

### Migration `V10__pagamento_assincrono.sql`

```sql
-- Um pagamento nasce PENDENTE e so e processado depois. Com NOT NULL DEFAULT now()
-- toda linha nascia "processada", e o consumidor nao teria como distinguir.
ALTER TABLE tb_pagamentos
    ALTER COLUMN processado_em DROP NOT NULL,
    ALTER COLUMN processado_em DROP DEFAULT;

-- O publicador varre so o que falta publicar. Indice parcial mantem o scan pequeno
-- mesmo quando o outbox cresce com todo o historico de eventos.
CREATE INDEX IF NOT EXISTS ix_outbox_pendentes
    ON tb_outbox_eventos (criado_em) WHERE publicado_em IS NULL;
```

**Antes de rodar, confira o que já existe:**

```sql
SELECT indexdef FROM pg_indexes WHERE indexname = 'uk_pagamento_aprovado_por_pedido';
```

Se ele **não** for `UNIQUE ... WHERE status = 'APROVADO'`, acrescente à migration:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS uk_pagamento_unico_aprovado
    ON tb_pagamentos (pedido_id) WHERE status = 'APROVADO';
```

### `docker-compose.yml`

```yaml
  broker:
    image: rabbitmq:3-management-alpine
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASS}
    ports: ['15672:15672']          # painel, para demonstrar filas e DLQ
    healthcheck:
      test: ['CMD', 'rabbitmq-diagnostics', '-q', 'ping']
      interval: 10s
      timeout: 5s
      retries: 12
      start_period: 30s
```

O backend ganha `depends_on: broker: { condition: service_healthy }`. Credenciais no
`.env`, nunca no compose — elas ficariam visíveis em `docker history`.

### `application.properties`

```properties
spring.rabbitmq.host=${RABBITMQ_HOST:localhost}
spring.rabbitmq.username=${RABBITMQ_USER}
spring.rabbitmq.password=${RABBITMQ_PASS}
spring.rabbitmq.publisher-confirm-type=correlated

spring.rabbitmq.listener.simple.acknowledge-mode=auto
spring.rabbitmq.listener.simple.default-requeue-rejected=false
spring.rabbitmq.listener.simple.retry.enabled=true
spring.rabbitmq.listener.simple.retry.max-attempts=3
spring.rabbitmq.listener.simple.retry.initial-interval=1s
spring.rabbitmq.listener.simple.retry.multiplier=2
```

`default-requeue-rejected=false` é o que faz a mensagem ir para a DLQ depois das
tentativas, em vez de voltar para a fila e girar para sempre.

## 12. Erros

| Situação | HTTP | Corpo |
|---|---|---|
| Pedido de outro dono | 404 | `"Pedido não encontrado."` |
| Pedido já `PAGO` | 409 | `"Este pedido já foi pago."` |
| Pedido `CANCELADO` | 409 | `"Este pedido foi cancelado."` |
| Já existe pagamento pendente | 202 | devolve o pagamento existente |
| Método ausente ou desconhecido | 400 | `errosPorCampo` |
| Broker fora do ar | 202 | a solicitação funciona; o evento espera no outbox |

A última linha é o teste que prova o outbox: **a API continua respondendo com o RabbitMQ
desligado.**

## 13. Testes obrigatórios

Sem banco e sem broker — os consumidores são métodos comuns, chamados direto com mocks.

| # | Prova |
|---|---|
| T1 | O gateway devolve sempre o mesmo resultado para o mesmo valor |
| T2 | Total terminado em 3 e em 7 é recusado, com motivos diferentes |
| T3 | Solicitar pagamento grava o pagamento **e** o evento, com o tipo e o payload corretos |
| T4 | O payload do evento contém só a referência, nenhum dado do comprador |
| T5 | Solicitar com um pagamento já pendente não cria segunda linha nem segundo evento |
| T6 | Pedido já pago recusa nova solicitação |
| T7 | Publicação falhando **não** marca `publicado_em`, e incrementa `tentativas` |
| T8 | Publicação confirmada marca `publicado_em` |
| T9 | Consumidor ignora, sem processar, pagamento que já saiu de `PENDENTE` |
| T10 | Consumidor ignora mensagem cujo pagamento não existe |
| T11 | Aprovação debita o estoque exatamente na quantidade do pedido |
| T12 | Recusa **não** toca o estoque |
| T13 | Recusa mantém o pedido `PENDENTE` |
| T14 | Aprovação move o pedido para `PAGO` e grava o evento `PEDIDO_PAGO` |
| T15 | Estoque insuficiente na aprovação recusa e cancela o pedido |
| T16 | Nova solicitação após recusa cria uma segunda linha de pagamento |
| T17 | Consulta de tentativas de pedido alheio não encontra |
| T18 | `StatusPagamento.podeIrPara` recusa `APROVADO -> PENDENTE` |

T9 é o mais importante da lista: é ele que prova a idempotência do consumidor, sem a qual
uma reentrega vende duas vezes o mesmo estoque.

**Não coberto, e registrado no README:** o `SKIP LOCKED`, o lock pessimista, a ordenação
que evita deadlock, os `CHECK`, os índices parciais, e o roteamento real do RabbitMQ
(exchange, binding, DLQ). A conferência é manual, pelo painel em `:15672`.

## 14. Código a produzir

```
business/enums/StatusPagamento.java              PENDENTE, APROVADO, RECUSADO + podeIrPara
business/enums/MetodoPagamento.java              CARTAO
business/enums/TipoDeEvento.java                 nome + routing key
business/gateway/GatewayDePagamento.java         interface — a porta
business/gateway/GatewayFakeDePagamento.java     a regra do último dígito
business/gateway/ResultadoDoPagamento.java       record de duas posições
business/outbox/RegistradorDeEventos.java        grava o evento na transação do fato
business/outbox/PublicadorDeEventos.java         @Scheduled + SKIP LOCKED + confirms
business/mensageria/ConsumidorDePagamento.java   @RabbitListener pagamentos.solicitados
business/mensageria/ConsumidorDePedidoPago.java  @RabbitListener pedidos.pagos
business/service/ServicoDePagamento.java         solicitar, aprovar, recusar
config/ConfiguracaoDoRabbit.java                 exchange, filas, bindings, DLX, converter
controllers/PagamentoController.java             duas rotas
dtos/in/PagamentoDtoIn.java                      um campo: metodo
dtos/out/PagamentoDtoOut.java                    + método de(...)
dtos/eventos/PagamentoSolicitado.java            record — só o id
dtos/eventos/PedidoPago.java                     record — só o id
resources/db/migration/V10__pagamento_assincrono.sql
```

Mais, fora desses arquivos:

- `spring-boot-starter-amqp` no `pom.xml`.
- `@EnableScheduling` na aplicação.
- `.requestMatchers("/api/pedidos/**").hasRole("CLIENTE")` — já prevista na fatia 1.
- O serviço `broker` no compose e as variáveis no `.env` / `.env.example`.
- A consulta do publicador em `RepositorioDeEventoOutbox`:

```java
@Query(value = """
    SELECT * FROM tb_outbox_eventos
     WHERE publicado_em IS NULL
     ORDER BY criado_em
     LIMIT :limite
     FOR UPDATE SKIP LOCKED
    """, nativeQuery = true)
List<EventoOutbox> pendentesParaPublicar(int limite);
```

## 15. Definição de pronto

- [ ] Os dezoito testes passam
- [ ] `docker compose up` sobe cinco contêineres saudáveis, incluindo o broker
- [ ] Painel em `:15672` mostra as duas filas de trabalho e as duas DLQ
- [ ] Pelo Swagger: pedido `PENDENTE` → `POST /pagamentos` → 202 com status `PENDENTE`
- [ ] Em segundos, `GET /pedidos/{id}` mostra `PAGO` e o estoque desceu no banco
- [ ] `tb_outbox_eventos` tem `PAGAMENTO_SOLICITADO` e `PEDIDO_PAGO`, ambos com `publicado_em` preenchido
- [ ] Carrinho com total terminado em 3 → `RECUSADO`, estoque intacto, pedido segue `PENDENTE`
- [ ] Segunda solicitação após a recusa cria a segunda linha em `tb_pagamentos`
- [ ] **Com o broker parado**, `POST /pagamentos` continua devolvendo 202 e o evento fica no outbox com `publicado_em` nulo
- [ ] Ao religar o broker, o evento é publicado e processado sem intervenção
- [ ] Reentregar a mesma mensagem à mão não debita o estoque uma segunda vez
- [ ] `grep -ri "cartao\|cartão"` nos DTOs e entidades não acha nada
- [ ] Backend sobe com o schema validado pelo Hibernate
