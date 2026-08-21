# Você no Coração da Gente — E-commerce de Supermercado

Monorepo com `Front/` (React) e `Back/` (Java 21 + Spring Boot 3).

**Fase atual: F1 — Catálogo público.** A F0 está concluída (fundação em `Front/`). O backend ainda não existe; os dados vêm de mock até a Fase 6.

---

## Documentos de contexto

Leia o que for relevante para a tarefa antes de escrever código:

| Arquivo | Quando ler |
|---|---|
| `docs/prd.md` | Escopo, requisitos (`RF-*`, `RNF-*`), fases, matriz RBAC, estratégia de mock |
| `docs/models.md` | Tipos, contratos de API, regras de negócio, fixtures |
| `docs/behavior.md` | Comportamento de cada tela, fluxos, estados, casos de borda |
| `docs/design.md` | Paleta, tokens, tipografia, componentes, mascote |

Ao implementar uma feature, cite o requisito que ela cobre (`RF-CAT-03`, por exemplo).

---

## Stack obrigatória

- React · TypeScript (`strict`) · Vite
- React Router
- TanStack Query — estado de servidor e cache
- Zustand — estado global de cliente, quando necessário
- Tailwind CSS · shadcn/ui
- React Hook Form · Zod
- Axios ou fetch encapsulado
- ESLint · Prettier

### Nenhuma biblioteca nova sem justificativa

Exceções já decididas e registradas:

| Decisão | Motivo |
|---|---|
| `msw` como `devDependency` | Único jeito de manter o código de aplicação idêntico entre mock e API real. Não entra no bundle de produção. Detalhes em `docs/prd.md`, seção 7 |
| Token da fase mockada em `lib/token-simulado.ts` | Não é JWT: uma string base64 com id, nome, email e papéis. Sem assinatura e sem expiração — nada disso faz sentido sem servidor. Vira decodificação de JWT de verdade na F6 |
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
  mocks/          # handlers MSW + fixtures
  types/          # tipos do dominio (espelham docs/models.md)
  hooks/          # hooks compartilhados
  test/           # setup e utilitarios de teste
```

**Regra de acoplamento**: uma feature **nunca** importa de outra feature. O que for compartilhado sobe para `components/`, `lib/` ou `hooks/`.

---

## Arquitetura

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
- Papéis vêm do token simulado, lido em `lib/token-simulado.ts`. Sempre do **token**, nunca do corpo da resposta.
- **401 e 403 são coisas diferentes**: sem sessão leva ao login; com sessão e sem o papel vai para `/403` **preservando** a sessão.

> **A checagem no front é UX, não segurança. A autorização real é sempre do backend.**

---

## Dado sensível

- Documento (CPF ou CNPJ) digitado, armazenado e trafegado **só com dígitos**. Não há máscara em lugar nenhum.
- `login` e `email` são campos separados. O login é a credencial e pode ser CPF, CNPJ ou e-mail.
- **Não existe campo de tipo de pessoa.** O formato é inferido: contém `@` é e-mail, 11 dígitos é CPF, 14 é CNPJ.
- Documento **nunca** em URL, query string, log ou chave de cache (LGPD).
- Login exibido mascarado fora do perfil quando é documento.
- Nenhum dado de cartão persistido em store, storage, cache ou log. No comprovante, só os quatro últimos dígitos.
- Token em memória, não persistido.
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

**Não há testes automatizados neste projeto — decisão registrada.** Antes de
entregar: `verificar-tipos`, `lint`, `format:check`, `build` e conferência
manual na tela.

Variáveis de ambiente:

| Variável | Valores |
|---|---|
| `VITE_API_MODE` | `mock` ou `http` |
| `VITE_API_BASE_URL` | URL da API |

---

## O que não fazer

- Não criar código no `Back/` — a fase atual é só frontend.
- Não adicionar biblioteca sem justificar.
- Não usar ponto flutuante para dinheiro.
- Não usar nome de variável de domínio em inglês.
- Não codificar a lista de categorias no front — vem da API.
- Não copiar dado de servidor para o Zustand.
- Não persistir token, documento formatado ou dado de cartão.
- Não tratar 403 como 401.
- Não deixar o ADMIN entrar na loja.
- Não criar tela de movimentação de estoque.
- Não persistir a sessão: ela vive em memória e recarregar a página desloga.
- Não remover indicador de foco.
- Não usar `dangerouslySetInnerHTML` com conteúdo da API. A única exceção é o SVG do QR code, gerado localmente a partir de uma string que o próprio front montou.

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
