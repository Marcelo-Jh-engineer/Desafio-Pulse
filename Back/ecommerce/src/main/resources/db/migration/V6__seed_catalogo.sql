-- =====================================================================
-- Carga inicial do catalogo — "Voce no Coracao da Gente"
--
-- As seis categorias e os produtos de docs/models.md secao 14, ampliados para
-- o catalogo ter volume suficiente para exercitar paginacao, filtro e busca.
--
-- `slug`, `sku` e `url_imagem` sao derivados do nome pela funcao gerar_slug,
-- e apontam para os SVG de Front/public/produtos, um por produto,
-- e nao escritos a mao: cinquenta slugs digitados sao cinquenta chances de um
-- erro que so apareceria na URL, depois de publicado.
-- =====================================================================

INSERT INTO tb_categorias (nome, slug, descricao, url_icone, ordem, ativa) VALUES
    ('Hortifrúti', 'hortifruti', 'Frutas, legumes e verduras',      '/icones/hortifruti.svg', 1, TRUE),
    ('Bebidas',    'bebidas',    'Sucos, refrigerantes e água',     '/icones/bebidas.svg',    2, TRUE),
    ('Padaria',    'padaria',    'Pães, bolos e frios fatiados',    '/icones/padaria.svg',    3, TRUE),
    ('Limpeza',    'limpeza',    'Produtos de limpeza para a casa', '/icones/limpeza.svg',    4, TRUE),
    ('Mercearia',  'mercearia',  'Básicos da despensa',             '/icones/mercearia.svg',  5, TRUE),
    ('Açougue',    'acougue',    'Carnes bovinas, suínas e aves',   '/icones/acougue.svg',    6, TRUE);

WITH dados (categoria_slug, nome, descricao, preco_em_centavos, unidade, estoque, ativo) AS (
    VALUES
    -- ---------------------------------------------------------------
    -- HORTIFRUTI
    -- ---------------------------------------------------------------
    ('hortifruti', 'Banana Prata',              'Banana prata madura, cacho selecionado',           649, 'KG',  84, TRUE),
    ('hortifruti', 'Maçã Gala',                 'Maçã gala nacional, calibre médio',                999, 'KG',  62, TRUE),
    ('hortifruti', 'Tomate Italiano',           'Tomate italiano firme, ideal para molhos',         899, 'KG',  55, TRUE),
    ('hortifruti', 'Batata Inglesa Lavada',     'Batata inglesa lavada, tipo especial',             599, 'KG', 120, TRUE),
    ('hortifruti', 'Cebola Nacional',           'Cebola amarela nacional',                          549, 'KG',  93, TRUE),
    ('hortifruti', 'Cenoura',                   'Cenoura fresca, colheita da semana',               649, 'KG',  48, TRUE),
    ('hortifruti', 'Mamão Formosa',             'Mamão formosa maduro, doce',                       799, 'KG',  37, TRUE),
    ('hortifruti', 'Limão Tahiti',              'Limão tahiti suculento',                           499, 'KG',  29, TRUE),
    -- Estoque zero de proposito: e a fixture do estado "indisponivel", que
    -- continua listado no catalogo, sem botao de compra (docs/models.md 14).
    ('hortifruti', 'Alface Crespa',             'Alface crespa hidropônica, unidade',               399, 'UN',   0, TRUE),
    ('hortifruti', 'Abacaxi Pérola',            'Abacaxi pérola graúdo, unidade',                   899, 'UN',  25, TRUE),

    -- ---------------------------------------------------------------
    -- BEBIDAS
    -- ---------------------------------------------------------------
    ('bebidas',    'Refrigerante Cola 2L',      'Refrigerante sabor cola, garrafa de 2 litros',     899, 'UN', 200, TRUE),
    ('bebidas',    'Refrigerante Guaraná 2L',   'Refrigerante de guaraná, garrafa de 2 litros',     849, 'UN', 175, TRUE),
    ('bebidas',    'Suco de Laranja 1L',        'Suco de laranja integral, caixa de 1 litro',      1190, 'UN',  45, TRUE),
    ('bebidas',    'Suco de Uva Integral 1L',   'Suco de uva integral sem açúcar, 1 litro',        1690, 'UN',  38, TRUE),
    ('bebidas',    'Água Mineral 500ml',        'Água mineral sem gás, garrafa de 500 ml',          250, 'UN', 380, TRUE),
    ('bebidas',    'Cerveja Pilsen Lata 350ml', 'Cerveja pilsen, lata de 350 ml',                   399, 'UN', 240, TRUE),

    -- ---------------------------------------------------------------
    -- ACOUGUE
    -- ---------------------------------------------------------------
    ('acougue',    'Picanha Bovina',            'Picanha bovina resfriada, peça inteira',          8990, 'KG',  18, TRUE),
    ('acougue',    'Alcatra',                   'Alcatra bovina resfriada em peça',                5490, 'KG',  24, TRUE),
    ('acougue',    'Coxão Mole',                'Coxão mole bovino, corte para bife',              4290, 'KG',  31, TRUE),
    ('acougue',    'Carne Moída Patinho',       'Patinho moído na hora, bandeja',                  3990, 'KG',  27, TRUE),
    ('acougue',    'Filé de Peito de Frango',   'Filé de peito de frango resfriado, sem osso',     2490, 'KG',  46, TRUE),
    ('acougue',    'Frango Inteiro Congelado',  'Frango inteiro congelado, cerca de 2 kg',         1299, 'KG',  70, TRUE),
    ('acougue',    'Linguiça Toscana',          'Linguiça toscana suína, gomos frescos',           2290, 'KG',  33, TRUE),
    ('acougue',    'Costela Suína',             'Costela suína em tiras, resfriada',               2690, 'KG',  21, TRUE),

    -- ---------------------------------------------------------------
    -- PADARIA
    -- ---------------------------------------------------------------
    ('padaria',    'Pão Francês',               'Pão francês assado ao longo do dia',              1890, 'KG',  40, TRUE),
    ('padaria',    'Pão de Forma Integral',     'Pão de forma integral, pacote de 500 g',           999, 'UN',  48, TRUE),
    ('padaria',    'Broa de Fubá',              'Broa de fubá caseira, unidade grande',             799, 'UN',  30, TRUE),
    ('padaria',    'Croissant Folhado',         'Croissant folhado assado na hora',                 649, 'UN',  36, TRUE),
    ('padaria',    'Rosca Doce Trançada',       'Rosca doce trançada com açúcar cristal',          1290, 'UN',  18, TRUE),
    ('padaria',    'Queijo Minas Frescal',      'Queijo minas frescal fatiado na hora',            4290, 'KG',  15, TRUE),
    ('padaria',    'Presunto Cozido Fatiado',   'Presunto cozido magro, fatiado na hora',          3490, 'KG',  19, TRUE),
    ('padaria',    'Mussarela Fatiada',         'Queijo mussarela fatiado na hora',                4990, 'KG',  22, TRUE),

    -- ---------------------------------------------------------------
    -- MERCEARIA
    -- ---------------------------------------------------------------
    ('mercearia',  'Arroz Branco Tipo 1 5kg',   'Arroz branco tipo 1, pacote de 5 kg',             2799, 'PCT', 200, TRUE),
    ('mercearia',  'Feijão Carioca 1kg',        'Feijão carioca tipo 1, pacote de 1 kg',            899, 'PCT', 180, TRUE),
    ('mercearia',  'Açúcar Refinado 1kg',       'Açúcar refinado especial, pacote de 1 kg',         549, 'PCT', 160, TRUE),
    ('mercearia',  'Sal Refinado 1kg',          'Sal refinado iodado, pacote de 1 kg',              299, 'PCT', 140, TRUE),
    ('mercearia',  'Café Torrado e Moído',      'Café torrado e moído tradicional, 500 g',         1899, 'PCT', 110, TRUE),
    ('mercearia',  'Óleo de Soja 900ml',        'Óleo de soja refinado, garrafa de 900 ml',         749, 'UN',  130, TRUE),
    ('mercearia',  'Macarrão Espaguete 500g',   'Macarrão espaguete de sêmola, 500 g',              499, 'PCT', 150, TRUE),
    ('mercearia',  'Farinha de Trigo 1kg',      'Farinha de trigo especial, pacote de 1 kg',        599, 'PCT',  95, TRUE),
    ('mercearia',  'Leite Integral 1L',         'Leite integral UHT, caixa de 1 litro',             549, 'UN',  240, TRUE),
    ('mercearia',  'Molho de Tomate 340g',      'Molho de tomate tradicional, sachê de 340 g',      349, 'UN',  175, TRUE),

    -- ---------------------------------------------------------------
    -- LIMPEZA
    -- ---------------------------------------------------------------
    ('limpeza',    'Detergente Neutro 500ml',   'Detergente líquido neutro, frasco de 500 ml',      289, 'UN',  210, TRUE),
    ('limpeza',    'Sabão em Pó 1,6kg',         'Sabão em pó multiação, caixa de 1,6 kg',          1899, 'PCT',  85, TRUE),
    ('limpeza',    'Água Sanitária 2L',         'Água sanitária, frasco de 2 litros',               899, 'UN',  120, TRUE),
    ('limpeza',    'Amaciante Concentrado 2L',  'Amaciante concentrado, frasco de 2 litros',       1490, 'UN',   74, TRUE),
    ('limpeza',    'Desinfetante 2L',           'Desinfetante de uso geral, frasco de 2 litros',    899, 'UN',   98, TRUE),
    ('limpeza',    'Papel Higiênico 12 rolos',  'Papel higiênico folha dupla, 12 rolos',           2290, 'PCT',  90, TRUE),
    ('limpeza',    'Esponja Multiuso 3un',      'Esponja multiuso dupla face, pacote com 3',        549, 'PCT', 160, TRUE),
    ('limpeza',    'Saco de Lixo 50L 30un',     'Saco de lixo reforçado 50 litros, 30 unidades',   1290, 'PCT', 105, TRUE),

    -- ---------------------------------------------------------------
    -- Casos-limite deterministicos, para a demonstracao manual e para a
    -- conferencia de tela terem sempre o mesmo cenario a mao:
    --   estoque 1   -> a corrida de checkout (um pedido passa, o outro nao)
    --   ativo FALSE -> some do catalogo publico, continua na listagem do admin
    -- ---------------------------------------------------------------
    ('padaria',    'Panetone Artesanal 750g',   'Edição limitada da padaria, sobrou uma unidade',  5990, 'UN',    1, TRUE),
    ('limpeza',    'Sabão em Barra Antigo 200g','Produto descontinuado pelo fornecedor',            399, 'UN',   12, FALSE)
)
INSERT INTO tb_produtos (sku, slug, nome, descricao, preco_em_centavos, unidade,
                         url_imagem, categoria_id, quantidade_estoque, ativo)
SELECT
    upper(substr(c.slug, 1, 3)) || '-'
        || upper(substr(gerar_slug(d.nome), 1, 3)) || '-'
        || lpad((row_number() OVER (PARTITION BY d.categoria_slug ORDER BY d.nome))::TEXT, 3, '0'),
    gerar_slug(d.nome),
    d.nome,
    d.descricao,
    d.preco_em_centavos,
    d.unidade,
    '/produtos/' || gerar_slug(d.nome) || '.svg',
    c.id,
    d.estoque,
    d.ativo
  FROM dados d
  JOIN tb_categorias c ON c.slug = d.categoria_slug;
