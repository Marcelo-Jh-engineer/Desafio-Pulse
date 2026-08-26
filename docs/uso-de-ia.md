# Uso de IA no desenvolvimento

Relatório do processo, exigido pelo item 3.2 do enunciado. Cobre o projeto inteiro:
do PRD à API em produção local, entre **20 e 26 de agosto de 2026**, em 34 commits.

**Como estes números foram levantados:** as contagens de sessão, modelo e mensagem
vêm das transcrições que o Claude Code grava em
`~/.claude/projects/`; as de código, do `git log` deste repositório. Não são
estimativas de memória.

---

## 1. LLM utilizada

| Item | Valor |
|---|---|
| Modelo | **Claude Opus 5** (`claude-opus-5`) |
| Fornecedor | Anthropic |
| Período de uso | 20/08/2026 a 26/08/2026 |
| Sessões | 12  |
| Requisições ao modelo | 2.909 |
| Mensagens minhas | 294 |

Um único modelo, do início ao fim. Não houve troca de LLM entre fases..

---

## 2. Ferramentas e ambiente

| Ferramenta | Papel |
|---|---|
| **Claude Code** | Onde tudo aconteceu. Agente com acesso a leitura, escrita, busca e shell no repositório |
| **Extensão do VS Code** | Interface. O agente lê o arquivo aberto e a seleção do editor, o que encurtou muito prompt: em vez de descrever onde estava o problema, eu selecionava o trecho |
| **PowerShell 5.1 e Git Bash** | Os dois shells da máquina. Windows 11 |
| **Docker Desktop** | Postgres, Keycloak, RabbitMQ, API e SPA. Também os testes do backend, que rodam num container Maven porque não há Maven instalado aqui |
| **Swagger UI** | Conferência manual de cada endpoint depois de pronto, com token real |


---

## 3. Skills, extensões e MCPs

### Skills instaladas no projeto

Ficam em `.claude/skills/` — fora do versionamento, porque são instaladas por
máquina e não descrevem o sistema.

| Skill | Papel real no projeto |
|---|---|
| **product-manager-toolkit** | Usada na largada, para transformar o PDF do desafio em `docs/prd.md` com requisitos numerados (`RF-*`, `RNF-*`) e fases. Os requisitos numerados foram o que permitiu, depois, cobrar do agente "qual requisito esta feature cobre" |
| **ui-ux-pro-max** | Base de `docs/design.md`: paleta, escala tipográfica, tokens, contraste. A partir dela nasceu a decisão de tingir a escala neutra com a cor da marca em vez de usar cinza puro |
| **java-pro** | Carregada na virada para o backend, na fatia de pagamento assíncrono. Serviu de checklist de Java 21 e Spring Boot 3 |
| **run** (embutida no Claude Code) | Subir a aplicação de verdade e interagir com ela, em vez de confiar na suíte de testes. Foi assim que apareceram erros que nenhum teste pegaria — tela de login do Keycloak sem tema, container que sobe e cai |

### Plan mode

Antes das duas features grandes — pedido e pagamento — pedi o plano antes do código.
O plano da feature de pagamento ficou gravado em `.claude/plans/` e foi revisado por
mim linha a linha antes de qualquer arquivo ser escrito. Foi nessa revisão que cortei
o Pix do escopo e fixei que o corpo do `POST /api/pedidos` seria ignorado.

Boa parte do valor do plan mode não foi o plano em si, mas o que ele **não** deixou
acontecer: duas vezes o plano propôs coisa que eu não queria (reserva de estoque,
tabela de movimentação) e o custo de recusar foi um parágrafo, não um `git revert`.

### MCPs

Nenhum MCP participou do desenvolvimento. O ambiente tem um MCP do Supabase
conectado à conta, mas o banco deste projeto é um Postgres local no Docker Compose, e
ele nunca foi acionado. Registro aqui porque ele aparece na lista de ferramentas do
ambiente e a ausência de uso é a informação relevante.

### Configuração local

`.claude/settings.local.json` guarda apenas uma lista de permissões pré-aprovadas
para comandos repetitivos (`npm run *`). Não usei hooks nem subagentes.

---

## 4. Prompts e estratégia

### A estratégia, em uma frase

Documento primeiro, código depois — e o documento entra no contexto de toda sessão.

Quatro arquivos em `docs/` (`prd.md`, `models.md`, `behavior.md`, `design.md`) mais
o `CLAUDE.md` na raiz formam o contexto permanente. O `CLAUDE.md` não é descrição do
projeto: é a lista de decisões já tomadas, com o motivo de cada uma. Toda vez que eu
corrigia o agente sobre algo estrutural, a correção virava linha no `CLAUDE.md`, e a
sessão seguinte já nascia sabendo.

Exemplo do que está lá, escrito depois de um erro real:

> **Sem banco nos testes — decisão registrada.** Nada de Testcontainers, nada de H2.
> [...] O que isso implica no desenho: conta de domínio fica em método Java, não em
> SQL. O total do carrinho é `Carrinho.totalEmCentavos()`, e não um `@Formula` do
> Hibernate — o `@Formula` só tem valor depois de um `SELECT`, e sem banco no teste
> ele valeria zero.

Sem essa linha, a decisão de não usar Testcontainers precisaria ser repetida a cada
sessão nova, e a consequência dela sobre o desenho das entidades se perderia.

### Prompts que definiram o projeto

**Abertura — o enunciado como âncora:**

> `@"...\Prova_Tecnica_Voce_no_Coracao_da_Gente (1).pdf"` dado o pdf anexado o
> dentinho.png deve ser o "castor" que está como imagem no pdf

**Estruturar antes de codar:**

> Quero iniciar o desenvolvimento do FRONTEND de uma aplicação utilizando React na
> Pasta Front. Antes de começar a implementar componentes ou páginas, quero que você
> estruture o contexto técnico, funcional e visual do projeto com base nos arquivos prd, phases, design.md em /docs.

**Fixar o idioma do domínio, cedo:**

> Adicione também a model Categorias dos produtos e gostaria dos nomes de todas as
> variáveis em português. Adicione também o cpf do usuário ou CNPJ, email. O login
> pode ser por cpf, cnpj ou email + senha

Isso virou a regra que atravessa o projeto inteiro: domínio em português, sem acento
nos identificadores, e os mesmos nomes de campo no JSON do Spring e nos tipos do
TypeScript — sem camada de tradução entre front e back.

**Recusar uma abordagem inteira, sem meio-termo:**

> NÃO GOSTEI DESSA ABORDAGEM DEIXE O MAIS SIMPLES... OU SEJA SEM TELA DE LOGIN DO
> KEYCLOAK PADRONIZADA... FRONTEND CHAMA /API DE AUTORIZAÇÃO DO SPRING QUE É UM PROXY
> PRO KEYCLOAK, MANDANDO LOGIN E SENHA... E FAZ O LOGIN E RETORNA O JWT


**Dar o requisito, não a solução:**

> por que após recarregar o front o usuário é deslogado?? deve manter a sessão
> persistente... mude no keycloak pro jwt de 5 minutos de duração e refresh token de
> 10h... gostaria de guardar isso num cookie http

**Fatiar por PRD:** nas duas últimas features escrevi um PRD próprio (pedido, depois
pagamento assíncrono com RabbitMQ e outbox) e colei o documento inteiro como prompt,
com objetivo, requisitos numerados e critérios de aceite. Foi o formato de prompt mais
eficaz do projeto: o agente parou de propor escopo e passou a executar escopo.

**Corrigir premissa errada na hora:**
> para esse fluxo de teste e futuros não use test containers.. teste mesmo com dados
> mockados nos testes simulando as interações... com relação ao `@Formula` apenas
> utilize um método para simular o comportamento dele

> retire a regra do estoque que informa que a quantidade máxima por item é 20 pois
> isso não foi especificado

Esta segunda é a que mais se repetiu em espírito: **o agente inventa requisito
plausível**. Limite de 20 itens por linha, reserva de estoque, expiração de pedido,
normalização de acento na busca — nada disso estava no enunciado, e tudo isso apareceu
em alguma proposta. A pergunta "onde isso está escrito?" foi o filtro mais útil que
apliquei.

### Padrão de iteração

O ciclo que se firmou depois da primeira semana:

1. Descrever o resultado esperado, não a implementação
2. Ler o que voltou — código e justificativa
3. Cortar o excedente ("retire", "não precisa de toda essa complexidade")
4. Subir e testar na mão (Swagger, navegador, `docker compose logs`)
5. Transformar a decisão em linha do `CLAUDE.md`

Interrompi o agente no meio da execução dezenas de vezes; as transcrições registram
`[Request interrupted by user]` como um dos eventos mais frequentes do projeto. Deixar
terminar uma abordagem que já se via errada custa mais caro do que cortar.

---

## 5. O que a IA gerou e o que ajustei

### Gerado pela IA, com pouca ou nenhuma alteração minha

- **Estrutura e configuração**: Vite, Tailwind, ESLint, Prettier, `tsconfig` estrito,
  Dockerfiles multi-stage, `docker-compose.yml`, tema do Keycloak
- **Migrations Flyway V1–V10**, incluindo os índices parciais e os `CHECK`
- **Mapeamento objeto-relacional** completo
- **Camada HTTP do front**: cliente encapsulado, interceptor de 401, chaves de query
- **Documentação**: `prd.md`, `models.md`, `behavior.md`, `design.md`, `README.md` e
  este relatório — todos escritos pelo agente a partir de conversa e do código real
- **Testes do backend**: 78 testes com Mockito, sem banco
- **Comentários de código**: a norma "comentário explica por quê, não o quê" foi
  seguida bem, e é boa parte do valor do que ficou no repositório

### Onde intervim, e por quê

**Escopo — o que mais cortei.** Reserva de estoque, tabela de movimentação, limite de
20 itens, ETag nas imagens, normalização de acento, `sku` e `slug` em várias tabelas,
ordenação configurável no catálogo, dados de endereço no pedido, campos de parcela e
final do cartão em pagamento.  Cada corte foi meu, muito atributos desnecessários ao escopo do projeto

**Arquitetura de sessão.** A primeira proposta de autenticação foi descartada
inteira, como registrado acima. A segunda — proxy no Spring, access token em memória,
refresh em cookie `HttpOnly` — saiu de uma exigência minha, não de sugestão do agente.

**O gateway de pagamento.** Reescrevi a implementação à mão
(commit `7fdd905`, "Refatoração do gateway Fake"). A versão gerada decidia o desfecho
pelo final do número do cartão, o que exigia trafegar e receber dados de cartão na
API só para simular. A minha decide pelo último dígito do total em centavos: mesmo
determinismo, e nenhum dado sensível entra no sistema. `PagamentoDtoIn` ficou com um
campo só, `metodo`.

**Defeito na busca que eu mesmo encontrei e corrigi**, antes de pedir ajuda: a
listagem por nome não filtrava. Só depois pedi a correção da causa de fundo, que era
outra (locale do banco).


**Testes que precisaram de decisão minha.** Quando a suíte quebrou porque o teste do
gateway esperava a regra antiga (recusa em 3 e 7) e o código já era o meu (3 e 8), a
decisão de qual lado estava certo foi minha: o código. E quando um teste exigia um
evento `PEDIDO_PAGO` no outbox, decidi que aprovação de pagamento não emite evento
nenhum por enquanto — e mandei remover a fila `pedidos.pagos`, o binding, a DLQ e o
tipo do enum, em vez de deixar topologia sem uso "pronta para o futuro".

**A revisão final de cada entrega.** Nenhum commit saiu sem eu ler o diff. Os 34
commits são meus, com mensagem minha.

---

### Os padrões do backend, e de onde cada um veio

O backend tem hoje um conjunto de regras fixas — camadas, DTO em `in`/`out`, erro
padronizado, outbox, lock pessimista, teste sem banco. Elas estão em `docs/backend.md`
e no `CLAUDE.md`, mas nenhuma nasceu pronta. A origem de cada uma diz bastante sobre
como o trabalho foi dividido:

| Padrão | De onde veio |
|---|---|
| Camadas `controllers → service → infrastructure` | Proposto pela IA na primeira fatia e mantido. Nunca foi ponto de discussão |
| `record` para todo DTO | Proposto pela IA, aceito de imediato |
| Pastas `in/` e `out/` | **Meu.** Havia um pacote só de DTOs; pedi a separação por direção — e recusei o `package-info.java` que veio junto |
| Nomes em português no domínio | **Meu**, desde o segundo dia de projeto, antes do backend existir |
| `idPublico` no contrato, `id` interno | Proposto pela IA junto com o schema. Aceito: id sequencial exposto é enumerável |
| Dono sempre pelo `sub` do token | Proposto pela IA. A alternativa nunca chegou a ser escrita |
| Recurso alheio responde 404, não 403 | Proposto pela IA, com a justificativa correta. Aceito |
| Lock **pessimista** | **Meu.** A proposta era `@Version` e lock otimista; respondi "utilize lock pessimista... por enquanto" e o `@Version` saiu do mapeamento |
| Outbox transacional | **Meu, e antecipado.** Quando descartei a tabela de reservas, mandei manter `tb_outbox_eventos` "pois futuramente irei adicionar mensageria". Ela ficou sem uso por dias, e foi o que permitiu a fatia de RabbitMQ entrar sem tocar no schema |
| Pagamento assíncrono com 202 | **Meu**, via PRD escrito antes do código |
| Gateway atrás de interface | Proposto pela IA no plano. A **regra** do fake eu reescrevi: decidir pelo final do cartão obrigava a trafegar dado de cartão só para simular |
| Teste sem banco | **Meu.** A suíte tinha vindo com Testcontainers; mandei tirar. A consequência sobre o desenho — conta de domínio em método Java, não em `@Formula` — precisou ser explicada e virou linha no `CLAUDE.md` |
| Estoque só na aprovação | Enunciado, reforçado por mim contra propostas de reserva e de tela de movimentação |
| `hasRole("CLIENTE")` nas rotas de compra | **Nasceu de um bug.** ADMIN conseguiu criar carrinho num teste manual: o front escondia o botão e a API aceitava |
| Locale ICU `pt-BR` no banco | **Nasceu de um bug.** Busca por `agua` não achava `Água Sanitária` |
| Handler de 404 para rota inexistente | **Nasceu de um bug.** O handler genérico de `Exception` engolia `NoResourceFoundException` e devolvia 500 |
| Nome de arquivo igual ao da classe | **Nasceu de um bug**, e de um diagnóstico errado antes do certo: o erro real fez o Lombok parecer quebrado |
| `UsuarioUtils.getUser` em `utils/` | **Meu**, na revisão final: o mesmo método privado estava duplicado em dois serviços |
| Fila só existe com produtor e consumidor | **Meu.** A topologia de `pedidos.pagos` foi declarada "pronta para o futuro" e removida por decisão minha |

O padrão que se repete: **a IA acerta a forma, eu decido a política.** Camada, record,
nome de exceção, mapeamento — isso veio pronto e bom. Concorrência, escopo, o que se
persiste, o que se testa e o que não se constrói ainda: cada um desses foi decidido
contra uma proposta razoável que tinha vindo diferente.

E um terço deles não foi decidido por ninguém: nasceu de bug encontrado com a
aplicação de pé, que é o argumento mais forte deste relatório a favor de rodar antes
de acreditar.

---

## 6. Problemas encontrados

### Bugs reais no código gerado

| Problema | Como apareceu | Correção |
|---|---|---|
| **Busca não achava palavra acentuada em minúsculas** | `agua` não encontrava `Água Sanitária` | O banco fora criado com locale `C`, onde `LOWER()` não rebaixa vogal acentuada. Passou a usar o provedor **ICU** com locale `pt-BR` no `initdb`. A imagem é Alpine e não tem `pt_BR.UTF-8`; o ICU vem dentro do Postgres 16 |
| **`function lower(bytea) does not exist`** | Erro em toda busca | Parâmetro nulo sem tipo dentro de `LOWER(CONCAT(...))`. O padrão do `LIKE` passou a ser montado em Java |

| **Nome de arquivo diferente do nome da classe** | Erro de compilação em cascata, que fez o Lombok parecer quebrado | `CookieSessionConfig.java` declarando `class CookieDeSessao`. Renomear resolveu |
| **Rota inexistente respondia 500** | Teste manual | O handler genérico de `Exception` engolia `NoResourceFoundException`. Entrou um handler de 404 |
| **ADMIN conseguia criar carrinho (201)** | Teste manual com token de admin | Buraco de RBAC: o front escondia o botão, a API aceitava. `hasRole("CLIENTE")` nas rotas de compra |
| **Sessão caía sozinha** | Uso normal do front | Duas causas somadas: rotação de refresh token com reuso zero no Keycloak, e duas renovações concorrentes disparando juntas. Correção nos dois lados — `refreshTokenMaxReuse: 1` e trava de renovação única no front |

### Más práticas sugeridas, e recusadas

- **`@Formula` do Hibernate** para o total do carrinho — invisível para teste sem
  banco, e regra de negócio escondida em SQL
- **Testcontainers** na suíte, contrariando a decisão de testar sem banco
- **Requisito inventado**: limite de 20 itens por linha do carrinho
- **Cerimônia sem função**: `package-info.java` por pacote
- **Aceitar a lista de itens do cliente** no `POST /api/pedidos` — seria deixar o
  cliente escolher o próprio preço. O corpo passou a ser ignorado, e o pedido nasce do
  carrinho do servidor

---

## 7. Reflexão final

### Onde a IA acelerou

**Trabalho de infraestrutura.** Compose com cinco serviços, healthchecks encadeados,
Dockerfile multi-stage, tema do Keycloak, migrations com índice parcial e trigrama:
dias de leitura de documentação resolvidos em horas.

**Documentação.** O projeto tem PRD, modelo de dados, especificação de comportamento,
guia de design, README e este relatório. Sozinho, eu teria entregue código com um
README curto — e é a documentação que torna o resto legível.

**Explicar decisão junto com o código.** Os comentários do repositório dizem *por
quê*, e isso vale para quem revisa e para mim daqui a três meses.

**Refatoração mecânica com verificação.** Renomear DTOs, extrair função duplicada,
trocar convenção em 100 arquivos — rápido e conferível.

### Onde atrapalhou

**Escopo inflado por padrão.** Sem ser contido, o agente entrega mais do que foi
pedido, e o excedente parece razoável. Reserva de estoque, ETag, limite por item,
normalização de acento — cada um custou uma rodada para entrar e outra para sair. É o
custo recorrente mais alto do projeto.

**Sugestão que passa por decisão.** `@Formula`, Testcontainers e o campo de cartão no
DTO seriam aceitáveis num projeto sem as minhas restrições. Vieram embutidos no código
pronto, não como pergunta.

### O que eu faria diferente
1. **PRD por fatia desde o começo.** As duas últimas features — pedido e pagamento —
   foram as mais limpas do projeto, e a diferença foi o documento com critérios de
   aceite entrando como prompt.
2. **Fixar o não-escopo explicitamente.** Ao lado do "o que fazer", uma lista do "o
   que não fazer". Passei a manter uma no `CLAUDE.md`; ela devia existir desde a
   primeira sessão.

### O que fica
O ganho real não foi digitar menos. Foi poder sustentar, sozinho e em seis dias, um
sistema com identidade federada, mensageria com outbox transacional, controle de
concorrência em estoque e um front inteiro — mantendo decisão explícita e documentada
em cada peça. A parte que continua sendo minha é justamente a que decide: o que entra,
o que fica de fora, e o que se aceita como resposta.