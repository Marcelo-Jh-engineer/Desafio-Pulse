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
| `/admin/categorias` | `ADMIN` | Gestão de categorias | F5 |
| `/403` | Público | Acesso negado | F0 |
| `*` | Público | 404 | F0 |

**Rota de entrada por papel após o login**: `ADMIN` vai para `/admin/produtos`; `CLIENTE` volta para o destino guardado ou para `/`.

---

## 2. Header — comportamento transversal

O header é a manifestação mais visível do RBAC e reage a toda mudança de sessão.

| Elemento | VISITANTE | CLIENTE | ADMIN |
|---|:---:|:---:|:---:|
| Logo | sim | sim | sim, apontando para a área administrativa |
| Link do catálogo | sim | sim | **não** |
| Ícone do carrinho com contador | **não** | sim | **não** |
| Botões Entrar e Cadastrar | sim | não | não |
| Menu do usuário com Sair | não | sim | sim |
| Link para a área administrativa | não | não | sim |

**Regras**
- O contador do carrinho só aparece com quantidade maior que zero, e é anunciado por `aria-live="polite"` quando muda.
- O menu do usuário mostra o nome — **nunca** o login, que pode ser documento.
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

Cinco, nesta ordem. Nada além disso.

| Campo | Regra |
|---|---|
| Login | CPF, CNPJ ou e-mail. Documento **apenas com números** — sem ponto, barra ou hífen. Dígito verificador validado |
| E-mail | Formato válido, minúsculas, único |
| Nome completo | 3 a 120 caracteres |
| Senha | Mínimo de 6 caracteres |
| Confirmação de senha | Igual à senha — **só no front**, nunca enviada |

### O campo de login

Um input só, com a dica visível antes de digitar: *"CPF, CNPJ ou e-mail.
Documento apenas com números, sem pontos ou traços."*

**Não há máscara.** O documento é digitado, guardado e trafegado sempre com os
mesmos dígitos — o que a pessoa vê é o que o sistema tem. Também não há seletor
de pessoa física ou jurídica: o formato é inferido pelo comprimento e nunca é
persistido.

`login` e `email` são campos separados de propósito. O login é a credencial e
pode ser um documento; mesmo quando é e-mail, não precisa ser o mesmo endereço
de contato.

### Validação

A mesma regra do login (seção 5): detecta o tipo, valida o formato daquele tipo,
e cai numa mensagem única quando o tipo nem dá para determinar. Roda no `blur` e
no envio, nunca a cada tecla.

### Estados

| Estado | Tela |
|---|---|
| Padrão | Formulário |
| Enviando | Botão desabilitado com `aria-busy`; campos travados |
| Erro por campo | `errosPorCampo` do `ErroApi` mapeado direto em `setError` |
| Erro geral | Alerta acima do formulário |
| Sucesso | Autentica direto e leva ao destino guardado ou a `/` |

### Erros por campo vindos do backend

```json
{ "login": "Este login já está em uso.", "email": "Este e-mail já está cadastrado." }
```

Cada chave corresponde ao nome exato do campo, então o mapeamento é direto.
`login` e `email` são únicos **e não podem colidir entre si**: quem entra digita
um valor só, e o servidor procura nos dois campos.

### Casos de borda

- Documento com 12 ou 13 dígitos → "Informe um CPF, CNPJ ou e-mail válido".
- Login igual ao e-mail de outra conta → conflito no campo de login.
- Senha e confirmação diferentes → erro no campo de confirmação, não no de senha.
- Enviar duas vezes rápido → segunda submissão bloqueada.

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
- **Recalcular**: o total é recalculado a cada mudança por uma função pura. Não há frete.
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

A tela começa com a escolha da forma de pagamento. O que vem depois muda; o
contrato, não — as duas terminam num `ResultadoPagamento`.

| Forma | Como resolve |
|---|---|
| Cartão de crédito | Na mesma requisição: aprova ou recusa |
| Pix | Abre uma cobrança com prazo; o desfecho chega depois |

### Cartão

Número, nome do titular, validade, código de segurança e **parcelamento**. O
select mostra o valor de cada parcela já calculado — 1, 2, 3, 6 ou 12 vezes, sem
juros. À vista aparece como "À vista", não como "1×".

Estado dedicado de processamento, sem opção de voltar, enquanto a requisição
corre.

### Pix

QR code, código copia e cola, valor e um contador de **5 minutos**.

- O contador sai do `expiraEm` que o servidor devolveu, não de uma duração
  iniciada na tela: recarregar a página não ganha tempo extra.
- O botão "Copiar" leva o código para a área de transferência; se o navegador
  negar a permissão, o campo continua selecionável.
- Passados os 5 minutos, o QR sai da tela e entra o aviso de expiração com a
  ação de gerar outro código. Os itens continuam no carrinho.
- **A chave é fictícia.** O QR é um QR de verdade, mas não existe recebedor.

No mundo real quem avisa que o Pix caiu é o banco, por webhook, e a tela apenas
consulta o pedido. Na fase mockada o gatilho é o botão "Já fiz o pagamento" —
sem ele, o fluxo dependeria de um serviço externo que não existe aqui.

### Estados

| Estado | Tela |
|---|---|
| Escolha | Dois cartões de opção, com o que cada forma implica |
| Formulário do cartão | Campos e total em destaque |
| Processando cartão | Tela dedicada, sem opção de voltar |
| Aguardando Pix | QR, copia e cola, contador |
| Pix expirado | Aviso e ação de gerar novo código |
| Aprovado | Redireciona para `/pedidos/:id/confirmacao` |
| Recusado | Motivo e nova tentativa, com o carrinho intacto |
| Erro de rede | "Não foi possível confirmar o pagamento", com orientação para verificar antes de repetir |

### Regras obrigatórias de segurança

- **Nenhum dado de cartão sai do estado do formulário.** Nunca em store, `localStorage`, `sessionStorage`, cache de query ou log.
- O pagamento é **mutation**, jamais query: query indexa o cache pelos argumentos.
- Ao desmontar a tela, o estado do formulário é descartado.
- Submissão duplicada bloqueada por travamento do botão mais verificação de requisição em andamento (RF-CHK-09).

### Regra do mock

| Situação | Resultado |
|---|---|
| Cartão terminado em `0000` | `RECUSADO` — "Saldo insuficiente" |
| Cartão terminado em `1111` | `RECUSADO` — "Cartão expirado" |
| Qualquer outro cartão | `APROVADO` |
| Pix confirmado dentro do prazo | `APROVADO` |
| Pix confirmado depois do prazo | `RECUSADO` — "O prazo do Pix expirou" |

### Casos de borda

- Recusa: o pedido fica `FALHOU` e é recuperável; o carrinho **não** é esvaziado.
- Erro de rede depois do envio: o desfecho é desconhecido. A tela orienta a verificar antes de tentar de novo, em vez de sugerir uma nova submissão que poderia duplicar a cobrança.
- Recarregar durante o processamento: ao voltar, consulta o estado do pedido em vez de reenviar.
- Pedido já pago ao abrir a tela: vai direto para a confirmação.

---

## 10. Confirmação — `/pedidos/:id/confirmacao`

**Papel**: `CLIENTE` · **Dados**: `Pedido`

Mascote feliz, número do pedido em destaque, **resumo do pagamento**, itens,
totais, endereço de entrega e comprador.

O resumo do pagamento fica separado dos itens porque responde outra pergunta: os
itens dizem **o que** foi comprado, o resumo diz **como** foi pago.

| Forma | O que aparece |
|---|---|
| Cartão | Bandeira, quatro últimos dígitos, parcelamento e valor da parcela |
| Pix | Apenas a forma e a data — não há dado de instrumento a mostrar |

- **O carrinho é esvaziado somente aqui**, depois da aprovação confirmada (RF-CHK-07).
- O login do comprador aparece **mascarado quando é documento**: `***.444.777-**`. Login que é e-mail aparece inteiro, já que está logo acima no campo de contato.

### Imprimir comprovante

O botão "Imprimir comprovante" chama a impressão do navegador. O CSS de
impressão esconde cabeçalho, rodapé, botões e o indicador de etapas; sai só o
comprovante, com o nome da loja no topo e a nota de que o documento não tem
valor fiscal.

Fundos vão para branco na impressão — impressora não imprime cor de fundo de
graça, e o resultado em preto e branco seria ilegível.

### Casos de borda

- Acessar a confirmação de um pedido de outro usuário → `/403`.
- Pedido em estado `PENDENTE` ou `FALHOU` → redireciona para a tela de status, que mostra o estado real.
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

**O administrador não navega a loja.** Ele não compra, e ver o catálogo como
cliente só criaria a dúvida de qual visão está valendo. Quem tem o papel `ADMIN`
e abre `/` ou `/produtos/:slug` é levado para `/admin/produtos`; o cabeçalho não
mostra o link do catálogo nem o contador do carrinho, e o logo aponta para a
área administrativa.

### 11.1 Listagem — `/admin/produtos`

É a **única** visão de produtos que o administrador tem, então a linha mostra
tudo que ele precisa para operar: imagem, nome, SKU, categoria, unidade, preço,
estoque e situação.

Filtro por categoria e por situação, busca por nome ou SKU, ordenação por menor
estoque — o que está acabando aparece primeiro. Produtos inativos aparecem,
sinalizados. Estoque de 10 ou menos recebe destaque de `alerta` **com rótulo**
("8 em estoque · acabando"), nunca só cor. No celular a tabela vira lista de
cartões.

### 11.2 Alteração de preço — na própria linha

O preço se edita **sem sair da lista**: o botão "Alterar preço" troca o valor por
um campo, com salvar e cancelar ao lado. Isso é deliberado — o administrador
compara preços entre produtos vizinhos, e abrir uma tela por ajuste perderia esse
contexto.

- O campo aceita "19,90" e converte para `1990` antes de enviar.
- Preço zero ou inválido trava o botão de salvar.
- Erro do servidor aparece na própria linha.
- Alterar o preço **não** altera pedidos já feitos: o pedido congela nome e preço no momento da compra. O checkout avisa quem tiver o preço antigo no carrinho.

### 11.3 Cadastro de produto — `/admin/produtos/novo`

| Campo | Validação |
|---|---|
| Nome | 3 a 120 caracteres |
| SKU | 3 a 40 caracteres, único |
| Descrição | 10 a 2000 caracteres |
| Preço | Aceita "19,90" e converte para `1990` antes de enviar |
| Unidade | Select com os valores de `Unidade` |
| Categoria | Select alimentado pela API, mostrando apenas categorias ativas |
| Imagem | Caminho da imagem |
| Estoque inicial | Inteiro maior ou igual a zero |
| Ativo | Padrão ligado |

Após salvar, volta para a listagem com toast.

### 11.4 Categorias — `/admin/categorias`

- Lista ordenada por `ordem`, com nome, identificador da URL, quantidade de produtos e situação.
- Criar e renomear; o identificador é gerado pelo backend e exibido como somente leitura.
- Ativar e desativar. Desativar categoria com produtos vinculados abre confirmação explicando que os produtos continuam vinculados, mas a categoria some do filtro público.
- Não há exclusão — apenas desativação, para preservar o vínculo histórico.

### O que o administrador **não** faz

- **Não movimenta estoque.** O estoque tem um caminho só: baixa quando um pagamento é aprovado. Não há entrada, saída, ajuste manual nem histórico de movimentação.
- **Não compra.** Sem carrinho, sem checkout, sem catálogo.

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

### 12.6 Admin ajusta preço

```
/admin/produtos -> localiza o produto pela busca
  -> "Alterar preco" na propria linha -> campo aparece no lugar do valor
  -> digita 24,90 -> Salvar
  -> preco atualizado, toast de confirmacao
  -> catalogo publico e listagem administrativa invalidados juntos
```

Pedidos já feitos não mudam: eles congelaram o preço no momento da compra. Quem
tiver o item no carrinho pelo preço antigo é avisado ao entrar no checkout, e
decide antes de pagar.

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
| Preço de produto alterado | `polite` |

### 13.4 Dado sensível na interface

- O login aparece **mascarado quando é documento** em toda tela que não seja o perfil: `***.456.789-**`.
- O documento **nunca** entra em query string, log, chave de cache ou título de página. E nunca ganha máscara: é digitado e guardado só com dígitos.
- O menu do usuário mostra o nome, nunca o login.
- Dados de cartão nunca saem do estado do formulário. No comprovante, só os quatro últimos dígitos.

### 13.5 Carregamento

- Lista → skeleton com a forma do conteúdo, na mesma quantidade da página.
- Ação → botão com rótulo trocado, largura preservada, `aria-busy`.
- Nunca spinner de página inteira depois da carga inicial.
- Toda tela com carregamento tem também estado de erro com nova tentativa. Sem exceção.
