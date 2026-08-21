# Design System

Identidade visual e padrões de interface do supermercado **"Você no Coração da Gente"**. Os tokens desta página colam direto em `index.css` e `tailwind.config.ts` na Fase 0.

> **Cores extraídas da arte oficial.** A paleta abaixo vem da arte do mascote e do logotipo do documento da prova, não de estimativa: azul `#004E98` e turquesa `#73F1DD` são os valores exatos usados no material da marca. A arte está em `docs/dentinho.png`.

## 1. Princípios

| Princípio | O que significa na prática |
|---|---|
| **Claro antes de bonito** | Preço, disponibilidade e total são sempre os elementos de maior contraste da tela |
| **Uma ação principal por vista** | Um único botão turquesa por tela; o resto é secundário ou fantasma |
| **Rápido percebido** | Skeleton com a forma do conteúdo real, nunca spinner genérico em lista |
| **Nunca deixar o usuário sem saída** | Todo estado vazio e todo erro trazem uma ação de recuperação |
| **Acessível por construção** | Contraste, foco e rótulo entram no componente base, não como correção depois |

**Personalidade da marca**: azul transmite confiança e higiene; turquesa traz frescor e movimento; o mascote Dentinho humaniza os momentos de erro, espera e celebração — onde a interface seria fria.

---

## 2. Paleta

As duas cores de marca saem direto do Dentinho: **turquesa é o corpo, azul é o contorno**. Toda a interface reproduz essa relação — superfície turquesa delimitada por azul.

### 2.1 Azul de marca (primária) — `hue 209`

Navegação, cabeçalhos, links, contorno, foco. O tom 700 é a cor oficial do logotipo.

| Token | HEX | HSL | Contraste sobre branco |
|---|---|---|---:|
| `marca-azul-50` | `#EBF5FF` | `209 100% 96%` | 1.10:1 |
| `marca-azul-100` | `#D1E9FF` | `209 100% 91%` | 1.25:1 |
| `marca-azul-200` | `#A3D3FF` | `209 100% 82%` | 1.58:1 |
| `marca-azul-300` | `#6BB8FF` | `209 100% 71%` | 2.12:1 |
| `marca-azul-400` | `#2997FF` | `209 100% 58%` | 3.02:1 |
| `marca-azul-500` | `#0077E6` | `209 100% 45%` | 4.39:1 |
| `marca-azul-600` | `#0061BD` | `209 100% 37%` | 6.10:1 |
| **`marca-azul-700`** | **`#004E98`** | **`209 100% 30%`** | **8.26:1** |
| `marca-azul-800` | `#003F7A` | `209 100% 24%` | 10.54:1 |
| `marca-azul-900` | `#002D57` | `209 100% 17%` | 13.88:1 |

`marca-azul-700` `#004E98` é a **cor oficial**: logotipo e contorno do mascote.

### 2.2 Turquesa de marca (secundária, ação) — `hue 170`

Preenchimento de marca e chamadas para ação de conversão. O tom 300 é a cor do corpo do Dentinho.

| Token | HEX | HSL | Contraste sobre branco |
|---|---|---|---:|
| `marca-turquesa-50` | `#E8FDF9` | `170 82% 95%` | 1.06:1 |
| `marca-turquesa-100` | `#CCFAF2` | `170 82% 89%` | 1.13:1 |
| `marca-turquesa-200` | `#A2F6E8` | `170 82% 80%` | 1.24:1 |
| **`marca-turquesa-300`** | **`#73F1DD`** | **`170 82% 70%`** | **1.37:1** |
| `marca-turquesa-400` | `#3EEACD` | `170 80% 58%` | 1.52:1 |
| `marca-turquesa-500` | `#11C5A7` | `170 84% 42%` | 2.19:1 |
| `marca-turquesa-600` | `#0A9E86` | `170 88% 33%` | 3.36:1 |
| `marca-turquesa-700` | `#077E6A` | `170 90% 26%` | 5.00:1 |
| `marca-turquesa-800` | `#056152` | `170 90% 20%` | 7.40:1 |
| `marca-turquesa-900` | `#044339` | `170 88% 14%` | 11.25:1 |

`marca-turquesa-300` `#73F1DD` é a **cor oficial**: corpo do mascote.

### 2.3 Consequência importante da paleta real

O turquesa da marca é **claro** (luminosidade 70%). Isso define o botão de ação:

> **Botão de ação = fundo `marca-turquesa-300` com texto `marca-azul-900`.** Dá 10.2:1 e reproduz exatamente a relação visual do mascote. Texto branco sobre turquesa é proibido em qualquer tom claro da escala.

### 2.4 Neutros — escala `neutro`, `hue 200 → 209`

**Não é `slate`.** Cinza puro apaga a marca justamente onde ela tem mais área: fundo de página, borda, texto de apoio. A escala neutra carrega uma tinta das duas cores da marca — o matiz desliza de 200 (turquesa-azul) nos tons claros até 209 (o azul do logotipo) nos escuros. O efeito é uma superfície que já parece da marca antes de qualquer componente colorido entrar.

| Token | HEX | HSL | Sobre `neutro-50` | Sobre `neutro-950` |
|---|---|---|---:|---:|
| `neutro-50` | `#FBFDFE` | `200 60% 99%` | — | 18.49:1 |
| `neutro-100` | `#F0F7FA` | `195 50% 96%` | 1.06:1 | 17.42:1 |
| `neutro-200` | `#DEEDF2` | `196 45% 91%` | 1.18:1 | 15.72:1 |
| `neutro-300` | `#CBE3EB` | `196 45% 86%` | 1.31:1 | 14.13:1 |
| `neutro-400` | `#8EB1C2` | `200 30% 66%` | 2.23:1 | 8.28:1 |
| `neutro-500` | `#668CA3` | `203 25% 52%` | 3.52:1 | 5.25:1 |
| `neutro-600` | `#4D6A80` | `205 25% 40%` | 5.58:1 | 3.31:1 |
| `neutro-700` | `#344C60` | `207 30% 29%` | 8.76:1 | 2.11:1 |
| `neutro-800` | `#1C2F40` | `209 40% 18%` | 13.45:1 | 1.37:1 |
| `neutro-900` | `#0F1C29` | `209 47% 11%` | 16.89:1 | 1.09:1 |
| `neutro-950` | `#07121D` | `209 60% 7%` | 18.49:1 | — |

**Papéis fixos**: `neutro-50` é o fundo no tema claro e `neutro-950` no escuro; `neutro-900` e `neutro-100` são o texto principal de cada tema; `neutro-600` e `neutro-400` são o texto de apoio; `neutro-300` é a borda clara.

**Limites**: do 50 ao 400 a escala é fundo, borda e preenchimento — nunca texto sobre claro. `neutro-500` a 3.52:1 serve para ícone e borda, não para texto corrido. Texto sobre claro começa em `neutro-600`.

Duas superfícies fogem da escala de propósito, porque puxam para o turquesa:

| Superfície | HSL | HEX | Uso |
|---|---|---|---|
| `--muted` | `190 45% 94%` | `#E9F4F7` | Apoio, rodapé de cartão, linha alternada |
| `--accent` | `170 75% 88%` | `#C9F7F0` | Hover de item de lista, destaque suave |

E o **cartão continua branco puro** (`#FFFFFF`): sobre o fundo levemente tingido ele levanta sozinho, sem precisar de sombra pesada.

### 2.5 Semânticos

| Papel | Preenchimento | Texto sobre claro | Uso |
|---|---|---|---|
| Sucesso | `#16A34A` | `#15803D` | Pedido aprovado, entrada de estoque |
| Alerta | `#D97706` | `#B45309` | Estoque baixo, aviso de mudança de preço |
| Erro | `#DC2626` | `#DC2626` | Pagamento recusado, validação, saída de estoque |
| Informação | `#004E98` | `#004E98` | Avisos neutros — reusa o azul de marca |

Verde e âmbar têm **dois** valores: o tom 500 serve para preenchimento, ícone e borda (passa os 3:1 de elemento de interface); o tom 700 serve para texto sobre fundo claro (passa os 4.5:1).

### 2.6 Regra de uso

- **Azul** estrutura: header, links, títulos, contorno, foco.
- **Turquesa** preenche e converte. Um botão de ação turquesa por vista — se há dois, um está errado.
- **Neutros** carregam o conteúdo, mas nunca são cinza puro — a escala `neutro` já é tingida, então o fundo, a borda e o texto de apoio ficam do lado da marca sem gritar. Cor de marca **saturada** em texto corrido continua sendo ruído.
- **Superfície de marca** (seção 4.3) é onde o azul aparece em bloco: cabeçalho e rodapé. Fora dali, azul é contorno e texto, não fundo de área grande.
- Cor nunca é o **único** portador de informação: estoque baixo é cor **mais** rótulo; erro é cor **mais** ícone **mais** texto.

---

## 3. Contraste — pares aprovados

Valores calculados pela fórmula WCAG 2.1 sobre os hex reais. Todo par abaixo é seguro; combinação fora desta tabela precisa ser verificada antes de entrar no código.

| Frente | Fundo | Razão | Nível | Uso |
|---|---|---:|---|---|
| `neutro-100` `#F0F7FA` | `neutro-950` `#07121D` | 17.4:1 | AAA | Texto principal, tema escuro |
| `neutro-900` `#0F1C29` | `neutro-50` `#FBFDFE` | 16.9:1 | AAA | Título e texto principal, tema claro |
| branco | `marca-azul-900` `#002D57` | 13.9:1 | AAA | **Rodapé** e cabeçalho no tema escuro |
| `marca-turquesa-300` `#73F1DD` | `neutro-950` `#07121D` | 13.8:1 | AAA | Ação no tema escuro |
| `marca-turquesa-200` `#A2F6E8` | `marca-azul-900` `#002D57` | 11.2:1 | AAA | Apoio no rodapé |
| `marca-azul-900` `#002D57` | `marca-turquesa-300` `#73F1DD` | 10.2:1 | AAA | **Botão de ação** |
| `marca-turquesa-300` `#73F1DD` | `marca-azul-900` `#002D57` | 10.2:1 | AAA | Foco e item ativo no rodapé |
| `marca-azul-700` `#004E98` | `accent` `#C9F7F0` | 9.8:1 | AAA | Item de lista em hover |
| `marca-azul-300` `#6BB8FF` | `neutro-950` `#07121D` | 8.9:1 | AAA | Primário no tema escuro |
| `marca-azul-700` `#004E98` | branco | 8.3:1 | AAA | Link, texto de marca |
| `neutro-400` `#8EB1C2` | `neutro-950` `#07121D` | 8.3:1 | AAA | Texto de apoio, tema escuro |
| branco | `marca-azul-700` `#004E98` | 8.3:1 | AAA | **Botão primário** e **cabeçalho**, tema claro |
| `marca-azul-700` `#004E98` | `marca-turquesa-50` `#E8FDF9` | 7.8:1 | AAA | Destaque suave, aviso informativo |
| `marca-azul-600` `#0061BD` | branco | 6.1:1 | AA | Link em hover |
| `marca-azul-700` `#004E98` | `marca-turquesa-300` `#73F1DD` | 6.0:1 | AA | Botão de ação, variante mais suave |
| `marca-turquesa-300` `#73F1DD` | `marca-azul-700` `#004E98` | 6.0:1 | AA | Item ativo e **anel de foco** no cabeçalho |
| `neutro-600` `#4D6A80` | `neutro-50` `#FBFDFE` | 5.6:1 | AA | Texto de apoio, tema claro |
| `neutro-600` `#4D6A80` | `muted` `#E9F4F7` | 5.1:1 | AA | Texto de apoio sobre superfície de apoio |
| branco | `marca-turquesa-700` `#077E6A` | 5.0:1 | AA | Ação em superfície escura |
| `#15803D` | branco | 5.0:1 | AA | Texto de sucesso |
| `#B45309` | branco | 5.0:1 | AA | Texto de alerta |
| `#DC2626` | branco | 4.8:1 | AA | Texto de erro |

### Regras que saem daí

1. **`marca-azul-500` `#0077E6` dá 4.39:1 sobre branco e reprova para texto.** Serve como preenchimento e borda, nunca como cor de link ou de texto. Para texto de marca, usar `marca-azul-700`; para hover, `marca-azul-600`.
2. **Texto branco sobre turquesa claro é proibido.** Do 50 ao 400 a escala turquesa é clara demais; o texto ali é `marca-azul-900`. Branco só a partir de `marca-turquesa-700`.
3. **`sucesso` e `alerta` no tom 500 não servem para texto** sobre fundo claro. Para texto, os tons 700 da seção 2.5.
4. O anel de foco usa `marca-azul-700`, que atinge 8.3:1 sobre branco — muito acima dos 3:1 exigidos.
5. **Sobre a superfície de marca o anel de foco inverte.** Azul sobre azul some, então ali o anel é `marca-turquesa-300`: 6.0:1 sobre `marca-azul-700` e 10.2:1 sobre `marca-azul-900`. A troca é feita uma vez, redefinindo `--ring` na classe `.superficie-marca` — nenhum componente precisa saber disso.
6. **`neutro-500` para baixo não é cor de texto** sobre fundo claro. Do 50 ao 400 é fundo, borda e preenchimento; texto começa em `neutro-600`.

---

## 4. Tokens — cole na Fase 0

### 4.1 `index.css`

```css
@layer base {
  :root {
    /* Neutros tingidos de marca (escala `neutro`, docs/design.md 2.4): nenhuma
       superficie e cinza puro, entao o azul e o turquesa aparecem tambem onde
       nao existe componente colorido. */
    --background: 200 60% 99%; /* neutro-50  #FBFDFE */
    --foreground: 209 47% 11%; /* neutro-900 #0F1C29 */

    /* Cartao em branco puro para levantar do fundo tingido. */
    --card: 0 0% 100%;
    --card-foreground: 209 47% 11%;
    --popover: 0 0% 100%;
    --popover-foreground: 209 47% 11%;

    /* marca-azul-700 #004E98 — cor oficial do logotipo */
    --primary: 209 100% 30%;
    --primary-foreground: 0 0% 100%;

    /* marca-turquesa-300 #73F1DD — cor do corpo do Dentinho */
    --secondary: 170 82% 70%;
    --secondary-foreground: 209 100% 17%;

    /* Superficie de apoio puxada para o turquesa. neutro-600 sobre ela: 5.08:1 */
    --muted: 190 45% 94%; /* #E9F4F7 */
    --muted-foreground: 205 25% 40%; /* neutro-600 #4D6A80 */

    /* Turquesa visivel, nao quase-branco. Par com o azul abaixo: 9.81:1 */
    --accent: 170 75% 88%; /* #C9F7F0 */
    --accent-foreground: 209 100% 22%;

    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;

    --sucesso: 142 76% 36%;
    --sucesso-foreground: 0 0% 100%;
    --alerta: 32 95% 44%;
    --alerta-foreground: 0 0% 100%;

    --border: 196 45% 86%; /* neutro-300 #CBE3EB */
    --input: 196 45% 86%;
    --ring: 209 100% 30%;

    --radius: 0.75rem;
  }

  .dark {
    /* Escuro ancorado em azul-marinho, nao em preto neutro. */
    --background: 209 60% 7%; /* neutro-950 #07121D */
    --foreground: 195 50% 96%; /* neutro-100 #F0F7FA — 17.4:1 */

    --card: 209 45% 11%;
    --card-foreground: 195 50% 96%;
    --popover: 209 45% 11%;
    --popover-foreground: 195 50% 96%;

    /* marca-azul-300 #6BB8FF */
    --primary: 209 100% 71%;
    --primary-foreground: 209 100% 17%;

    /* marca-turquesa-300 #73F1DD — mesma cor, o mascote nao muda */
    --secondary: 170 82% 70%;
    --secondary-foreground: 209 100% 17%;

    --muted: 209 35% 17%;
    --muted-foreground: 200 30% 66%; /* neutro-400 #8EB1C2 — 8.28:1 */

    --accent: 170 70% 18%;
    --accent-foreground: 170 82% 78%;

    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;

    --sucesso: 142 69% 45%;
    --sucesso-foreground: 143 64% 10%;
    --alerta: 38 92% 50%;
    --alerta-foreground: 26 83% 12%;

    --border: 200 30% 24%;
    --input: 200 30% 24%;
    --ring: 209 100% 71%;
  }
}
```

### 4.2 `tailwind.config.ts`

```ts
theme: {
  extend: {
    colors: {
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
      primary: {
        DEFAULT: 'hsl(var(--primary))',
        foreground: 'hsl(var(--primary-foreground))',
      },
      secondary: {
        DEFAULT: 'hsl(var(--secondary))',
        foreground: 'hsl(var(--secondary-foreground))',
      },
      muted: {
        DEFAULT: 'hsl(var(--muted))',
        foreground: 'hsl(var(--muted-foreground))',
      },
      accent: {
        DEFAULT: 'hsl(var(--accent))',
        foreground: 'hsl(var(--accent-foreground))',
      },
      destructive: {
        DEFAULT: 'hsl(var(--destructive))',
        foreground: 'hsl(var(--destructive-foreground))',
      },
      sucesso: {
        DEFAULT: 'hsl(var(--sucesso))',
        foreground: 'hsl(var(--sucesso-foreground))',
      },
      alerta: {
        DEFAULT: 'hsl(var(--alerta))',
        foreground: 'hsl(var(--alerta-foreground))',
      },
      border: 'hsl(var(--border))',
      input: 'hsl(var(--input))',
      ring: 'hsl(var(--ring))',
      neutro: {
        50: '#FBFDFE', 100: '#F0F7FA', 200: '#DEEDF2', 300: '#CBE3EB',
        400: '#8EB1C2', 500: '#668CA3', 600: '#4D6A80', 700: '#344C60',
        800: '#1C2F40', 900: '#0F1C29', 950: '#07121D',
      },
      marca: {
        azul: {
          50: '#EBF5FF', 100: '#D1E9FF', 200: '#A3D3FF', 300: '#6BB8FF',
          400: '#2997FF', 500: '#0077E6', 600: '#0061BD', 700: '#004E98',
          800: '#003F7A', 900: '#002D57',
        },
        turquesa: {
          50: '#E8FDF9', 100: '#CCFAF2', 200: '#A2F6E8', 300: '#73F1DD',
          400: '#3EEACD', 500: '#11C5A7', 600: '#0A9E86', 700: '#077E6A',
          800: '#056152', 900: '#044339',
        },
      },
    },
    borderRadius: {
      lg: 'var(--radius)',
      md: 'calc(var(--radius) - 2px)',
      sm: 'calc(var(--radius) - 4px)',
    },
  },
}
```


### 4.3 Superfície de marca

Os tokens acima tingem as superfícies, mas quem faz a marca aparecer de fato são as duas barras que emolduram toda página: **cabeçalho e rodapé em azul sólido**. É a maior área de cor da interface e a única em que o azul é fundo, não contorno.

| Elemento | Tema claro | Tema escuro |
|---|---|---|
| Cabeçalho | `marca-azul-700` `#004E98` | `marca-azul-900` `#002D57` |
| Rodapé | `marca-azul-900` `#002D57` | `marca-azul-900` `#002D57` |
| Texto | branco — 8.3:1 e 13.9:1 | idem |
| Item ativo, foco | `marca-turquesa-300` — 6.0:1 e 10.2:1 | idem |
| Fio de assinatura | gradiente turquesa 300 → 400 → azul 400, 2 px | idem |

A classe redefine os tokens localmente, então nenhum componente filho precisa saber que está sobre azul:

```css
@layer components {
  /**
   * Superficie de marca — barra azul solida do cabecalho e do rodape.
   *
   * Redefine tokens localmente porque sobre azul escuro o anel de foco azul
   * sumiria. Ali quem marca o foco e o turquesa: 6.04:1 sobre `marca-azul-700`
   * e 10.15:1 sobre `marca-azul-900`, muito acima dos 3:1 exigidos para
   * elemento nao textual. Ver docs/design.md secao 3.
   */
  .superficie-marca {
    --ring: 170 82% 70%;
    --border: 209 100% 22%;
    @apply bg-marca-azul-700 text-white dark:bg-marca-azul-900;
  }
}
```

**Regras**

- O turquesa **não** vira botão no cabeçalho. Ele fica reservado à ação de conversão (seção 8.4) — se aparecer em "Cadastrar", passa a competir com "Adicionar ao carrinho".
- Botão sobre a superfície nunca usa `text-primary`: some no fundo. Use branco, ou contorno branco.
- O `ring-offset` de quem está sobre a barra é a própria cor da barra, não `--background`.
- O rodapé é um degrau mais escuro que o cabeçalho no tema claro. Isso fecha a página sem repetir exatamente o topo.

## 5. Tipografia

**Família**: Inter, com pilha de fallback do sistema. Uma família só — sem fonte decorativa.

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
```

Números tabulares em preço, total e quantidade, para as colunas não dançarem:

```css
font-variant-numeric: tabular-nums;
```

| Papel | Classe | Tamanho / entrelinha | Peso |
|---|---|---|---|
| Título de página | `text-3xl` | 30 / 36 px | 700 |
| Título de seção | `text-xl` | 20 / 28 px | 600 |
| Nome de produto no cartão | `text-base` | 16 / 24 px | 500 |
| Corpo | `text-base` | 16 / 24 px | 400 |
| Apoio, metadados | `text-sm` | 14 / 20 px | 400 |
| Rótulo de campo | `text-sm` | 14 / 20 px | 500 |
| Selo, legenda | `text-xs` | 12 / 16 px | 500 |
| Preço no cartão | `text-lg` | 18 / 28 px | 700 |
| Preço na página do produto | `text-3xl` | 30 / 36 px | 700 |

**Regras**: 16 px é o mínimo para texto de leitura; `text-xs` só em selo e legenda, nunca em texto corrido. Linha de texto longo limitada a `max-w-prose`. Título nunca só por tamanho — a hierarquia semântica de `h1` a `h3` é obrigatória e nunca pulada.

---

## 6. Espaçamento, forma e elevação

**Escala de 4 px** — só múltiplos de 4 (`1` = 4 px, `2` = 8, `3` = 12, `4` = 16, `6` = 24, `8` = 32, `12` = 48, `16` = 64).

| Contexto | Espaçamento |
|---|---|
| Interno de campo e botão | `px-4 py-2` |
| Interno de cartão | `p-4` |
| Entre cartões na grade | `gap-4` |
| Entre seções da página | `space-y-8` |
| Margem lateral da página | `px-4` no celular, `px-6` no tablet, `px-8` no desktop |
| Largura máxima do conteúdo | `max-w-7xl` centralizado |

**Raio**: `--radius: 0.75rem` (12 px) em cartão e modal; 8 px em botão e campo; `rounded-full` em selo e avatar.

**Elevação** — três níveis, e só:

| Nível | Classe | Uso |
|---|---|---|
| Repouso | `shadow-sm` | Cartão de produto |
| Levantado | `shadow-md` | Cartão em hover, barra de resumo fixa |
| Sobreposto | `shadow-lg` | Modal, dropdown, toast |

**Breakpoints** (padrão Tailwind): `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280.

Grade do catálogo: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`.

---

---

## 7. Mascote Dentinho

**Arquivo**: `docs/dentinho.png` — 1104 × 1109 px, PNG com transparência.

### 7.1 A arte

Dentinho é o castor de pelúcia que é mascote da rede desde os anos 90 — hoje exposto ao lado do caderninho de capa azul na entrada da loja matriz. A arte disponível é o **rosto frontal**: cabeça em formato de escudo, duas orelhas arredondadas, dois olhos, focinho e os dois dentes frontais que dão nome a ele.

Construção visual, que é a mesma regra da interface inteira:

| Elemento | Cor |
|---|---|
| Corpo e cabeça | `marca-turquesa-300` `#73F1DD` |
| Contorno, olhos e focinho | `marca-azul-700` `#004E98` |
| Dentes e brilho dos olhos | branco |

Só três cores, sem gradiente e sem sombra. Qualquer ilustração nova do sistema segue a mesma economia.

### 7.2 Onde aparece

O Dentinho ocupa os momentos em que a interface seria fria: espera, vazio, erro de sistema e celebração.

| Local | Tamanho |
|---|---|
| Carrinho vazio | 160 px |
| Busca ou filtro sem resultado | 128 px |
| Página 404 | 200 px |
| Página 403 | 200 px |
| Erro de carregamento | 128 px |
| Confirmação de pedido aprovado | 200 px |
| Cadastro concluído | 160 px |
| Header (marca) | 32 px |
| Hero da home | Livre |

### 7.3 Regras

- **Nunca** em pagamento recusado, erro de validação de formulário ou aviso de estoque insuficiente. Nesses momentos o usuário quer resolver o problema — a mascote ali soa como deboche.
- Tamanho mínimo de 32 px. Abaixo disso os dentes e os olhos viram ruído.
- Área livre ao redor de no mínimo 25% da altura da imagem.
- Sempre acompanhado de texto que explica o estado. A mascote **ilustra**, nunca **informa** sozinha.
- `alt` descritivo quando carrega significado; `alt=""` quando é decorativo ao lado de um texto que já diz tudo.
- Nunca distorcer proporção, girar, recolorir ou aplicar sombra.
- A arte funciona nos dois temas sem alteração: o turquesa claro tem 13.8:1 sobre `neutro-950` e o contorno azul segura a forma sobre branco.

### 7.4 Procedência e pendência

A arte foi **reconstruída** a partir da imagem embutida no PDF da prova, onde ela aparece como marca-d'água recortada na vertical (só a metade esquerda do rosto, a 35% de opacidade). O processo: extração do XObject, restauração da opacidade cheia e espelhamento no eixo de simetria detectado em `x = 608,5` — o mesmo eixo do vinco entre os dentes e do ponto mais baixo do queixo.

**Pendência**: se existir o arquivo original da marca, ele substitui `docs/dentinho.png`. A reconstrução é fiel em cor e forma, mas nasceu de um recorte — variantes de expressão (feliz, pensativo) não existem, então **todos os usos acima empregam a mesma arte neutra**. Se a marca fornecer variantes, atualizar esta seção mapeando cada estado à sua expressão.

## 8. Componentes

### 8.1 shadcn/ui por fase

| Fase | Componentes a instalar |
|---|---|
| F0 | `button`, `card`, `skeleton`, `separator`, `sonner` (toast) |
| F1 | `badge`, `select`, `input`, `pagination`, `aspect-ratio` |
| F2 | `form`, `label`, `alert`, `dropdown-menu`, `avatar` |
| F3 | `sheet`, `alert-dialog`, `tooltip` |
| F4 | `radio-group`, `progress`, `accordion` |
| F5 | `table`, `dialog`, `tabs`, `textarea`, `switch` |

### 8.2 Componentes de domínio

Todos em `Front/src/components/` ou dentro da feature, nomeados em português.

| Componente | Responsabilidade |
|---|---|
| `CartaoProduto` | Imagem, nome, preço, unidade, selo de estoque, ação de compra |
| `FiltroCategorias` | Lista de categorias com estado ativo e opção de limpar |
| `LinhaItemCarrinho` | Item do carrinho com seletor de quantidade e remoção |
| `SeletorQuantidade` | Menos, número, mais — com limite de estoque e rótulo acessível |
| `Preco` | Converte centavos e formata em BRL, com números tabulares |
| `SeloEstoque` | Disponível, últimas unidades ou indisponível — cor **mais** texto |
| `CampoDocumento` | Input de CPF ou CNPJ com máscara automática |
| `CampoIdentificador` | Input de login que aceita email, CPF ou CNPJ |
| `Permitir` | Renderiza os filhos apenas se a sessão tiver o papel exigido |
| `RotaProtegida` | Guarda de rota por papel, com destino de retorno |
| `EstadoVazio` | Mascote, título, texto e ação de recuperação |
| `EstadoErro` | Mensagem e botão de nova tentativa |
| `ResumoPedido` | Itens, subtotal, frete e total |

### 8.3 Estados obrigatórios

Todo componente interativo implementa os seis:

| Estado | Tratamento |
|---|---|
| Padrão | Tokens da seção 4 |
| Hover | Um degrau mais escuro; nunca só mudança de opacidade |
| Foco | `ring-2 ring-ring ring-offset-2` — **nunca** removido sem substituto visível |
| Desabilitado | `opacity-50` mais `cursor-not-allowed`, com `aria-disabled` |
| Carregando | Largura preservada para não saltar; `aria-busy` |
| Erro | Borda `destructive`, ícone, texto ligado por `aria-describedby` |

### 8.4 Botões

| Variante | Aparência | Quando |
|---|---|---|
| `acao` | Fundo `secondary` (turquesa) com texto escuro | Conversão: adicionar ao carrinho, finalizar, pagar. **Um por vista** |
| `primario` | Fundo `primary` (azul) com texto branco | Ação principal não comercial: entrar, cadastrar, salvar |
| `secundario` | Contorno, texto `primary` | Ação alternativa |
| `fantasma` | Sem fundo nem borda | Ação terciária, navegação interna |
| `destrutivo` | Fundo `destructive` | Remover item, desativar categoria |

---

## 9. Padrões de estado de tela

| Situação | Padrão |
|---|---|
| Carregando lista | **Skeleton** com a forma dos cartões, na mesma quantidade da página. Nunca spinner |
| Carregando ação | Botão com rótulo trocado e `aria-busy`, largura preservada |
| Lista vazia por filtro | Mascote pensativo, "Nenhum produto nesta categoria", botão para limpar o filtro |
| Carrinho vazio | Mascote pensativo, texto, botão para o catálogo |
| Erro de carregamento | Mascote pensativo, mensagem legível, botão "Tentar de novo" |
| Erro de formulário | Sem mascote. Erro no campo, foco no primeiro campo inválido, resumo em `aria-live` |
| Pagamento recusado | Sem mascote. Motivo da recusa e botão para tentar de novo |
| Sucesso de pedido | Mascote feliz, número do pedido em destaque |
| Ação do carrinho | Toast de 4 s, anunciado por `aria-live="polite"` |

---

## 10. Movimento

- Transições de 150 a 200 ms; nada acima de 300 ms.
- Só `transform` e `opacity` — nunca animar `width`, `height` ou `top`.
- Skeleton com pulsação suave, sem brilho deslizante.
- **Respeitar `prefers-reduced-motion`**: quando ativo, todas as transições caem para 0.01 ms e o skeleton para de pulsar.
