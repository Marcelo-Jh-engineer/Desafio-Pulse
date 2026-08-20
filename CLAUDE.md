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
- Vitest · Testing Library

### Nenhuma biblioteca nova sem justificativa

Exceções já decididas e registradas:

| Decisão | Motivo |
|---|---|
| `msw` como `devDependency` | Único jeito de manter o código de aplicação idêntico entre mock e API real. Não entra no bundle de produção. Detalhes em `docs/prd.md`, seção 7 |
| JWT decodificado à mão em `lib/jwt.ts` | 15 linhas. Dispensa `jwt-decode` |
| CPF e CNPJ validados à mão em `lib/documento.ts` | 40 linhas. Dispensa `cpf-cnpj-validator` |
| Máscara de documento à mão em `lib/formato.ts` | Dispensa `react-imask` |
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
| Ver catálogo e produto | sim | sim | sim |
| Carrinho e checkout | não | sim | não |
| Cadastrar produto, mexer em estoque e categorias | não | não | sim |

- `RotaProtegida` guarda rotas por papel.
- `<Permitir>` esconde ações dentro de uma tela já acessível.
- Papéis vêm da claim `papeis` do JWT, decodificada em `lib/jwt.ts`.
- **401 e 403 são coisas diferentes**: 401 limpa a sessão e leva ao login; 403 **preserva** a sessão e leva a `/403`.

> **A checagem no front é UX, não segurança. A autorização real é sempre do backend.**

---

## Dado sensível

- Documento (CPF ou CNPJ) armazenado e trafegado **só com dígitos**. Máscara apenas na view.
- **Não existe campo de tipo de pessoa.** O tipo é inferido pelo comprimento: 11 dígitos = CPF, 14 = CNPJ.
- Documento **nunca** em URL, query string, log ou chave de cache (LGPD).
- Documento exibido mascarado fora do perfil.
- Nenhum dado de cartão persistido em store, storage, cache ou log.
- Token em memória, não persistido.
- Redirecionamento pós-login aceita **apenas** caminho interno.

---

## Comandos

Rodar de dentro de `Front/`:

```
npm run dev             # servidor de desenvolvimento
npm run build           # verificacao de tipos + build de producao
npm run test            # Vitest
npm run test:coverage   # Vitest com cobertura
npm run lint            # ESLint
npm run format          # Prettier
npm run format:check    # Prettier em modo verificacao
npm run verificar-tipos # tsc sem emitir
```

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
- Não remover indicador de foco.
- Não usar `dangerouslySetInnerHTML` com conteúdo da API.

---

## Identidade visual

Azul `#004E98` e turquesa `#73F1DD` são as cores reais da marca, extraídas da arte oficial. O mascote está em `docs/dentinho.png`.

A relação vem do próprio Dentinho — **turquesa preenche, azul contorna**:

- Botão primário: fundo `#004E98`, texto branco (8.3:1)
- Botão de ação: fundo `#73F1DD`, texto `#002D57` (10.2:1)
- **Texto branco sobre turquesa claro é proibido** — o turquesa da marca tem luminosidade 70%

Detalhes e escalas completas em `docs/design.md`.
