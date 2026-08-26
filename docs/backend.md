# Backend — padrões

Como a API é escrita. Cada regra aqui já vale no código de hoje; feature nova segue
estas, e divergir exige justificativa registrada.

Para o **porquê** das escolhas de infraestrutura — SGBD, autenticação, mensageria —
veja o `README.md`. Para o contrato de dados, `docs/models.md`. Este documento é sobre
como o código se organiza por dentro.

---

## 1. As camadas

```
controllers/          HTTP entra e sai. Nada decide aqui
  ↓
business/service/     A regra. Dono da transação
  ↓
infrastructure/       Entidades, repositórios, enums, exceções
```

A seta aponta sempre para dentro. Controller **nunca** fala com repositório, serviço
**nunca** conhece tipo de web.

| Pacote | O que vive lá |
|---|---|
| `controllers` | `@RestController`, validação de corpo, documentação OpenAPI, tradução de exceção |
| `business/service` | `ServicoDeCarrinho`, `ServicoDePedido`, `ServicoDePagamento`, `ServicoDeCatalogo`, `ServicoDeEstoque`, `ServicoDeUsuario`, `ServicoDeAutenticacao` |
| `business/gateway` | Portas para fora. `GatewayDePagamento` é interface; `GatewayFakeDePagamento` é a implementação de hoje |
| `business/outbox` | `RegistradorDeEventos` grava; `PublicadorDeEventos` envia |
| `business/mensageria` | Consumidores `@RabbitListener` |
| `config` | Segurança, Rabbit, Keycloak, cookie, OpenAPI |
| `dtos/in`, `dtos/out` | Contrato de entrada e de saída |
| `infrastructure/entities` | Entidades JPA, com o comportamento do domínio dentro |
| `infrastructure/repositories` | Spring Data JPA |
| `utils` | Função pura reusada por mais de um serviço |

**Regra de ouro da entidade**: ela não é saco de dados. `Pedido.marcarPago(...)`,
`Produto.baixarEstoque(...)`, `Pagamento.recusar(...)` — a transição de estado é
método da entidade, que recusa transição inválida. Por isso Lombok entra só com
`@Getter`: entidade com `@Setter` público perde o controle sobre o próprio estado.

---

## 2. O caminho de uma requisição

O controller faz quatro coisas e nenhuma a mais:

```java
@PostMapping("/itens")
public CarrinhoDtoOut adicionar(@AuthenticationPrincipal Jwt token,
                                @Valid @RequestBody ItemCarrinhoDtoIn requisicao) {

    return carrinho.adicionar(donoDaRequisicao(token),
                              requisicao.produtoId(), requisicao.quantidade());
}
```

1. Recebe o token e o corpo
2. Valida o corpo (`@Valid`, Bean Validation)
3. Chama **um** serviço
4. Devolve um `DtoOut`

Sem `try/catch`, sem `ResponseEntity` quando o status é 200, sem regra. Status
diferente de 200 sai por `@ResponseStatus` — `CREATED` no carrinho e no pedido,
`ACCEPTED` no pagamento.

O serviço é quem tem `@Transactional`, e é lá que a decisão acontece.

---

## 3. DTO

**Sempre `record`. A entidade nunca sai no JSON.**

```java
// dtos/in — entrada, com Bean Validation
public record ItemCarrinhoDtoIn(
        @NotNull(message = "Informe o produto.")
        UUID produtoId,

        @Min(value = 1, message = "A quantidade precisa ser pelo menos 1.")
        int quantidade) {
}
```

```java
// dtos/out — saída, com a fábrica que concentra a conversão
public record PagamentoDtoOut(String id, MetodoPagamento metodo, StatusPagamento status,
                              long valorEmCentavos, String motivoRecusa,
                              Instant criadoEm, Instant processadoEm) {

    public static PagamentoDtoOut de(Pagamento pagamento) { ... }
}
```

| Regra | Detalhe |
|---|---|
| Nome | `EntidadeDtoIn` / `EntidadeDtoOut`, e `@Schema(name = "Pagamento")` para o nome limpo no Swagger |
| Mensagem de validação | Em português, dirigida ao usuário final: *"Escolha a forma de pagamento."* |
| Conversão | Fábrica estática `de(...)` no próprio `DtoOut`. Nada de camada de mapper por pacote |
| Cerimônia | Sem `package-info.java`. Decisão registrada |

---

## 4. Identidade e autorização

**`idPublico` (UUID) é o que sai; o `id` `BIGINT` é interno.** Id sequencial exposto é
enumerável — dá para varrer a base contando de um em um.

**O dono vem sempre do token.** Nenhuma rota aceita id de usuário enviado pelo cliente.
O controller resolve o `sub` e garante o espelho local na mesma passada:

```java
private UUID donoDaRequisicao(Jwt token) {
    UsuarioDtoOut eu = usuarioMapper.paraDto(token);
    UUID sub = UUID.fromString(eu.id());

    // O espelho nasce na primeira acao que precisa de dono, e nao no login:
    // o login e proxy para o Keycloak e nao deve depender desta tabela.
    usuarios.sincronizar(sub, eu.nome(), eu.email(), eu.login());

    return sub;
}
```

Quem é dono da identidade é o Keycloak — senha, papéis e credencial vivem lá, e nada
disso é copiado. O espelho existe por um motivo só: carrinho e pedido precisam de uma
chave estrangeira estável, e `usuario_id` é `NOT NULL`.

No serviço, a busca desse espelho é uma só, compartilhada:

```java
Usuario dono = UsuarioUtils.getUser(usuarios, sub);
```

`sub` nulo e `sub` sem espelho caem na mesma resposta: nos dois casos a sessão não
identifica ninguém, e distinguir daria ao cliente uma pista sobre o que existe do
lado de cá.

**Recurso de outra pessoa responde 404, nunca 403.** A consulta já filtra por dono —
`findByIdPublicoAndUsuarioKeycloakSub` — e o que não aparece é tratado como
inexistente. 403 confirmaria que o id existe.

### Rotas e papéis

Rota nova entra **explicitamente** em `ConfiguracaoDeSeguranca`:

```java
.requestMatchers(HttpMethod.GET, "/api/produtos/**", "/api/categorias/**",
                                 "/api/catalogo/**").permitAll()
.requestMatchers("/api/admin/**").hasRole("ADMIN")
.requestMatchers("/api/carrinho/**", "/api/pedidos/**",
                 "/api/pagamentos/**").hasRole("CLIENTE")
.anyRequest().authenticated()
```

Sem a linha, a rota cai em `anyRequest().authenticated()` — e foi exatamente assim que
o ADMIN conseguiu criar carrinho uma vez, com o front escondendo o botão e a API
aceitando.

Papéis saem de `realm_access.roles` e viram `ROLE_*` no `JwtAuthenticationConverter`.

---

## 5. Erro

Três exceções de domínio, um handler, um formato:

| Exceção | Status | Quando |
|---|---|---|
| `ExcecaoDeAutenticacao` | 401 | Sem sessão, ou `sub` sem espelho local |
| `ExcecaoDeNaoEncontrado` | 404 | Não existe — ou existe e não é de quem pediu |
| `ExcecaoDeConflito` | 409 | Estado de negócio impede: estoque insuficiente, pedido já pago, carrinho vazio |

O corpo é sempre `ErroDtoOut { status, mensagem, errosPorCampo?, timestamp }`.
`mensagem` é exibível ao usuário; rastro de pilha e texto de framework não vazam.

**409 não é 400.** O corpo estava certo; o mundo é que não permite. Confundir os dois
faz o front tratar problema de estoque como erro de formulário.

Toda `Exception` não prevista vira 500 com mensagem genérica — e `NoResourceFoundException`
tem handler próprio de 404, senão rota inexistente responde 500.

---

## 6. Transação e outbox

**A transação é do serviço.** Uma requisição, uma transação, e tudo o que decorre do
fato commita junto com ele — inclusive o evento:

```java
@Transactional
public PagamentoDtoOut solicitar(UUID sub, UUID idPublicoDoPedido, MetodoPagamento metodo) {
    ...
    pagamentos.saveAndFlush(pagamento);

    // Na MESMA transação do fato. Se o commit voltar atrás, o evento volta com ele.
    eventos.registrar(AGREGADO_PAGAMENTO, pagamento.getId(),
            TipoDeEvento.PAGAMENTO_SOLICITADO,
            new PagamentoSolicitado(pagamento.getIdPublico().toString()));

    return PagamentoDtoOut.de(pagamento);
}
```

**O serviço nunca publica no broker.** Não existe `RabbitTemplate` em serviço nenhum:
quem publica é o `PublicadorDeEventos`, varrendo o outbox, fora da transação do
cliente. Broker fora do ar não derruba a requisição nem perde o evento.

---

## 7. Concorrência e estoque

**Lock pessimista, e em ordem de id.**

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT p FROM Produto p WHERE p.id = :id")
Optional<Produto> travarParaBaixa(@Param("id") Long id);
```

Os produtos de um pedido são travados **em ordem crescente de id**. Dois pedidos com
os mesmos itens em ordens diferentes travariam em ordens opostas e formariam ciclo —
cada transação segurando o que a outra espera. A ordem única desfaz o ciclo antes de
ele existir.

**O estoque tem um caminho só: a aprovação do pagamento.** Não baixa no checkout, não
baixa na solicitação, não há reserva e não há tela de movimentação. A disponibilidade
é revalidada dentro do lock, porque entre o checkout e a aprovação outra pessoa pode
ter levado a última unidade.

Última barreira, no banco: `uk_pagamento_aprovado_por_pedido`, índice único parcial
sobre `(pedido_id) WHERE status = 'APROVADO'`. Se a lógica falhar, o banco recusa a
segunda cobrança aprovada — e com ela a segunda baixa.

---

## 8. Persistência

| Regra | Detalhe |
|---|---|
| Dono do schema | Flyway. `spring.jpa.hibernate.ddl-auto=validate` |
| Migration aplicada | **Nunca** se edita. Corrige-se com uma nova |
| Nome de tabela | `tb_pedidos`, `tb_pedido_itens`, `tb_outbox_eventos` |
| Dinheiro | `BIGINT` de centavos ↔ `long`. Nunca `NUMERIC`/`BigDecimal`, nunca ponto flutuante |
| Data | `Instant`, serializado ISO 8601 (`write-dates-as-timestamps=false`) |
| N+1 | `@EntityGraph` na consulta que vai percorrer a coleção |
| Lazy | `spring.jpa.open-in-view=false` — acessar lazy fora da transação estoura, e é para estourar |

**Regra de domínio fica em método Java, não em SQL.** Nada de `@Formula`, coluna
gerada ou `VIEW` para cálculo de negócio. O total do carrinho é
`Carrinho.totalEmCentavos()`: com `@Formula` o valor só existiria depois de um
`SELECT`, e como o teste roda sem banco ele valeria zero, deixando a regra sem
verificação.

O que fica fora do alcance do teste, e é bom saber: `CHECK`, índice parcial e a
própria migration. Quem os confere é a subida da aplicação, que valida o schema, e a
conferência manual.

---

## 9. Mensageria

```
serviço → tb_outbox_eventos → PublicadorDeEventos → exchange → fila → consumidor
```

| Peça | Regra |
|---|---|
| Topologia | Declarada em `ConfiguracaoDoRabbit`. Nada criado à mão no painel: some no primeiro `docker compose down -v` |
| Exchange | `ecommerce.eventos`, topic, durável. Chave hierárquica: `pedido.criado`, `pagamento.solicitado` |
| DLX | `ecommerce.eventos.dlx`, fanout. Não decide nada — o que chega lá já falhou |
| Publicação | `@Scheduled` a cada 2 s; `publicado_em` só é gravado **depois do ack** (`publisher-confirm-type=correlated`) |
| Reentrega | 3 tentativas com backoff, e `default-requeue-rejected=false` manda para a DLQ. Sem as duas peças juntas, a mensagem gira para sempre e o problema fica invisível |
| Consumidor | **Idempotente**: trava a linha, confere o estado, e sai sem fazer nada se já estiver resolvida |

**Fila só existe com alguém publicando e alguém consumindo.** A topologia de
`pedidos.pagos` chegou a existir sem produtor nem consumidor e foi removida — fila
vazia no painel é ruído que parece defeito.

---

## 10. Testes

Mockito, sem Spring e **sem banco**. Repositório dublado, entidade como objeto comum.

```java
@ExtendWith(MockitoExtension.class)
@DisplayName("Servico de pagamento")
class ServicoDePagamentoTest {

    @Test
    @DisplayName("recusa nao toca o estoque e mantem o pedido PENDENTE")
    void recusaNaoMexeNoEstoque() { ... }
}
```

- `@DisplayName` em português dizendo **o comportamento**, não o nome do método
- Um teste, uma decisão do serviço
- O gateway é dublado, mas responde delegando ao fake de verdade: o teste continua
  determinístico e ainda dá para verificar que ele **não** foi chamado — que é o
  coração da prova de idempotência
- O `id` gerado pelo banco não existe sem banco; onde o serviço precisa dele, o teste
  preenche por reflexão. É o preço de não usar Testcontainers

Rodar:

```bash
docker run --rm -v "<repo>/Back/ecommerce:/app" -w /app \
  -v pulse-m2:/root/.m2 maven:3.9-eclipse-temurin-21 mvn -B test
```

---

## 11. Endpoint novo — a lista de conferência

1. **Rota em `ConfiguracaoDeSeguranca`**, com o papel certo. Sem isso ela cai no
   `anyRequest().authenticated()`
2. **`DtoIn` com Bean Validation**, se houver corpo; **`DtoOut` com fábrica `de(...)`**
3. **Serviço com `@Transactional`**; o controller só orquestra
4. **Dono pelo `sub`**, nunca por parâmetro. Recurso alheio responde 404
5. **`@Operation` e `@ApiResponse`** cobrindo 200/201/202, 400, 401, 403, 404 e 409 —
   é o que faz o Swagger valer como documentação
6. **Exceção de domínio**, não `ResponseStatusException` solta no serviço
7. **Teste com Mockito** para a decisão nova
8. **Migration nova** se o schema mudou. Nunca editar uma já aplicada
9. **`docs/models.md`** atualizado: o contrato e o mapa de rotas
10. Subir e conferir na mão — Swagger com token real, e a tela que consome
