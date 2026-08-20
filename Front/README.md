# Front — Você no Coração da Gente

Frontend do e-commerce de supermercado. React, TypeScript `strict` e Vite.

O contexto do produto vive na raiz do repositório: `docs/prd.md` (escopo, requisitos e fases),
`docs/design.md` (tokens e componentes), `docs/behavior.md` (comportamento de tela) e
`docs/models.md` (contratos de dados). As convenções de código estão em `CLAUDE.md`.

## Comandos

```
npm run dev             # servidor de desenvolvimento em http://localhost:5173
npm run build           # verificação de tipos + build de produção
npm run test            # Vitest
npm run test:coverage   # Vitest com cobertura
npm run lint            # ESLint
npm run format          # Prettier
```

## Variáveis de ambiente

| Variável | Valores | Efeito |
|---|---|---|
| `VITE_API_MODE` | `mock` ou `http` | Liga ou desliga o worker do MSW (a partir da F1) |
| `VITE_API_BASE_URL` | URL | Base do cliente HTTP |

Os padrões de desenvolvimento estão em `.env.development`; copie `.env.example` para
`.env.local` para sobrescrever.

## Estrutura

```
src/
  app/          providers, layouts, router e páginas transversais (403, 404)
  features/     catalogo, autenticacao, carrinho, checkout, admin
  components/   ui/ (shadcn) + componentes de domínio compartilhados
  lib/          ambiente, http, erros, chaves de query, utils
  mocks/        handlers do MSW e fixtures
  types/        tipos do domínio, espelhando docs/models.md
  hooks/        hooks compartilhados
  test/         setup do Vitest e utilitários de renderização
```

Uma feature nunca importa de outra. O que for compartilhado sobe para `components/`, `lib/`
ou `hooks/`.

## Estado da fundação (F0)

Entregue: Vite com TypeScript `strict`, Tailwind com os tokens da marca em tema claro e
escuro, base do shadcn/ui, alias `@/`, ESLint e Prettier, Vitest com Testing Library,
cliente HTTP encapsulado com 401 e 403 tratados de formas diferentes, React Router com
layout base e as páginas 403 e 404.

A próxima fase (F1) monta o catálogo público sobre o MSW.
