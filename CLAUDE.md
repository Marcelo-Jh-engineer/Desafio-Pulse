# Você no Coração da Gente — E-commerce de Supermercado

Monorepo com `Front/` (React) e `Back/` (Java 21 + Spring Boot 3).

**Estado atual.** O ciclo de compra fecha ponta a ponta: catálogo público, sessão via Keycloak, carrinho, pedido, pagamento assíncrono por fila e baixa de estoque na aprovação. O que ainda não existe no backend é **a escrita do admin** (produto e categoria) e o **Pix** — as telas estão lá, os endpoints não.

**Não há mock em lugar nenhum.** O MSW foi removido do projeto — o front fala com a API de verdade, sempre. O que a API não expõe simplesmente não funciona, em vez de funcionar contra um servidor imaginário.

---

## Documentos de contexto

Leia o que for relevante para a tarefa antes de escrever código:

| Arquivo | Quando ler |
|---|---|
| `docs/prd.md` | Escopo, requisitos (`RF-*`, `RNF-*`), fases, matriz RBAC |
| `docs/models.md` | Tipos, contratos de API, regras de negócio, fixtures |
| `docs/behavior.md` | Comportamento de cada tela, fluxos, estados, casos de borda |
| `docs/design.md` | Paleta, tokens, tipografia, componentes, mascote |
| `docs/backend.md` | Padrões da API: camadas, DTO, erro, transação, outbox, concorrência, testes |
| `docs/uso-de-ia.md` | Relatório do processo com IA. Não descreve o sistema; não precisa ser lido para codar |
| `README.md` | Visão da arquitetura, decisões, execução via Docker e exemplos de chamada |

Ao implementar uma feature, cite o requisito que ela cobre (`RF-CAT-03`, por exemplo).

---

## Stack obrigatória

### Front

- React · TypeScript (`strict`) · Vite
- React Router
- TanStack Query — estado de servidor e cache
- Zustand — estado global de cliente, quando necessário
- Tailwind CSS · shadcn/ui
- React Hook Form · Zod
- Axios ou fetch encapsulado
- ESLint · Prettier

### Backend

- Java 21 · Spring Boot 3.4 · Maven
- Spring Web · Data JPA · Validation · AMQP
- Spring Security como **OAuth2 Resource Server** (`spring-boot-starter-oauth2-resource-server`)
- Flyway · PostgreSQL 16 · RabbitMQ 3 · Keycloak 26
- springdoc-openapi (Swagger UI)
- Lombok — **só `@Getter`**, e só em entidade. Nada de `@Data`, `@Builder` ou `@Setter`: entidade com setter público perde o controle sobre a própria transição de estado
- JUnit 5 · Mockito · AssertJ. **Sem Testcontainers e sem H2** — decisão registrada

### Nenhuma biblioteca nova sem justificativa

Exceções já decididas e registradas:

| Decisão | Motivo |
|---|---|
| Leitura de JWT à mão em `lib/token.ts` | 60 linhas para decodificar a carga do token e ler os papéis. Nada aqui verifica assinatura — quem valida é o backend, a cada chamada. Dispensa `jwt-decode` |
| CPF e CNPJ validados à mão em `lib/documento.ts` | 40 linhas. Dispensa `cpf-cnpj-validator` |
| `qrcode` para o Pix | Codificação de QR é Reed-Solomon e máscara de matriz: escrever à mão seria centenas de linhas propensas a erro, para um resultado que ou funciona ou não. Entra só no pedaço da rota de pagamento |
| Sem máscara de documento | CPF e CNPJ são digitados **só com números**. O que a pessoa vê é o que o sistema guarda. Dispensa `react-imask` |
| Tailwind **v3.4**, não v4 | `docs/design.md` seção 4.2 especifica `tailwind.config.ts` com `theme.extend`, que é o formato da v3. A v4 move a configuração para dentro do CSS |
| `tailwindcss-animate` | Requisito do shadcn/ui para as animações de `dialog`, `sheet` e `accordion`. `devDependency` |
| `@radix-ui/react-slot`, `@radix-ui/react-separator` | Primitivas que o próprio shadcn/ui instala por baixo. Entram conforme o componente é adicionado |

Qualquer outra dependência precisa de justificativa explícita antes de entrar.

---

## Nomenclatura

**Domínio inteiro em português. Sem acento e sem cedilha nos identificadores.**

```ts
interface Produto {
  precoEmCentavos: number;
  quantidadeEstoque: number;
  categoria: Categoria;
}
type Papel = 'CLIENTE' | 'ADMIN';
```

| Elemento | Convenção |
|---|---|
| Tipos e componentes | `PascalCase` português — `Produto`, `CartaoProduto` |
| Campos e funções | `camelCase` português — `precoEmCentavos`, `validarCpf` |
| Valores de enum | `SCREAMING_SNAKE_CASE` — `PENDENTE`, `ENTRADA` |
| Arquivos | `kebab-case` português — `carrinho-store.ts`, `formatar-documento.ts` |
| Texto de UI | Português **com** acentuação normal |

### Exceções em inglês

Plataforma, não domínio:
- APIs de biblioteca: `useQuery`, `isLoading`, `data`, `onSubmit`, `register`, `props`, `children`
- Claims registradas do JWT pela RFC 7519: `sub`, `iat`, `exp`. As customizadas vão em português: `papeis`, `nome`, `email`
- **Prefixo `use` em hooks**: o prefixo é lido pelo `react-hooks/rules-of-hooks` e pelo compilador do React, então é plataforma, não escolha de estilo. O resto do nome continua em português — `useTituloDaPagina`, `useTema`, `useSessao`. Arquivo correspondente: `use-titulo-da-pagina.ts`

### O backend espelha estes nomes

O JSON do Spring Boot usa **exatamente** os mesmos nomes de campo. Não existe camada de tradução entre front e back. Alinhar isso cedo, não na Fase 6.

---

## Convenções de código

- TypeScript `strict`. Sem `any`. Sem asserção de tipo para contornar erro do compilador.
- Componentes funcionais, um componente por arquivo.
- Imports pelo alias `@/`.
- Props tipadas explicitamente; sem `React.FC`.
- Texto de UI nunca fica solto no meio da lógica.
- Comentário explica **por quê**, não **o quê**.

---

## Estrutura de pastas

```
Front/src/
  app/            # providers, router, layouts
  features/       # catalogo, autenticacao, carrinho, checkout, admin
  components/     # ui/ (shadcn) + compartilhados de dominio
  lib/            # http, jwt, documento, formato, utils
  types/          # tipos do dominio (espelham docs/models.md)
  hooks/          # hooks compartilhados
  test/           # setup e utilitarios de teste

Back/ecommerce/src/main/java/com/api/ecommerce/
  controllers/            # REST + tratamento de erro. Sem regra de negocio
  business/service/       # a regra. E aqui que vive @Transactional
  business/gateway/       # portas para fora (pagamento), com implementacao trocavel
  business/outbox/        # RegistradorDeEventos (grava), PublicadorDeEventos (envia)
  business/mensageria/    # consumidores @RabbitListener
  business/mapper/        # conversao entre camadas quando nao cabe no DTO
  config/                 # seguranca, Rabbit, Keycloak, cookie, OpenAPI
  dtos/in | dtos/out      # entrada e saida, sempre records
  infrastructure/         # entities, repositories, enums, exception, client
  utils/                  # funcao pura reusada por mais de um servico
  resources/db/migration  # Flyway
```

**Regra de acoplamento no front**: uma feature **nunca** importa de outra feature. O que for compartilhado sobe para `components/`, `lib/` ou `hooks/`.

**Regra de acoplamento no backend**: a seta aponta sempre para dentro — `controllers` chama `business`, que chama `infrastructure`. Nunca o contrário, e controller nunca fala com repositório.

---

## Arquitetura do front

| Regra | Detalhe |
|---|---|
| Estado de servidor | TanStack Query. **Nunca** copiar dado de servidor para o Zustand |
| Estado de cliente | Zustand apenas para sessão e carrinho local |
| Chaves de query | Centralizadas em um único módulo, nunca literais espalhados |
| Formulários | React Hook Form com resolver Zod. Sem exceção |
| HTTP | Todo acesso passa pelo cliente encapsulado. **Nunca** `fetch` ou `axios` direto no componente |
| Estado de URL | Filtro, busca, ordenação e página vivem na query string, não em estado de componente |
| Dinheiro | Sempre inteiro em centavos. **Nunca** ponto flutuante |
| Datas | String ISO 8601 no modelo; conversão só na view |

---

## Arquitetura do backend

Padrões já implementados. Feature nova segue estes; divergir exige justificativa
registrada aqui, como qualquer outra decisão.

### Camadas

| Camada | Responsabilidade | O que **não** faz |
|---|---|---|
| `controllers` | Recebe, valida o corpo, chama um serviço, devolve DTO. Documenta a rota com `@Operation` e `@ApiResponse` | Regra de negócio, acesso a repositório, `@Transactional` |
| `business/service` | A decisão do domínio. Dono da transação | Conhecer `HttpServletRequest`, `ResponseEntity` ou qualquer tipo de web |
| `infrastructure/repositories` | Spring Data JPA e as consultas | Decidir o que fazer com o resultado |

### DTO

- **Sempre `record`**, nunca classe com getter, nunca a entidade no JSON.
- `dtos/in` é entrada, com Bean Validation e mensagem em português voltada ao usuário
  final (`"Escolha a forma de pagamento."`). `dtos/out` é saída, com uma fábrica
  estática `de(entidade)` que concentra a conversão.
- Sufixo `DtoIn` / `DtoOut` no nome do arquivo; `@Schema(name = "Pedido")` dá o nome
  limpo que aparece no Swagger.
- Nada de `package-info.java` nem de camada de mapper por pacote — decisão registrada.

### Identidade e dono

- **`idPublico` (UUID) é o que sai no contrato.** O `id` `BIGINT` é interno e nunca
  aparece em URL, corpo ou log: id sequencial exposto é enumerável.
- **O dono vem sempre do token**, pelo `sub` — `@AuthenticationPrincipal Jwt` no
  controller, `UsuarioUtils.getUser(usuarios, sub)` no serviço. Id de usuário enviado
  pelo cliente não é aceito em lugar nenhum.
- **Recurso de outra pessoa responde 404**, nunca 403: 403 confirmaria que o id existe.

### Erro

- Exceções de domínio em `infrastructure/exception` — `ExcecaoDeNaoEncontrado` (404),
  `ExcecaoDeConflito` (409), `ExcecaoDeAutenticacao` (401) — traduzidas num único
  handler.
- O corpo é sempre `ErroDtoOut { status, mensagem, instante }`. Rastro de pilha e
  mensagem de framework não vazam para o cliente.
- Estado de negócio inválido é **409**, não 400: o corpo estava certo, o mundo é que
  não permite.

### Persistência

| Regra | Detalhe |
|---|---|
| Dono do schema | Flyway. `ddl-auto=validate` — o Hibernate só confere se o mapeamento bate |
| Migration aplicada | **Nunca** se edita: o banco já rodou. Corrige-se com uma nova |
| Dinheiro | `BIGINT` de centavos, `long` no Java. Nunca `NUMERIC`/`BigDecimal`, nunca ponto flutuante |
| Datas | `Instant`, serializado ISO 8601 |
| Regra de domínio | Em **método Java**, não em SQL, `@Formula` ou coluna gerada — o teste roda sem banco e precisa poder verificá-la |
| N+1 | `@EntityGraph` na consulta que vai percorrer a coleção. `open-in-view=false`, então lazy fora da transação estoura |
| Concorrência | `@Lock(PESSIMISTIC_WRITE)` no que vai ser debitado, e travar **em ordem de id** para não formar ciclo de espera |
| Estoque | Só baixa na aprovação do pagamento. É o único caminho de saída |

### Segurança

- A API é **Resource Server**: valida o JWT em toda requisição. Papéis saem de
  `realm_access.roles` e viram `ROLE_*`.
- Rota nova entra explicitamente em `ConfiguracaoDeSeguranca`: `GET` de catálogo é
  público, `/api/admin/**` é ADMIN, carrinho, pedido e pagamento são **CLIENTE**.
  Sem a linha, a rota cai em `anyRequest().authenticated()` e o ADMIN passa.
- O front nunca fala com o Keycloak: `/api/autenticacao/**` é proxy, e o
  `client-secret` fica no servidor.

### Mensageria

- **A API nunca publica direto no broker.** O serviço grava o evento em
  `tb_outbox_eventos` pelo `RegistradorDeEventos`, na mesma transação do fato.
- `PublicadorDeEventos` varre o pendente e só grava `publicado_em` depois do ack do
  broker.
- **Consumidor idempotente**: trava a linha, confere o estado e sai sem fazer nada se
  já estiver resolvida. O broker entrega ao menos uma vez.
- Topologia — exchange, fila, binding, DLQ — declarada em `ConfiguracaoDoRabbit`.
  Nada criado à mão no painel.
- Fila só existe com alguém publicando **e** alguém consumindo. Topologia "pronta para
  o futuro" foi removida uma vez; não volta.

### Testes

- Mockito, sem Spring e **sem banco**. Repositório dublado, entidade como objeto comum.
- `@DisplayName` em português dizendo o comportamento, não o nome do método.
- Cada teste prova uma decisão do serviço. O que só o banco garante — `CHECK`, índice
  parcial, a migration — fica fora, e a conferência é a subida da aplicação.

### Nomenclatura no Java

| Elemento | Forma |
|---|---|
| Serviço | `ServicoDePagamento` |
| Repositório | `RepositorioDePedido` |
| Controller | `PedidoController` |
| DTO | `PagamentoDtoIn`, `PedidoDtoOut` |
| Exceção | `ExcecaoDeConflito` |
| Configuração | `ConfiguracaoDoRabbit`, `CookieDeSessao` |
| Tabela | `tb_pedidos`, `tb_pedido_itens` |

Nome de arquivo **igual** ao nome da classe pública — divergir aborta o processamento
de anotações e faz o Lombok parecer quebrado, com erro que não aponta para a causa.

---

## RBAC

| Capacidade | VISITANTE | CLIENTE | ADMIN |
|---|:---:|:---:|:---:|
| Ver catálogo e produto | sim | sim | **não** |
| Carrinho e checkout | não | sim | não |
| Cadastrar produto, alterar preço, gerenciar categorias | não | não | sim |

**O ADMIN não navega a loja.** Ele não compra, e ver o catálogo como cliente
criaria a dúvida de qual visão está valendo. `RotaDeLoja` redireciona quem tem o
papel para `/admin/produtos`.

**Estoque não se edita à mão.** Ele baixa quando um pagamento é aprovado — esse
é o único caminho.

- `RotaProtegida` guarda rotas por papel.
- `<Permitir>` esconde ações dentro de uma tela já acessível.
- Papéis vêm do JWT, lido em `lib/token.ts`. Sempre do **token**, nunca do corpo da resposta.
- **401 e 403 são coisas diferentes**: sem sessão leva ao login; com sessão e sem o papel vai para `/403` **preservando** a sessão.

> **A checagem no front é UX, não segurança. A autorização real é sempre do backend.**

---

## Sessão

Recarregar a página **não** desloga. Isso já foi verdade e deixou de ser.

| Peça | Onde vive | Validade |
|---|---|---|
| Access token | Memória do front (Zustand) | 5 min |
| Refresh token | Cookie HttpOnly, `Path=/api/autenticacao` | 10 h |

O access token some no F5; o cookie não. Ao subir, o app chama
`POST /api/autenticacao/renovar` **sem corpo** — o navegador anexa o cookie
sozinho — e recebe uma sessão de volta ou um 401, que significa "siga como
visitante". Login só é pedido de novo quando o cookie expira ou o usuário sai.

Durante a navegação a troca é silenciosa e acontece por dois caminhos: um timer
que renova um minuto antes do vencimento, e o interceptor de 401 do
`lib/http.ts` como rede de segurança para quando o timer atrasa — o notebook que
dormiu, por exemplo.

- **O front nunca manda o refresh token.** Não tem como: o cookie é HttpOnly.
  `login`, `cadastro`, `renovar` e `sair` trabalham com ele sem que o
  JavaScript o veja.
- **O refresh gira a cada renovação** (`revokeRefreshToken` no realm). Duas
  renovações concorrentes derrubariam a sessão, então existe uma trava de
  renovação única em `lib/http.ts` e uma no boot, contra a montagem dupla do
  StrictMode.
- **Os guardas de rota esperam.** Enquanto `restaurando` está ligado,
  `RotaProtegida` e `RotaDeLoja` seguram a decisão: decidir com a sessão ainda
  vazia mandaria para o login quem tem sessão válida.
- **Só o servidor apaga o cookie.** Limpar o store no logout não bastaria — um
  F5 traria o usuário de volta logado.

---

## Dado sensível

- Documento (CPF ou CNPJ) digitado, armazenado e trafegado **só com dígitos**. Não há máscara em lugar nenhum.
- `login` e `email` são campos separados. O login é a credencial e pode ser CPF, CNPJ ou e-mail.
- **Não existe campo de tipo de pessoa.** O formato é inferido: contém `@` é e-mail, 11 dígitos é CPF, 14 é CNPJ.
- Documento **nunca** em URL, query string, log ou chave de cache (LGPD).
- Login exibido mascarado fora do perfil quando é documento.
- Nenhum dado de cartão persistido em store, storage, cache ou log. No comprovante, só os quatro últimos dígitos.
- **Access token em memória, nunca em `localStorage` nem em cookie legível.** Dura 5 minutos.
- **O refresh token não passa pelo JavaScript.** Ele vive num cookie HttpOnly de 10h que só o backend emite e apaga — `config/CookieDeSessao.java`. O front nunca o vê, nem para guardar, nem para enviar de volta.
- Redirecionamento pós-login aceita **apenas** caminho interno.

---

## Comandos

Rodar de dentro de `Front/`:

```
npm run dev             # servidor de desenvolvimento
npm run build           # verificacao de tipos + build de producao
npm run lint            # ESLint
npm run format          # Prettier
npm run format:check    # Prettier em modo verificacao
npm run verificar-tipos # tsc sem emitir
```

Antes de entregar no front: `verificar-tipos`, `lint`, `format:check`, `build` e
conferência manual na tela.

### Testes no backend

O front não tem testes automatizados — decisão registrada. **O backend tem**, a
partir do fluxo de carrinho.

**Sem banco nos testes — decisão registrada.** Nada de Testcontainers, nada de
H2. Os repositórios são dublados com Mockito e as entidades entram como objetos
comuns: o teste exercita a decisão do serviço, não o driver do PostgreSQL.

O que isso implica no desenho: **conta de domínio fica em método Java, não em
SQL.** O total do carrinho é `Carrinho.totalEmCentavos()`, e não um `@Formula`
do Hibernate — o `@Formula` só tem valor depois de um `SELECT`, e sem banco no
teste ele valeria zero, deixando o total sem como ser verificado.

O que fica fora de cobertura, e é bom saber: `CHECK`, índices parciais e a
própria migration. Eles continuam valendo em produção; quem os confere é a
subida da aplicação e a conferência manual.

Não há Maven na máquina; os testes rodam em container:

```
docker run --rm -v "<repo>/Back/ecommerce:/app" -w /app   -v pulse-m2:/root/.m2 maven:3.9-eclipse-temurin-21 mvn -B test
```

Variáveis de ambiente:

| Variável | Valores |
|---|---|
| `VITE_API_BASE_URL` | Base das chamadas do front. `/api`, mesma origem — o nginx da imagem, ou o proxy do Vite em desenvolvimento, encaminha para a API |

---

## O que não fazer

- Não adicionar biblioteca sem justificar, nos dois lados.
- Não usar ponto flutuante para dinheiro.
- Não usar nome de variável de domínio em inglês.
- Não codificar a lista de categorias no front — vem da API.
- Não copiar dado de servidor para o Zustand.
- Não persistir o access token, documento formatado ou dado de cartão.
- Não tratar 403 como 401.
- Não deixar o ADMIN entrar na loja.
- Não criar tela de movimentação de estoque.
- Não guardar token em `localStorage`, `sessionStorage` ou cookie legível por script. A sessão sobrevive ao F5 pelo cookie HttpOnly, e por nenhum outro caminho.
- Não remover indicador de foco.
- Não usar `dangerouslySetInnerHTML` com conteúdo da API. A única exceção é o SVG do QR code, gerado localmente a partir de uma string que o próprio front montou.

No backend, além disso:

- Não devolver entidade JPA no JSON — sempre um `DtoOut`.
- Não expor id numérico; o contrato usa `idPublico`.
- Não aceitar id de usuário vindo do cliente. O dono é o `sub` do token.
- Não colocar regra de negócio em SQL, `@Formula` ou coluna gerada.
- Não editar migration já aplicada — corrige-se com uma nova.
- Não publicar direto no broker: o evento passa pelo outbox.
- Não declarar fila sem quem publique e quem consuma.
- Não deixar rota nova fora de `ConfiguracaoDeSeguranca`, ou ela cai no
  `anyRequest().authenticated()` e o ADMIN passa.
- Não responder 403 para recurso de outro dono — é 404.
- Não usar `@Transactional` em controller.

---

## Identidade visual

Azul `#004E98` e turquesa `#73F1DD` são as cores reais da marca, extraídas da arte oficial. O mascote está em `docs/dentinho.png`.

A relação vem do próprio Dentinho — **turquesa preenche, azul contorna**:

- Botão primário: fundo `#004E98`, texto branco (8.3:1)
- Botão de ação: fundo `#73F1DD`, texto `#002D57` (10.2:1)
- **Texto branco sobre turquesa claro é proibido** — o turquesa da marca tem luminosidade 70%

A marca não vive só nos botões. Duas decisões espalham ela pela interface inteira:

- **Sem cinza puro.** A escala neutra é a `neutro`, tingida de marca — matiz de 200 nos tons claros a 209 nos escuros. Fundo, borda e texto de apoio já saem do lado do azul. Nada de `slate`.
- **Cabeçalho e rodapé são superfície de marca**: barra azul sólida, texto branco, turquesa marcando item ativo e foco. É a maior área de cor da tela. A classe `.superficie-marca` redefine `--ring` para turquesa ali, porque azul sobre azul some.

Detalhes, escalas e a tabela de contraste em `docs/design.md`.
