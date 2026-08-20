# Comportamento de Telas e Fluxos

Como cada tela se comporta e como os fluxos atravessam as telas. Complementa `docs/prd.md` (o quê) e `docs/models.md` (com quais dados).

Cada tela segue o mesmo esqueleto: **rota · papel · dados · estados · interações · validações · acessibilidade · casos de borda**.

---

## 1. Mapa de rotas

| Rota | Acesso | Tela | Fase |
|---|---|---|---|
| `/` | Público | Catálogo | F1 |
| `/produtos/:slug` | Público | Página do produto | F1 |
| `/login` | Apenas não autenticado | Login | F2 |
| `/cadastro` | Apenas não autenticado | Cadastro | F2 |
| `/carrinho` | `CLIENTE` | Carrinho | F3 |
| `/checkout` | `CLIENTE` | Endereço e resumo | F4 |
| `/checkout/pagamento` | `CLIENTE` | Pagamento | F4 |
| `/pedidos/:id/confirmacao` | `CLIENTE` | Confirmação | F4 |
| `/pedidos/:id` | `CLIENTE` | Status do pedido | F4 |
| `/admin/produtos` | `ADMIN` | Listagem administrativa | F5 |
| `/admin/produtos/novo` | `ADMIN` | Cadastro de produto | F5 |
| `/admin/produtos/:id/estoque` | `ADMIN` | Movimentação de estoque | F5 |
| `/admin/categorias` | `ADMIN` | Gestão de categorias | F5 |
| `/403` | Público | Acesso negado | F0 |
| `*` | Público | 404 | F0 |

**Rota de entrada por papel após o login**: `ADMIN` vai para `/admin/produtos`; `CLIENTE` volta para o destino guardado ou para `/`.

---

## 2. Header — comportamento transversal

O header é a manifestação mais visível do RBAC e reage a toda mudança de sessão.

| Elemento | VISITANTE | CLIENTE | ADMIN |
|---|:---:|:---:|:---:|
| Logo e busca | sim | sim | sim |
| Link do catálogo | sim | sim | sim |
| Ícone do carrinho com contador | **não** | sim | **não** |
| Botões Entrar e Cadastrar | sim | não | não |
| Menu do usuário com Sair | não | sim | sim |
| Link para a área administrativa | não | não | sim |

**Regras**
- O contador do carrinho só aparece com quantidade maior que zero, e é anunciado por `aria-live="polite"` quando muda.
- O menu do usuário mostra o nome e o email — **nunca** o documento.
- Sair limpa sessão e carrinho, invalida o cache de query e leva para `/`.
- No celular, a navegação vira `sheet`; o carrinho continua visível como ícone fixo.

---

## 3. Catálogo — `/`

**Papel**: público · **Dados**: `Pagina<Produto>`, `Categoria[]`

### Estados

| Estado | Tela |
|---|---|
| Carregando | 12 skeletons na forma dos cartões; o filtro carrega em paralelo |
| Sucesso | Grade de 2, 3 ou 4 colunas, paginação abaixo |
| Vazio por filtro | Mascote pensativo, "Nenhum produto nesta categoria", botão para limpar o filtro |
| Vazio por busca | Mascote pensativo, "Nenhum resultado para *termo*", botão para limpar a busca |
| Erro | Mascote pensativo, mensagem e botão "Tentar de novo" |

### Interações

- Clicar no cartão abre `/produtos/:slug`.
- Selecionar categoria aplica o filtro, **volta para a página 1** e atualiza a query string.
- Buscar aplica atraso de 300 ms antes de disparar a requisição, e também volta para a página 1.
- Ordenar atualiza a query string sem perder o filtro.
- Paginar preserva filtro, busca e ordenação, e rola para o topo da grade.
- Adicionar ao carrinho a partir do cartão: comportamento no fluxo 12.1.

### Estado na URL

Tudo em `ParametrosCatalogo` vive na query string: `/?categoria=bebidas&busca=suco&ordenacao=PRECO_ASC&pagina=1`.

Isso torna a listagem compartilhável, faz o botão voltar do navegador funcionar e sobrevive a recarregar a página. **A URL é a fonte de verdade do filtro** — não há estado duplicado em componente.

### Produto indisponível

`quantidadeEstoque === 0` → o cartão continua na grade, com `SeloEstoque` "Indisponível" e a ação de compra desabilitada com `aria-disabled`. Não some da listagem: sumir confunde quem chegou pelo link.

### Acessibilidade

- Grade é `ul` de `li`; cada cartão tem um único link acessível envolvendo nome e imagem.
- O filtro é um grupo de rádio com `fieldset` e `legend`, ou um `select` rotulado no celular.
- Mudança de resultado anunciada por `aria-live="polite"`: "12 produtos encontrados".
- Paginação com `aria-label="Paginação"` e a página atual marcada por `aria-current="page"`.

### Casos de borda

- `?categoria=inexistente` → estado vazio com ação de limpar, **nunca** erro 500 na cara do usuário.
- `?pagina=99` além do total → volta para a última página válida.
- Categoria desativada depois de o link ter sido compartilhado → estado vazio com explicação.
- Busca com apenas espaços → tratada como busca vazia, sem requisição.

---

## 4. Página do produto — `/produtos/:slug`

**Papel**: público · **Dados**: `Produto`

### Estados

| Estado | Tela |
|---|---|
| Carregando | Skeleton com a proporção real da imagem e blocos de texto |
| Sucesso | Imagem, nome, categoria, preço por unidade, descrição, selo de estoque, seletor de quantidade, ação de compra |
| Não encontrado | 404 com mascote e link para o catálogo |
| Indisponível | Conteúdo completo, ação desabilitada, aviso "Produto indisponível no momento" |

### Interações

- `SeletorQuantidade` inicia em 1, limitado ao estoque disponível.
- Adicionar ao carrinho: fluxo 12.1.
- Trilha de navegação: Catálogo, categoria, produto — a categoria leva ao catálogo já filtrado.

### Acessibilidade

- `h1` com o nome do produto; foco vai para ele ao entrar na rota.
- Preço lido por extenso para leitor de tela: "19 reais e 90 centavos".
- Quantidade com rótulo explícito e botões com `aria-label` "Diminuir" e "Aumentar".

### Casos de borda

- Slug inexistente → 404, não tela em branco.
- Produto inativo → 404 para o público; visível na área administrativa.
- Estoque cai para zero entre a listagem e a abertura → a página do produto mostra indisponível; o estado da listagem estava obsoleto e isso é aceitável.

---

## 5. Login — `/login`

**Papel**: apenas não autenticado · **Dados**: `RequisicaoLogin`, `RespostaAutenticacao`

A tela com mais regra do sistema, por causa do campo único.

### Campo identificador

Um input só, rotulado **"CPF, CNPJ ou e-mail"**, mais o campo de senha.

`detectarTipoIdentificador(valor)` roda a cada digitação:

| Condição, nesta ordem | Tipo | Efeito na interface |
|---|---|---|
| Contém `@` | `EMAIL` | Máscara removida, `inputMode="email"` |
| Só dígitos, 11 | `CPF` | Máscara `000.000.000-00` |
| Só dígitos, 14 | `CNPJ` | Máscara `00.000.000/0000-00` |
| Qualquer outro caso | indefinido | Sem máscara, sem erro até o `blur` |

**Regras de máscara**
- A máscara só se aplica enquanto o valor é numérico. Digitar `@` remove a máscara imediatamente e o campo passa a se comportar como email.
- A troca de CPF para CNPJ acontece sozinha ao passar do 11º dígito. O usuário nunca declara o tipo.
- A posição do cursor é preservada ao aplicar a máscara — inserir um dígito no meio não joga o cursor para o fim.

### Validação (Zod com `superRefine`)

1. Detecta o tipo do identificador.
2. `EMAIL` → valida formato de email.
3. `CPF` → valida dígito verificador.
4. `CNPJ` → valida dígito verificador.
5. Tipo indefinido → erro único: **"Informe um CPF, CNPJ ou e-mail válido."**

A validação roda no `blur` e no envio, nunca a cada tecla — não faz sentido acusar erro em um CPF pela metade.

### Normalização antes de enviar

- Documento: remove tudo que não é dígito.
- Email: `trim` e minúsculas.
- O corpo enviado é sempre `{ identificador, senha }`. **Nenhuma dica de tipo é enviada** — quem resolve o identificador é o backend.

### Estados

| Estado | Tela |
|---|---|
| Padrão | Formulário com dois campos e ação primária |
| Enviando | Botão desabilitado, rótulo "Entrando...", `aria-busy` |
| Erro de credencial | Alerta acima do formulário: **"Credenciais inválidas."** |
| Erro de rede | Alerta com botão de nova tentativa; o formulário mantém o que foi digitado |
| Sucesso | Redireciona conforme o fluxo 12.2 |

### Segurança

- A mensagem de erro é **sempre genérica**. Nunca "usuário não encontrado" ou "senha incorreta" — isso permitiria enumerar contas.
- O tempo de resposta do erro não deve variar de forma perceptível entre identificador inexistente e senha errada.
- O identificador **nunca** entra na query string, no log ou em chave de cache.

### Acessibilidade

- Campos com `label` associado, `autoComplete="username"` e `autoComplete="current-password"`.
- Erro de credencial em `role="alert"`, com o foco movido para ele.
- Erro por campo ligado por `aria-describedby`.
- Alternar a visibilidade da senha é um `button` com `aria-pressed`.

### Casos de borda

| Caso | Comportamento |
|---|---|
| Colar `529.982.247-25` | Normaliza para 11 dígitos, detecta CPF, valida |
| Colar `11.222.333/0001-81` | Normaliza para 14 dígitos, detecta CNPJ, valida |
| Espaços nas pontas | Removidos antes de detectar |
| `MARIA@EXEMPLO.COM` | Convertido para minúsculas |
| `11111111111` | Comprimento válido, dígito verificador inválido → erro |
| 12 ou 13 dígitos | Tipo indefinido → erro único |
| Já autenticado acessando `/login` | Redireciona para a rota de entrada do papel |
| Enter no campo de senha | Envia o formulário |

---

## 6. Cadastro — `/cadastro`

**Papel**: apenas não autenticado · **Dados**: `RequisicaoCadastro`

### Campos

| Campo | Regra |
|---|---|
| Nome | 3 a 120 caracteres. Rótulo "Nome completo ou razão social" |
| E-mail | Formato válido, minúsculas, único |
| CPF ou CNPJ | **Um campo só**, máscara automática, dígito verificador, único |
| Telefone | Opcional, 10 ou 11 dígitos com DDD |
| Senha | Mínimo 8 caracteres, com letra e número |
| Confirmar senha | Igual à senha — **só no front**, nunca enviada |

### O campo de documento

Mesma mecânica do login, sem a variante de email: máscara de CPF até o 11º dígito, troca sozinha para CNPJ ao chegar em 14. **Não há seletor de pessoa física ou jurídica** — o tipo é inferido pelo comprimento e nunca é persistido.

### Estados

| Estado | Tela |
|---|---|
| Padrão | Formulário |
| Enviando | Botão desabilitado com `aria-busy`; campos travados |
| Erro por campo | `errosPorCampo` do `ErroApi` mapeado direto em `setError` |
| Erro geral | Alerta acima do formulário |
| Sucesso | Autentica direto, mostra mascote feliz e leva ao destino guardado ou a `/` |

### Erros por campo vindos do backend

```json
{ "email": "Este e-mail já está cadastrado.", "documento": "Este documento já está cadastrado." }
```

Cada chave corresponde ao nome exato do campo no formulário, então o mapeamento é direto. O foco vai para o primeiro campo com erro.

### Acessibilidade

- `autoComplete` correto em cada campo: `name`, `email`, `tel`, `new-password`.
- Requisitos de senha visíveis **antes** de digitar, não só como erro depois.
- Resumo de erros em `aria-live="assertive"` no envio.

### Casos de borda

- Documento com 12 ou 13 dígitos → "Informe um CPF ou CNPJ válido".
- Email e documento já cadastrados ao mesmo tempo → os dois erros aparecem juntos.
- Enviar duas vezes rápido → segunda submissão bloqueada.
- Senha e confirmação diferentes → erro no campo de confirmação, não no de senha.

---

## 7. Carrinho — `/carrinho`

**Papel**: `CLIENTE` · **Dados**: `Carrinho`

### Estados

| Estado | Tela |
|---|---|
| Vazio | Mascote pensativo, "Seu carrinho está vazio", botão para o catálogo |
| Com itens | Lista de `LinhaItemCarrinho` e painel de resumo |
| Atualizando | A linha afetada fica com opacidade reduzida; os totais mostram o valor otimista |
| Erro de sincronização | A linha volta ao valor anterior e um toast explica |

### Interações

- **Alterar quantidade**: atualização otimista, com reversão se a requisição falhar. Teto igual ao menor valor entre 20 e o estoque disponível. Ao chegar em 0, remove com confirmação.
- **Remover item**: remoção imediata mais toast com "Desfazer" por 5 s.
- **Recalcular**: subtotal, frete e total são recalculados a cada mudança por uma função pura. Frete grátis acima de R$ 150,00.
- **Finalizar compra**: leva a `/checkout`. Desabilitado com carrinho vazio.

### Acessibilidade

- Lista como `ul` de `li`, cada item com o nome do produto como rótulo acessível.
- `SeletorQuantidade` com `aria-label` "Quantidade de *produto*".
- Mudança de total anunciada por `aria-live="polite"`.
- Remoção anunciada: "*Produto* removido do carrinho".
- Após remover, o foco vai para a próxima linha, ou para o estado vazio se não sobrar nenhuma.

### Casos de borda

| Caso | Comportamento |
|---|---|
| Estoque caiu abaixo da quantidade no carrinho | Ao entrar, a linha mostra aviso e a quantidade é ajustada para o disponível |
| Produto foi desativado | A linha mostra "Indisponível" e bloqueia o checkout até ser removida |
| Preço mudou desde que o item entrou | Aviso comparando o preço antigo e o novo, com opção de aceitar ou remover |
| Carrinho com estoque zerado em tudo | Botão de finalizar desabilitado, com explicação |
| Duas abas abertas | O store persistido sincroniza; a última escrita vence |

---

## 8. Checkout — `/checkout`

**Papel**: `CLIENTE` · **Dados**: `Endereco`, `Carrinho`

Primeira etapa: endereço e conferência.

### Comportamento

- **Ao entrar, revalida preço e estoque** (RF-CHK-08). Divergência bloqueia o avanço até o usuário decidir.
- Formulário de endereço com CEP, logradouro, número, complemento, bairro, cidade e UF.
- CEP normalizado para 8 dígitos, exibido como `00000-000`.
- Resumo do pedido lateral no desktop, abaixo no celular, com o total sempre visível.
- Avançar leva a `/checkout/pagamento`.

### Guardas

- Carrinho vazio ao acessar diretamente → redireciona para `/carrinho`.
- `ADMIN` acessando → `/403`.
- Não autenticado → `/login` preservando o destino.

### Acessibilidade

- Indicador de etapas com `aria-current="step"`.
- Campos agrupados em `fieldset` com `legend` "Endereço de entrega".
- `autoComplete`: `postal-code`, `address-line1`, `address-level2`.

---

## 9. Pagamento — `/checkout/pagamento`

**Papel**: `CLIENTE` · **Dados**: `RequisicaoPagamento`, `ResultadoPagamento`

### Estados

| Estado | Tela |
|---|---|
| Formulário | Campos do cartão e total em destaque |
| Processando | Tela dedicada, formulário travado, sem opção de voltar |
| Aprovado | Redireciona para `/pedidos/:id/confirmacao` |
| Recusado | Motivo da recusa e botão para tentar de novo, com o carrinho intacto |
| Erro de rede | "Não foi possível confirmar o pagamento", com orientação para não tentar de novo antes de verificar |

### Regras obrigatórias de segurança

- **Nenhum dado de cartão sai do estado do formulário.** Nunca em store, `localStorage`, `sessionStorage`, cache de query ou log.
- Os campos de cartão não entram em nenhuma chave de cache do TanStack Query.
- Ao desmontar a tela, o estado do formulário é descartado.
- Submissão duplicada bloqueada por travamento do botão mais verificação de requisição em andamento (RF-CHK-09).

### Regra do mock

| Final do número do cartão | Resultado |
|---|---|
| `0000` | `RECUSADO` — "Saldo insuficiente" |
| `1111` | `RECUSADO` — "Cartão expirado" |
| Qualquer outro | `APROVADO` |

### Casos de borda

- Recusa: o pedido fica `FALHOU` e é recuperável; o carrinho **não** é esvaziado.
- Erro de rede depois do envio: o desfecho é desconhecido. A tela orienta a verificar antes de tentar de novo, em vez de sugerir uma nova submissão que poderia duplicar a cobrança.
- Recarregar durante o processamento: ao voltar, consulta o estado do pedido em vez de reenviar.
- Sessão expira durante o pagamento: 401 leva ao login preservando o destino; o pedido permanece `PENDENTE`.

---

## 10. Confirmação — `/pedidos/:id/confirmacao`

**Papel**: `CLIENTE` · **Dados**: `Pedido`

- Mascote feliz, número do pedido em destaque, resumo dos itens, total, endereço de entrega.
- **O carrinho é esvaziado somente aqui**, depois da aprovação confirmada (RF-CHK-07).
- Ação para voltar ao catálogo.
- O documento do comprador aparece **mascarado**, no formato `***.456.789-**`.

### Casos de borda

- Acessar a confirmação de um pedido de outro usuário → `/403`.
- Pedido em estado `PENDENTE` ou `FALHOU` → mostra o estado real, não a confirmação de sucesso.
- Recarregar a página → funciona; a tela lê o pedido pelo id, não depende de estado em memória.

---

## 10.1. Status do pedido — `/pedidos/:id`

**Papel**: `CLIENTE` · **Dados**: `Pedido` · **Cobre**: RF-PED-01 a RF-PED-04

Tela de consulta, separada da confirmação. A confirmação é o desfecho imediato da compra; esta é a que o cliente reabre depois, pelo link ou pelo número do pedido.

| `status` | Como aparece | Ação disponível |
|---|---|---|
| `PENDENTE` | "Aguardando confirmação do pagamento" | Atualizar |
| `PAGO` | "Pagamento aprovado" com data | Voltar ao catálogo |
| `FALHOU` | "Pagamento recusado" com o motivo | **Tentar pagar de novo** |
| `CANCELADO` | "Pedido cancelado" | Voltar ao catálogo |

**Regras**
- Mostra itens congelados, totais, endereço e o documento do comprador **mascarado**.
- Pedido `PENDENTE` consulta o estado ao abrir; não faz polling agressivo.
- Pedido de outro usuário responde `/403` — nunca 404, que já entregaria a informação de que o pedido existe ou não.
- Em `FALHOU`, a nova tentativa reabre `/checkout/pagamento` com o mesmo pedido, sem recriar o carrinho.

---

## 11. Área administrativa

### 11.1 Listagem — `/admin/produtos`

Tabela com imagem, nome, categoria, preço, estoque, situação e ações. Filtro por categoria e por situação, busca por nome ou SKU, ordenação por estoque. Produtos inativos aparecem, sinalizados. Estoque baixo (10 ou menos) recebe destaque de `alerta` **com rótulo**, não só cor. No celular a tabela vira lista de cartões.

### 11.2 Cadastro de produto — `/admin/produtos/novo`

| Campo | Validação |
|---|---|
| Nome | 3 a 120 caracteres |
| SKU | 3 a 40 caracteres, único |
| Descrição | 10 a 2000 caracteres |
| Preço | Aceita "19,90" e converte para `1990` antes de enviar |
| Unidade | Select com os valores de `Unidade` |
| Categoria | Select alimentado pela API, mostrando apenas categorias ativas |
| Imagem | URL válida, com pré-visualização |
| Estoque inicial | Inteiro maior ou igual a zero |
| Ativo | Switch, padrão ligado |

Sair com alterações não salvas pede confirmação. Após salvar, volta para a listagem com toast e o produto novo em destaque.

### 11.3 Movimentação de estoque — `/admin/produtos/:id/estoque`

- Saldo atual em destaque.
- Escolha entre **Entrada** e **Saída**, quantidade e motivo obrigatório (3 a 200 caracteres).
- Pré-visualização do saldo resultante **antes** de confirmar.
- **Saída maior que o saldo é bloqueada** antes do envio, com mensagem clara. O backend valida de novo — o front apenas antecipa.
- Histórico abaixo, com tipo, quantidade, motivo, saldo anterior, saldo posterior, responsável e data.
- O histórico é imutável: para corrigir, registra-se uma movimentação contrária.

### 11.4 Categorias — `/admin/categorias`

- Lista ordenada por `ordem`, com nome, slug, quantidade de produtos e situação.
- Criar e renomear; o slug é gerado pelo backend e exibido como somente leitura.
- Ativar e desativar. Desativar categoria com produtos vinculados abre confirmação explicando que os produtos continuam vinculados, mas a categoria some do filtro público.
- Não há exclusão — apenas desativação, para preservar o vínculo histórico.

---

## 12. Fluxos ponta a ponta

### 12.1 Visitante tenta adicionar ao carrinho

```
Visitante clica em "Adicionar ao carrinho"
  -> sem sessao: guarda a intencao { produtoId, quantidade }
  -> navega para /login?retornarPara=%2Fprodutos%2Fbanana-prata-kg
  -> usuario faz login ou se cadastra
  -> sessao hidratada com papel CLIENTE
  -> a intencao guardada e consumida: item entra no carrinho
  -> volta para o destino guardado
  -> toast: "Banana Prata adicionada ao carrinho"
```

**Regras**
- A intenção é consumida **uma única vez** e descartada logo depois. Recarregar não adiciona de novo.
- Se o usuário autenticado for `ADMIN`, a intenção é descartada silenciosamente — admin não compra.
- Se o produto ficou indisponível nesse meio-tempo, a intenção é descartada e um aviso explica.
- **`retornarPara` só aceita caminho interno**: precisa começar com `/` e não pode começar com `//`. Qualquer outra coisa é substituída por `/`. Isso fecha a porta para open redirect (RNF-SEC-06).

### 12.2 Login monta a tela por papel

```
POST /autenticacao/login
  -> RespostaAutenticacao { token, expiraEm, usuario }
  -> decodificarToken(token) -> ClaimsJwt { sub, exp, email, nome, papeis }
  -> store de sessao hidratado (token em memoria, nao persistido)
  -> header, menu e roteador remontam
  -> destino:
       ADMIN                    -> /admin/produtos
       CLIENTE com retornarPara -> destino guardado
       CLIENTE sem retornarPara -> /
```

**Regras**
- O token vive **em memória**, no store Zustand, sem persistência (ver `docs/prd.md`, seção 8).
- Token malformado, expirado ou sem `papeis` → sessão anônima, sem exceção não capturada.
- Toda mudança de papel invalida o cache de query, para não vazar dado de uma sessão para a próxima.

### 12.3 Compra completa

```
Catalogo -> Produto -> Adicionar ao carrinho -> Carrinho
  -> Finalizar compra -> /checkout
  -> revalida preco e estoque
  -> preenche endereco -> /checkout/pagamento
  -> preenche cartao -> Processando
       APROVADO -> pedido PAGO -> carrinho esvaziado -> /pedidos/:id/confirmacao
       RECUSADO -> pedido FALHOU -> carrinho intacto -> nova tentativa
       ERRO DE REDE -> estado desconhecido -> orienta a verificar antes de repetir
```

### 12.4 Sessão expira durante ação protegida

```
Requisicao protegida -> 401
  -> interceptador limpa a sessao e o cache
  -> guarda o destino atual
  -> navega para /login?retornarPara=<destino>
  -> apos o login, retoma o destino
```

O carrinho persistido **não** é apagado nesse caminho — o usuário volta e encontra o que tinha montado.

### 12.5 Acesso negado por papel

```
CLIENTE navega para /admin/produtos
  -> RotaProtegida compara papeis com os exigidos
  -> nao autoriza
  -> /403, com a sessao PRESERVADA
```

**Nunca** tratar como 401. Derrubar a sessão de um usuário legitimamente logado por falta de permissão em uma rota é um bug de comportamento.

### 12.6 Admin repõe estoque

```
/admin/produtos -> produto com estoque baixo -> /admin/produtos/:id/estoque
  -> tipo ENTRADA, quantidade 50, motivo "Reposicao semanal"
  -> pre-visualiza: 70 -> 120
  -> confirma
  -> movimentacao registrada, saldo atualizado, historico atualizado
  -> toast de confirmacao
```

Para saída, a mesma sequência, com bloqueio antes do envio quando a quantidade excede o saldo.

---

## 13. Regras transversais

### 13.1 Navegação e foco

- A cada mudança de rota, o foco vai para o `h1` da nova tela.
- O título do documento muda a cada rota: "Carrinho · Você no Coração da Gente".
- Link "Pular para o conteúdo" como primeiro elemento focável da página.
- O botão voltar do navegador funciona em todo lugar; o estado de filtro está na URL.

### 13.2 Mensagens de erro

| Situação | Mensagem |
|---|---|
| Credencial inválida | "Credenciais inválidas." |
| Documento inválido | "Informe um CPF ou CNPJ válido." |
| Identificador inválido no login | "Informe um CPF, CNPJ ou e-mail válido." |
| Email já cadastrado | "Este e-mail já está cadastrado." |
| Documento já cadastrado | "Este documento já está cadastrado." |
| Estoque insuficiente | "Restam apenas *n* unidades deste produto." |
| Saída maior que o saldo | "A saída não pode ser maior que o saldo atual de *n*." |
| Erro de rede | "Não foi possível conectar. Tente de novo." |
| Erro do servidor | "Algo deu errado do nosso lado. Tente de novo em instantes." |

Nenhuma mensagem expõe detalhe interno, stack trace ou existência de conta.

### 13.3 Anúncios por `aria-live`

| Evento | Cortesia |
|---|---|
| Item adicionado ou removido do carrinho | `polite` |
| Total do carrinho alterado | `polite` |
| Quantidade de resultados após filtrar | `polite` |
| Erro de envio de formulário | `assertive` |
| Pagamento aprovado ou recusado | `assertive` |
| Movimentação de estoque registrada | `polite` |

### 13.4 Dado sensível na interface

- O documento aparece **mascarado** em toda tela que não seja o perfil: `***.456.789-**`.
- O documento **nunca** entra em query string, log, chave de cache ou título de página.
- O menu do usuário mostra nome e email, nunca o documento.
- Dados de cartão nunca saem do estado do formulário.

### 13.5 Carregamento

- Lista → skeleton com a forma do conteúdo, na mesma quantidade da página.
- Ação → botão com rótulo trocado, largura preservada, `aria-busy`.
- Nunca spinner de página inteira depois da carga inicial.
- Toda tela com carregamento tem também estado de erro com nova tentativa. Sem exceção.
