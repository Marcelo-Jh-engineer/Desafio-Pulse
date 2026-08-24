# PRD — E-commerce "Você no Coração da Gente"

**Versão** 1.0 · **Data** 2026-08-20 · **Status** Aprovado para implementação
**Escopo desta versão**: frontend. O backend (Spring Boot 3, pasta `Back/`) entra a partir da Fase 6.

---

## 1. Descrição geral

### 1.1 Resumo

Loja online de produtos de supermercado. Visitantes navegam o catálogo livremente; clientes autenticados montam um carrinho, pagam e recebem a confirmação do pedido; administradores cadastram produtos, organizam categorias e movimentam estoque.

A aplicação é uma SPA em React consumindo uma API REST. As telas são montadas por **RBAC**: os papéis do usuário chegam nas claims de um JWT e determinam navegação, rotas acessíveis e ações visíveis.

### 1.2 Objetivos

| Objetivo | Como se mede |
|---|---|
| Permitir descoberta de produtos sem barreira de login | Catálogo, filtro e página de produto públicos |
| Converter visitante em cliente no momento da intenção de compra | Fluxo de login que retoma a ação interrompida |
| Dar ao admin controle de catálogo e estoque | Cadastro de produto, gestão de categorias, entrada e saída de estoque |
| Construir uma base que troque mock por API sem reescrita | A Fase 6 não altera componente, hook ou query |

### 1.3 Fora de escopo (v1)

- Gateway de pagamento real, tokenização de cartão, conformidade PCI
- Frete de qualquer espécie: cálculo por CEP, valor fixo, integração com transportadora
- Cupom de desconto, programa de fidelidade, lista de favoritos
- Avaliação e comentário de produto
- Recuperação de senha por email, verificação de email, autenticação social
- Histórico completo de pedidos e rastreamento logístico (a **consulta de status de um pedido** está no escopo; a lista de todos os pedidos, não)
- Relatórios e dashboard analítico do admin
- Multi-idioma e multi-moeda
- Aplicativo nativo

### 1.4 Premissas e dependências

- O backend é Java 21 com Spring Boot 3, expõe REST com JSON documentado em OpenAPI e emite JWT com as claims definidas em `docs/models.md`.
- **O backend espelha os nomes de campo em português** deste projeto. Não existe camada de tradução no front.
- O pagamento é simulado do lado do servidor (gateway fake), com fluxo realista: o pedido nasce `PENDENTE` e vai para `PAGO` ou `FALHOU`.
- **A baixa de estoque ocorre no backend após a aprovação do pagamento**, não na montagem do carrinho.
- O mascote Dentinho está em `docs/dentinho.png`, reconstruído a partir da arte do documento da prova. As cores de marca em `docs/design.md` (azul `#004E98`, turquesa `#73F1DD`) são os valores reais extraídos dessa arte.

---

## 2. Pessoas

### 2.1 Visitante — papel `VISITANTE` (ausência de autenticação)

Chega pelo link de um produto ou pela home. Quer ver preço e disponibilidade sem criar conta. Só vira cliente se o cadastro for curto e não interromper o que estava fazendo.

**Precisa de**: catálogo aberto, filtro por categoria, página de produto com preço e disponibilidade claros.
**Dor a evitar**: parede de login antes de ver qualquer coisa; perder o produto escolhido ao logar.

### 2.2 Cliente — papel `CLIENTE`

Identificado por um documento, que pode ser CPF ou CNPJ (pequeno comércio comprando para revenda também usa a loja). Compra recorrente, carrinho com muitos itens, sensível a preço e a disponibilidade.

**Precisa de**: carrinho que não se perde, ajuste rápido de quantidade, total sempre visível, checkout curto, confirmação inequívoca.
**Dor a evitar**: descobrir falta de estoque só no pagamento; não saber se o pedido saiu; ter que lembrar por qual dado se cadastrou para conseguir logar.

### 2.3 Administrador — papel `ADMIN`

Opera o catálogo diariamente. Cadastra produto novo, corrige preço, repõe e baixa estoque.

**Precisa de**: formulário de cadastro objetivo, movimentação de estoque com registro de motivo, categorias sob controle.
**Dor a evitar**: estoque negativo; movimentação sem rastro de quem fez e por quê.

> `ADMIN` **não compra**. Não tem carrinho, não vê checkout. Isso mantém os fluxos separados e o header sem ambiguidade.

---

## 3. Modelo de acesso — RBAC

Fonte de verdade para os guards de rota (`RotaProtegida`) e para a renderização condicional (`<Permitir/>`).

### 3.1 Matriz de capacidades

| Capacidade | VISITANTE | CLIENTE | ADMIN |
|---|:---:|:---:|:---:|
| Ver catálogo | sim | sim | sim |
| Filtrar por categoria e paginar | sim | sim | sim |
| Ver página do produto | sim | sim | sim |
| Cadastrar-se | sim | não | não |
| Fazer login | sim | não | não |
| Adicionar item ao carrinho | **não** | sim | não |
| Remover item do carrinho | **não** | sim | não |
| Alterar quantidade no carrinho | **não** | sim | não |
| Acessar checkout | não | sim | não |
| Pagar o total do carrinho | não | sim | não |
| Ver confirmação do pedido | não | sim | não |
| Listar produtos na área admin | não | não | sim |
| Cadastrar produto | não | não | sim |
| Adicionar estoque | não | não | sim |
| Remover estoque | não | não | sim |
| Gerenciar categorias | não | não | sim |

### 3.2 Como o papel chega na tela

1. O login devolve `RespostaAutenticacao` com o JWT.
2. `decodificarToken()` extrai `ClaimsJwt`, incluindo `papeis`.
3. O store de sessão é hidratado; header, menu e roteador reagem.
4. `RotaProtegida` compara `papeis` com os papéis exigidos pela rota.
5. `<Permitir>` esconde ações não permitidas dentro de uma tela já acessível.

### 3.3 Regra inegociável

> **A checagem no front é UX, não segurança.** Ela evita mostrar um botão que vai falhar. A autorização real é sempre do backend, que valida o token e o papel em toda requisição privilegiada. Esconder um botão nunca substitui a checagem do servidor.

### 3.4 Distinção 401 e 403

| Situação | Resposta | Comportamento |
|---|---|---|
| Sem token, ou token expirado | 401 | Limpa a sessão, vai para `/login` preservando o destino |
| Token válido, papel insuficiente | 403 | **Mantém** a sessão, vai para `/403` |

Tratar 403 como 401 seria um bug: derrubaria a sessão de um usuário legitimamente logado.

---

## 4. Requisitos funcionais

Prioridade: **P0** obrigatório na fase · **P1** importante · **P2** desejável.

### 4.1 Catálogo

| ID | Requisito | Papel | Prio | Fase |
|---|---|---|---|---|
| RF-CAT-01 | Listar produtos ativos em grade paginada, 12 por página | Todos | P0 | F1 |
| RF-CAT-02 | Exibir nome, imagem, preço, unidade e disponibilidade em cada cartão | Todos | P0 | F1 |
| RF-CAT-03 | Filtrar a listagem por categoria | Todos | P0 | F1 |
| RF-CAT-04 | Navegar entre páginas preservando o filtro ativo | Todos | P0 | F1 |
| RF-CAT-05 | Carregar as categorias da API, nunca codificadas no front | Todos | P0 | F1 |
| RF-CAT-06 | Refletir filtro, busca, ordenação e página na query string | Todos | P0 | F1 |
| RF-CAT-07 | Abrir a página do produto com descrição completa | Todos | P0 | F1 |
| RF-CAT-08 | Marcar produto com estoque zero como indisponível, sem botão de compra | Todos | P0 | F1 |
| RF-CAT-09 | Buscar produto por nome | Todos | P1 | F1 |
| RF-CAT-10 | Ordenar por relevância, preço ou nome | Todos | P2 | F1 |

### 4.2 Autenticação e cadastro

| ID | Requisito | Papel | Prio | Fase |
|---|---|---|---|---|
| RF-AUTH-01 | Cadastro com cinco campos: login, e-mail, nome completo, senha e confirmação de senha | VISITANTE | P0 | F2 |
| RF-AUTH-02 | Login por **campo único** que aceita CPF, CNPJ ou e-mail, mais senha | VISITANTE | P0 | F2 |
| RF-AUTH-03 | Ler os papéis do token e montar a interface conforme eles | Todos | P0 | F2 |
| RF-AUTH-04 | Documento aceito **apenas com números**, sem pontuação, validado por dígito verificador | VISITANTE | P0 | F2 |
| RF-AUTH-05 | `login` e `email` únicos, sem colidir entre si; conflito devolve erro por campo | VISITANTE | P0 | F2 |
| RF-AUTH-06 | Normalizar antes de enviar: documento sem pontuação, e-mail em minúsculas | VISITANTE | P0 | F2 |
| RF-AUTH-07 | Erro de credencial genérico, que não revela se o identificador existe | VISITANTE | P0 | F2 |
| RF-AUTH-08 | Encerrar sessão limpando todo o estado do cliente, inclusive o carrinho | CLIENTE, ADMIN | P0 | F2 |

**O login é campo próprio, separado do e-mail.** É a credencial de acesso e pode
ser um documento; mesmo quando é e-mail, não precisa ser o mesmo endereço de
contato. Quem entra digita um valor só, e o servidor procura nos dois campos.

**Não há máscara de documento em lugar nenhum.** O que a pessoa digita é o que o
sistema guarda e o que trafega: só dígitos.

### 4.3 Carrinho

| ID | Requisito | Papel | Prio | Fase |
|---|---|---|---|---|
| RF-CAR-01 | Adicionar produto ao carrinho | CLIENTE | P0 | F3 |
| RF-CAR-02 | Remover item do carrinho | CLIENTE | P0 | F3 |
| RF-CAR-03 | Alterar a quantidade de um item | CLIENTE | P0 | F3 |
| RF-CAR-04 | Recalcular  total a cada mudança | CLIENTE | P0 | F3 |
| RF-CAR-05 | Limitar a quantidade ao estoque disponível | CLIENTE | P0 | F3 |
| RF-CAR-06 | Exibir contador de itens no header | CLIENTE | P0 | F3 |
| RF-CAR-07 | Guardar a intenção de compra do visitante e retomá-la após o login | VISITANTE | P0 | F3 |
| RF-CAR-08 | Manter o carrinho entre recarregamentos da página | CLIENTE | P1 | F3 |
| RF-CAR-09 | Desfazer a remoção de um item | CLIENTE | P2 | F3 |

### 4.4 Checkout e pagamento

| ID | Requisito | Papel | Prio | Fase |
|---|---|---|---|---|
| RF-CHK-01 | Informar endereço de entrega com validação | CLIENTE | P0 | F4 |
| RF-CHK-02 | Exibir resumo do pedido com itens e total | CLIENTE | P0 | F4 |
| RF-CHK-03 | Coletar dados do cartão, com escolha de parcelamento | CLIENTE | P0 | F4 |
| RF-CHK-04 | Exibir estado de processamento durante o pagamento | CLIENTE | P0 | F4 |
| RF-CHK-05 | Exibir confirmação com número do pedido quando aprovado | CLIENTE | P0 | F4 |
| RF-CHK-06 | Permitir nova tentativa quando recusado, sem perder o carrinho | CLIENTE | P0 | F4 |
| RF-CHK-07 | Esvaziar o carrinho somente após aprovação | CLIENTE | P0 | F4 |
| RF-CHK-08 | Revalidar preço e estoque ao entrar no checkout | CLIENTE | P1 | F4 |
| RF-CHK-09 | Bloquear submissão duplicada do pagamento | CLIENTE | P0 | F4 |
| RF-CHK-10 | **Escolher entre cartão e Pix** antes de informar qualquer dado | CLIENTE | P0 | F4 |
| RF-CHK-11 | **Pix com QR code, copia e cola e prazo de 5 minutos**; expirado, gera outro | CLIENTE | P0 | F4 |
| RF-CHK-12 | Confirmar o Pix e concluir o pedido quando pago dentro do prazo | CLIENTE | P0 | F4 |
| RF-CHK-13 | **Resumo do pagamento na confirmação e comprovante imprimível** | CLIENTE | P0 | F4 |

### 4.5 Pedido

| ID | Requisito | Papel | Prio | Fase |
|---|---|---|---|---|
| RF-PED-01 | Consultar o status de um pedido pelo identificador | CLIENTE | P0 | F4 |
| RF-PED-02 | Exibir os estados `PENDENTE`, `PAGO`, `FALHOU` e `CANCELADO` com explicação legível | CLIENTE | P0 | F4 |
| RF-PED-03 | Impedir que um cliente consulte pedido de outro | CLIENTE | P0 | F4 |
| RF-PED-04 | Oferecer nova tentativa de pagamento em pedido `FALHOU` | CLIENTE | P1 | F4 |

### 4.6 Administração

| ID | Requisito | Papel | Prio | Fase |
|---|---|---|---|---|
| RF-ADM-01 | Listar produtos, ativos e inativos, com SKU, categoria, unidade, preço e estoque | ADMIN | P0 | F5 |
| RF-ADM-02 | Cadastrar produto com nome, SKU, descrição, preço, unidade, imagem, categoria e estoque inicial | ADMIN | P0 | F5 |
| RF-ADM-03 | **Alterar o preço de um produto**, na própria linha da listagem | ADMIN | P0 | F5 |
| RF-ADM-05 | Gerenciar categorias: listar, criar, renomear, ativar e desativar | ADMIN | P0 | F5 |
| RF-ADM-08 | Sinalizar produtos com estoque baixo, com cor **e** rótulo | ADMIN | P2 | F5 |

**O administrador não movimenta estoque.** O estoque tem um caminho só: baixa
quando um pagamento é aprovado. Não há entrada, saída, ajuste manual nem
histórico de movimentação — o que existe de rastro é o próprio pedido.

**O administrador também não navega a loja.** Ele não compra, e ver o catálogo
como cliente criaria a dúvida de qual visão está valendo. A listagem
administrativa já mostra os produtos com os dados que ele precisa operar.

## 5. Requisitos não funcionais

### 5.1 Performance

| ID | Requisito |
|---|---|
| RNF-PERF-01 | LCP abaixo de 2,5 s e CLS abaixo de 0,1 no catálogo, em 4G simulado |
| RNF-PERF-02 | Code splitting por rota; a área admin não entra no bundle do cliente |
| RNF-PERF-03 | Imagens com carregamento preguiçoso e dimensões explícitas, para não gerar salto de layout |
| RNF-PERF-04 | Cache do TanStack Query com `staleTime` por tipo de dado: categorias longo, catálogo médio, carrinho curto |
| RNF-PERF-05 | Bundle inicial abaixo de 250 KB comprimido |

### 5.2 Acessibilidade

| ID | Requisito |
|---|---|
| RNF-A11Y-01 | WCAG 2.1 nível AA |
| RNF-A11Y-02 | Todo fluxo completável apenas pelo teclado |
| RNF-A11Y-03 | Indicador de foco visível, nunca removido sem substituto |
| RNF-A11Y-04 | Contraste mínimo 4.5:1 para texto normal e 3:1 para texto grande e elementos de interface |
| RNF-A11Y-05 | Mudanças de carrinho e mensagens de erro anunciadas por `aria-live` |
| RNF-A11Y-06 | Todo campo com rótulo associado; erro ligado ao campo por `aria-describedby` |
| RNF-A11Y-07 | Imagem de produto com texto alternativo descritivo; imagem decorativa com `alt` vazio |
| RNF-A11Y-08 | Foco movido para o título principal a cada navegação de rota |

### 5.3 Responsividade

| ID | Requisito |
|---|---|
| RNF-RESP-01 | Mobile-first, funcional a partir de 320 px |
| RNF-RESP-02 | Grade do catálogo com 2 colunas no celular, 3 no tablet, 4 no desktop |
| RNF-RESP-03 | Alvos de toque com no mínimo 44 por 44 px |
| RNF-RESP-04 | Sem rolagem horizontal em nenhum breakpoint |

### 5.4 Segurança

| ID | Requisito |
|---|---|
| RNF-SEC-01 | Access token mantido em memória, não persistido (ver seção 8) |
| RNF-SEC-02 | Nenhum dado de cartão persistido em store, storage, cache ou log |
| RNF-SEC-03 | **CPF e CNPJ são dados pessoais sob a LGPD**: nunca em URL, query string, log ou chave de cache |
| RNF-SEC-04 | Documento exibido mascarado fora da tela de perfil |
| RNF-SEC-05 | Toda entrada de usuário validada por schema Zod antes de sair do front |
| RNF-SEC-06 | Redirecionamento pós-login aceita apenas caminhos internos, para impedir open redirect |
| RNF-SEC-07 | Nenhum segredo no bundle; variáveis `VITE_*` são públicas por definição |
| RNF-SEC-08 | Sem `dangerouslySetInnerHTML` em conteúdo vindo da API |
| RNF-SEC-09 | Mensagem de erro nunca revela existência de conta nem detalhe interno do servidor |

### 5.5 Manutenibilidade e qualidade

| ID | Requisito |
|---|---|
| RNF-MAN-01 | TypeScript em modo `strict`, sem `any` e sem asserção de tipo para contornar erro |
| RNF-MAN-02 | ESLint e Prettier bloqueando o build em caso de violação |
| RNF-MAN-03 | Regras de negócio puras isoladas em módulos sem React — totais, validação de documento, leitura de token — para poderem ser verificadas de fora |
| RNF-MAN-04 | Nomenclatura de domínio em português conforme `CLAUDE.md`, espelhada pelo backend |
| RNF-MAN-05 | Feature não importa de outra feature; o compartilhado sobe para `components/`, `lib/` ou `hooks/` |
| RNF-MAN-06 | Nenhuma biblioteca nova sem justificativa registrada em `CLAUDE.md` |

**Não há testes automatizados no frontend — decisão do projeto.** A verificação
antes de entregar é `verificar-tipos`, `lint`, `format:check` e `build`, mais a
conferência manual do fluxo na tela.

A consequência a assumir: refatoração fica sem rede. Por isso RNF-MAN-03 ganha
peso — regra de negócio em módulo puro é a parte que mais se ganharia em testar,
e mantê-la isolada deixa a porta aberta caso a decisão mude.

---

## 6. Fases do projeto

Cada fase é entregável, testável e não quebra a anterior. As fases 1 a 5 rodam com dados mockados; a 6 troca a fonte.

### F0 — Fundação
**Entrega**: Vite, React e TypeScript `strict`; Tailwind com os tokens de `docs/design.md`; shadcn/ui; ESLint e Prettier; alias `@/`; estrutura de pastas; cliente HTTP encapsulado; React Router com layout base (header, footer, mascote); páginas 404 e 403.
**Pronto quando**: `dev`, `build`, `lint`, `format:check` e `verificar-tipos` passam; a rota `/` renderiza o layout; os tokens de cor respondem ao tema.

### F1 — Catálogo público (mock)
**Cobre**: RF-CAT-01 a RF-CAT-10.
**Entrega**: MSW configurado com as fixtures de `docs/models.md`; listagem em grade; filtro por categoria vindo da API; busca; ordenação; paginação; estado indisponível; página do produto; skeleton, estado vazio e estado de erro com nova tentativa.
**Pronto quando**: filtro, busca e página sobrevivem a recarregar a URL; produto com estoque zero não oferece compra; a lista de categorias não está codificada em nenhum lugar do front.

### F2 — Autenticação e RBAC (mock)
**Cobre**: RF-AUTH-01 a RF-AUTH-08.
**Entrega**: dois usuários de teste em memória (um `CLIENTE`, um `ADMIN`); `lib/token-simulado.ts`; store de sessão em Zustand; tela de login por e-mail ou CPF; tela de cadastro; `RotaProtegida`; `<Permitir>`; cabeçalho reativo ao papel; página 403.
**Pronto quando**: dá para entrar com os dois usuários por CPF e por e-mail; `ADMIN` cai em `/admin/produtos` e `CLIENTE` no catálogo; `CLIENTE` em `/admin/*` vai para `/403` **sem perder a sessão**; token quebrado vira sessão anônima sem exceção.

**Escopo deliberadamente reduzido.** A fase mockada não tem servidor, então JWT assinado, expiração, renovação de token e retomada de intenção pós-login não teriam o que exercitar — só machinery sem contraparte. Entram na F6, junto com o backend que os torna reais. O que fica de pé agora é o essencial: credencial confere, token carrega papéis, interface se monta por papel.

### F3 — Carrinho (mock)
**Cobre**: RF-CAR-01 a RF-CAR-09.
**Entrega**: `lib/carrinho-calculo.ts` com as regras de dinheiro em funções puras; store do carrinho em Zustand, persistido; adicionar, remover e alterar quantidade; teto pelo menor valor entre 20 e o estoque; contador no cabeçalho; retomada da intenção do visitante após o login; desfazer remoção por toast.
**Pronto quando**: o visitante que clica em comprar volta do login com o item já no carrinho; a quantidade nunca ultrapassa o estoque; os totais batem com a função pura testada; `ADMIN` não vê botão de compra nem contador.

**O carrinho é do lado do cliente nesta fase.** Não há endpoint de carrinho no mock: o estado vive no Zustand e é persistido em `localStorage`. Por isso a atualização otimista com reversão descrita em `docs/behavior.md` seção 7 não se aplica ainda — não existe requisição que possa falhar. Ela passa a valer na F6, quando o carrinho passar a ser do servidor.

A revalidação de preço e de estoque contra a API é da F4 (RF-CHK-08), no checkout. O que a F3 garante é o teto no momento de adicionar e um aviso na linha quando o estoque do snapshot já não cobre a quantidade.

### F4 — Checkout e pagamento simulado (mock)
**Cobre**: RF-CHK-01 a RF-CHK-13, RF-PED-01 a RF-PED-04.
**Entrega**: revalidação de preço e estoque ao entrar; endereço; criação do pedido `PENDENTE`; escolha entre cartão e Pix; cartão com parcelamento; Pix com QR code e prazo de 5 minutos; confirmação com resumo do pagamento e comprovante imprimível; tela de status; recusa com nova tentativa; bloqueio de submissão duplicada.
**Pronto quando**: os desfechos de cartão (aprovado, recusado, erro de rede) e de Pix (pago no prazo, expirado) estão implementados; o carrinho só esvazia após aprovação; nenhum dado de cartão aparece em store, storage ou cache.

**A ordem das etapas sustenta as garantias.** O pedido é criado ao fim da etapa de endereço, não no pagamento. Isso dá três coisas de graça: o `pedidoId` que a requisição de pagamento exige; a possibilidade de recarregar a tela e consultar o estado em vez de reenviar; e a nova tentativa em pedido `FALHOU` reabrindo o mesmo pedido, sem recriar carrinho.

**A baixa de estoque acontece na transição para `PAGO`** — nunca na montagem do carrinho nem na criação do pedido. Enquanto o pedido está `PENDENTE` o estoque não foi debitado, e é exatamente por isso que o checkout revalida.

### F5 — Área administrativa (mock)
**Cobre**: RF-ADM-01, RF-ADM-02, RF-ADM-03, RF-ADM-05 e RF-ADM-08.
**Entrega**: listagem com filtro por categoria e situação, busca por nome ou SKU, ordenada por menor estoque; alteração de preço na própria linha; cadastro de produto; gestão de categorias; alerta de estoque baixo com rótulo, não só cor.
**Pronto quando**: o preço muda sem sair da listagem e o catálogo público reflete na hora; desativar categoria com produtos vinculados avisa antes; o administrador não consegue abrir o catálogo nem o carrinho.

**O administrador opera um recorte estreito de propósito.** Ele cadastra produto, ajusta preço e organiza categorias. Não movimenta estoque — esse caminho é a venda — e não navega a loja. Duas visões do mesmo catálogo criariam a dúvida de qual está valendo.

O endpoint administrativo de produto busca por **id**, não por slug: a listagem trabalha com a chave estável, que não muda quando o nome do produto é editado. O catálogo público continua indexando por slug, que é o que aparece na URL.

### F6 — Integração com o backend (dados reais)
**Entrega**: `VITE_API_MODE=http`; `VITE_API_BASE_URL` apontando para a API Spring; renovação de token; tratamento dos erros reais; ajuste de contrato se algo divergir.
**Pronto quando**: a aplicação funciona ponta a ponta contra o backend **sem alteração em componente, hook ou chave de query**. Se algum componente precisar mudar, a estratégia de mock falhou e o desvio precisa ser documentado.

### F7 — Hardening
**Entrega**: auditoria de acessibilidade com teclado e leitor de tela; conferência manual dos fluxos críticos (comprar por cartão, comprar por Pix, logar, cadastrar, ajustar preço); orçamento de performance; revisão de todos os estados de erro; revisão de segurança contra a seção 5.4.
**Pronto quando**: os requisitos não funcionais de acessibilidade, performance e segurança estão verificados, não apenas escritos.

---

## 7. Estratégia de dados: do mock à API real

O requisito de arquitetura mais importante do projeto.

### 7.1 Princípio

**Contract-first.** Os tipos de `docs/models.md` são o contrato. Mock e API real implementam a mesma forma, com os mesmos nomes de campo em português. O backend espelha — não existe tradução no meio.

### 7.2 Interceptação em camada de rede, não troca de implementação

O mock intercepta **abaixo** do cliente HTTP, com MSW. O código de aplicação usa o cliente real desde a F1 e nunca sabe que existe mock. Migrar para a API real é desligar o worker.

```
componente -> hook (TanStack Query) -> servico -> cliente HTTP -> [MSW]  -> fixtures     (F1 a F5)
                                                               -> [rede] -> API Spring   (F6 e F7)
```

Só a última seta muda.

### 7.3 Justificativa da biblioteca adicional

Adicionar `msw` foge da stack obrigatória, então precisa de razão explícita:

- É `devDependency`: **não entra no bundle de produção**.
- É a única abordagem que mantém o código de aplicação **idêntico** entre a fase mockada e a integrada. A alternativa (padrão adapter com duas implementações de repositório) obriga a manter dois caminhos de código vivos e deixa o caminho real sem nenhum exercício até a F6 — que é exatamente quando todos os problemas apareceriam de uma vez.

### 7.4 Configuração

| Variável | Valores | Efeito |
|---|---|---|
| `VITE_API_MODE` | `mock` ou `http` | Liga ou desliga o worker do MSW |
| `VITE_API_BASE_URL` | URL | Base do cliente HTTP |

### 7.5 Nenhuma outra biblioteca

Três utilitários escritos à mão, curtos e testáveis, em vez de três dependências:

| Utilitário | Conteúdo | Dispensa |
|---|---|---|
| `lib/token-simulado.ts` | `criarToken()` e `lerToken()`, base64 de um objeto simples | `jwt-decode` |
| `lib/documento.ts` | `validarCpf()`, `validarCnpj()`, `detectarTipoDocumento()`, `detectarTipoIdentificador()`, `normalizarDocumento()`, cerca de 40 linhas | `cpf-cnpj-validator` |
| `lib/formato.ts` | `formatarDocumento()`, `mascararDocumento()`, `formatarPreco()`, `formatarCep()` | `react-imask` |

### 7.6 O token da fase mockada

**Não é um JWT.** É uma única string base64 com o que a interface precisa para se montar: id, nome, e-mail e papéis. Sem header, sem assinatura, sem expiração — nada disso teria sentido sem um servidor do outro lado para emitir e conferir.

Isso é seguro porque **o front usa o token só para montar a interface, nunca para autorizar**. Quando o backend entrar na F6, `lib/token-simulado.ts` é trocado por um decodificador de JWT de verdade; o resto da aplicação não muda, porque só consome `ConteudoDoToken`.

A regra que sobrevive à troca: **os papéis saem do token, nunca do corpo da resposta**. É o token que o backend vai conferir.

---

## 8. Segurança do token — decisão registrada

**Padrão adotado**: access token de vida curta **em memória**, no store Zustand, **não persistido**. A renovação usa um cookie `httpOnly` emitido pelo backend, que o JavaScript não consegue ler.

| Opção | Risco de XSS | Sobrevive a recarregar | Decisão |
|---|---|---|---|
| Memória mais refresh em cookie `httpOnly` | Baixo | Sim, via renovação | **Adotada** |
| `sessionStorage` | Alto | Sim, na aba | Alternativa, se o backend não oferecer o cookie |
| `localStorage` | Alto e persistente | Sim | **Rejeitada** |

**Dependência da F6**: se o backend não expuser renovação por cookie `httpOnly`, o fallback é `sessionStorage`, com o risco de XSS anotado e mitigado pela ausência de `dangerouslySetInnerHTML` e pela validação de toda entrada.

Na fase mockada o comportamento é idêntico ao planejado para o real, para que a F6 não mude nada.

---

## 9. Métricas de sucesso

| Métrica | Alvo | Como medir |
|---|---|---|
| Conclusão do checkout | acima de 60% de quem inicia | Funil da tela de carrinho até a confirmação |
| Conversão de visitante em cadastro no momento da intenção | acima de 40% | Cliques em comprar sem sessão que terminam em cadastro concluído |
| Abandono por falta de estoque no checkout | abaixo de 2% | Falhas de revalidação em RF-CHK-08 |
| LCP no catálogo | abaixo de 2,5 s | Web Vitals de campo |
| Erros de validação de documento no cadastro | abaixo de 10% das tentativas | Taxa de rejeição em RF-AUTH-04 |
| Pedidos concluídos por Pix | acompanhar a divisão com cartão | Campo `pagamento.metodo` do pedido |

---

## 10. Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| O backend não espelhar os nomes de campo em português | Média | Alto | Contrato fechado em `docs/models.md` antes da F6; alinhar com o backend na F0, não na F6 |
| O JWT real vir com claims diferentes das planejadas | Média | Alto | `ClaimsJwt` fixado na F2 e validado com o backend cedo; decodificação isolada em um único arquivo |
| O mock divergir da API e a F6 virar retrabalho | Média | Alto | Interceptação em camada de rede em vez de adapter; mesmos handlers nos testes |
| Backend não oferecer renovação por cookie `httpOnly` | Média | Médio | Fallback já documentado na seção 8 |
| Confusão do usuário no campo único de login | Baixa | Médio | Rótulo explícito, máscara automática, mensagem de erro única e clara |
| Estoque negativo por corrida entre administradores | Baixa | Alto | A validação do backend é a autoritativa; o front apenas antecipa o bloqueio |
| Acessibilidade deixada para o fim | Alta | Médio | Requisitos RNF-A11Y aplicados desde a F0 nos componentes base, e auditados de novo na F7 |
| Crescimento de escopo entre fases | Alta | Médio | Escopo por fase fechado; item novo entra em fase futura, nunca na fase em curso |

---

## 11. Rastreabilidade

| Documento | Papel |
|---|---|
| `docs/models.md` | Contrato de dados, tipos, fixtures |
| `docs/design.md` | Paleta, tokens, componentes, mascote |
| `docs/behavior.md` | Comportamento de cada tela e fluxo |
| `CLAUDE.md` | Stack, convenções e regras de arquitetura |
