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

### 2.4 Neutros

Escala `slate` do Tailwind, sem customização. Texto, bordas, fundos e superfícies.

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
- **Neutros** carregam o conteúdo. Cor de marca em texto corrido é ruído.
- Cor nunca é o **único** portador de informação: estoque baixo é cor **mais** rótulo; erro é cor **mais** ícone **mais** texto.

---

## 3. Contraste — pares aprovados

Valores calculados pela fórmula WCAG 2.1 sobre os hex reais. Todo par abaixo é seguro; combinação fora desta tabela precisa ser verificada antes de entrar no código.

| Frente | Fundo | Razão | Nível | Uso |
|---|---|---:|---|---|
| `slate-900` `#0F172A` | branco | 17.9:1 | AAA | Título e texto principal |
| `marca-azul-900` `#002D57` | `marca-turquesa-300` `#73F1DD` | 10.2:1 | AAA | **Botão de ação** |
| `marca-azul-700` `#004E98` | branco | 8.3:1 | AAA | Link, texto de marca |
| branco | `marca-azul-700` `#004E98` | 8.3:1 | AAA | **Botão primário** |
| `marca-azul-700` `#004E98` | `marca-turquesa-50` `#E8FDF9` | 7.8:1 | AAA | Destaque suave, aviso informativo |
| `slate-600` `#475569` | branco | 7.6:1 | AAA | Texto secundário |
| `marca-azul-600` `#0061BD` | branco | 6.1:1 | AA | Link em hover |
| `marca-azul-700` `#004E98` | `marca-turquesa-300` `#73F1DD` | 6.0:1 | AA | Botão de ação, variante mais suave |
| branco | `marca-turquesa-700` `#077E6A` | 5.0:1 | AA | Ação em superfície escura |
| `#15803D` | branco | 5.0:1 | AA | Texto de sucesso |
| `#B45309` | branco | 5.0:1 | AA | Texto de alerta |
| `#DC2626` | branco | 4.8:1 | AA | Texto de erro |
| `marca-turquesa-300` `#73F1DD` | `slate-950` `#020617` | 14.8:1 | AAA | Ação no tema escuro |
| `marca-azul-300` `#6BB8FF` | `slate-950` `#020617` | 9.5:1 | AAA | Primário no tema escuro |

### Regras que saem daí

1. **`marca-azul-500` `#0077E6` dá 4.39:1 sobre branco e reprova para texto.** Serve como preenchimento e borda, nunca como cor de link ou de texto. Para texto de marca, usar `marca-azul-700`; para hover, `marca-azul-600`.
2. **Texto branco sobre turquesa claro é proibido.** Do 50 ao 400 a escala turquesa é clara demais; o texto ali é `marca-azul-900`. Branco só a partir de `marca-turquesa-700`.
3. **`sucesso` e `alerta` no tom 500 não servem para texto** sobre fundo claro. Para texto, os tons 700 da seção 2.5.
4. O anel de foco usa `marca-azul-700`, que atinge 8.3:1 sobre branco — muito acima dos 3:1 exigidos.

---

## 4. Tokens — cole na Fase 0

### 4.1 `index.css`

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;

    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --popover: 0 0% 100%;
    --popover-foreground: 222 47% 11%;

    /* marca-azul-700 #004E98 — cor oficial do logotipo */
    --primary: 209 100% 30%;
    --primary-foreground: 0 0% 100%;

    /* marca-turquesa-300 #73F1DD — cor do corpo do Dentinho */
    --secondary: 170 82% 70%;
    --secondary-foreground: 209 100% 17%;

    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 47%;

    --accent: 170 82% 95%;
    --accent-foreground: 209 100% 30%;

    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;

    --sucesso: 142 76% 36%;
    --sucesso-foreground: 0 0% 100%;
    --alerta: 32 95% 44%;
    --alerta-foreground: 0 0% 100%;

    --border: 214 32% 91%;
    --input: 214 32% 91%;
    --ring: 209 100% 30%;

    --radius: 0.75rem;
  }

  .dark {
    --background: 229 84% 5%;
    --foreground: 210 40% 96%;

    --card: 222 47% 8%;
    --card-foreground: 210 40% 96%;
    --popover: 222 47% 8%;
    --popover-foreground: 210 40% 96%;

    /* marca-azul-300 #6BB8FF */
    --primary: 209 100% 71%;
    --primary-foreground: 209 100% 17%;

    /* marca-turquesa-300 #73F1DD — mesma cor, o mascote nao muda */
    --secondary: 170 82% 70%;
    --secondary-foreground: 209 100% 17%;

    --muted: 217 33% 17%;
    --muted-foreground: 215 20% 65%;

    --accent: 170 90% 20%;
    --accent-foreground: 170 82% 80%;

    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;

    --sucesso: 142 69% 45%;
    --sucesso-foreground: 143 64% 10%;
    --alerta: 38 92% 50%;
    --alerta-foreground: 26 83% 12%;

    --border: 217 33% 20%;
    --input: 217 33% 20%;
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
- A arte funciona nos dois temas sem alteração: o turquesa claro tem 14.8:1 sobre `slate-950` e o contorno azul segura a forma sobre branco.

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
