# Dashboard Operacional - Distribuição de Vinhaça

Aplicação 100% local (HTML + CSS + JavaScript puro) para análise operacional
de caminhões e offroads na distribuição de vinhaça. Não requer servidor,
banco de dados ou instalação de software.

## Como usar

**Recomendado:** abra `dashboard-vinhaca.html` — é um arquivo único e
autocontido (CSS e JavaScript embutidos, sem depender de outras pastas).
Basta baixar esse arquivo sozinho e dar duplo clique nele.

Alternativa (estrutura modular, para desenvolvimento): abra `index.html`,
mas nesse caso as pastas `css/`, `js/` e `vendor/` precisam estar juntas
dele, na mesma estrutura de pastas do repositório.

1. Abra o arquivo HTML diretamente no navegador (duplo clique ou `Abrir com...`).
2. Clique em **Importar XLSX** e selecione o arquivo padrão da operação.
3. O sistema processa e recalcula tudo automaticamente.
4. Navegue pelo menu lateral: Resumo Executivo, Caminhões, Offroads,
   Equipamentos, Rankings e Exportação.
5. Para atualizar os dados, basta importar um novo XLSX — tudo é
   reprocessado do zero.

## Dashboard Fertirrigação (`dashboard-fertirrigacao.html`) — **recomendado**

Mesma análise da página abaixo, porém no layout do painel operacional do
Grupo Moreno: cabeçalho da marca, menu lateral e cartões de indicador. O CSS e
a casca visual vieram do `Dashboard_Fertirrigação.html` sem alteração.

Menu lateral:

- **Resumo Executivo** — indicadores gerais, comparativo entre os 3 grupos,
  pizzas de tempo por classificação e por grupo, e a árvore consolidada.
- **Fertirrigação**, **Fertirrigação Plataforma**, **OffRoad** — visão de ciclo
  (cartões + tabela do ciclo), duas pizzas (composição do ciclo e
  ciclo × esperas × fora do ciclo) e detalhamento por atividade.
- **Calculadora** — sincronismo de frota: quantos caminhões são necessários
  para sustentar N offroads numa dada lâmina.
- **Exportação** — PDF da aba aberta e CSV da distribuição de tempo.

O filtro de período fica na barra superior e vale para tudo; unidade, fazenda,
equipamento e a dimensão de detalhe são por aba.

### Distância

A exportação não traz hodômetro, mas traz `VELOCIDADE MEDIA` junto do tempo. A
distância é calculada **linha a linha** (`km = horas × km/h`) e contabilizada
**somente nas operações em que o equipamento realmente roda**:

| Ciclo | Operações que contam para distância |
| --- | --- |
| Caminhão | `Transporte Carregado` + `Transporte Vazio` |
| OffRoad | `Deslocamento TPL` |

Nas demais etapas a coluna `Km` fica vazia, mesmo quando o GPS registra alguma
velocidade (carregamento, descarregamento, aplicação, manobra, pátio). A
`Velocidade Média` também usa só essas operações, então ela é a velocidade de
trecho e não uma média diluída pelo tempo parado.

### Calculadora de sincronismo

Mantém o racional do painel original:

1. cada trator consome por hora o equivalente à lâmina em m³ (4 tratores a 55 mm
   = 220 m³/h);
2. cada caminhão entrega `capacidade ÷ tempo de ciclo` (m³/h), usando o ciclo
   real medido — etapas + esperas;
3. frota necessária = consumo dos tratores ÷ entrega por caminhão.

O ciclo médio, o tempo de descarga, a distância e os ciclos/dia vêm do arquivo
importado. O raio médio já entra preenchido com **metade da distância do ciclo**
(o km do ciclo é ida carregado + volta vazio, então a distância até a aplicação é
a metade) e pode ser sobrescrito à mão. A **capacidade do caminhão é um campo
editável**, porque essa exportação não traz a capacidade volumétrica.

## CEMMA · COPLASA — Fertirrigação e OffRoad (`cemma-coplasa-ferti.html`)

Página que lê a **exportação do sistema** (o `.zip` baixado do relatório ou o
`.txt`/`.csv` de dentro dele, separado por `;`) — formato diferente do XLSX das
outras telas. O zip é descompactado no próprio navegador, sem biblioteca externa.

Separa a operação em **3 grupos**, a partir da coluna `GRUPO EQUIPAMENTO`:

| Grupo | Origem na exportação | Ciclo |
| --- | --- | --- |
| Fertirrigação | `FERTIRRIGAÇÃO` | Caminhão |
| Fertirrigação Plataforma | `FERTIRRIGAÇÃO PLATAFORMA` | Caminhão |
| OffRoad | `OFF-ROAD 1` + `OFF ROAD 2` (unidos) | OffRoad |

Cada grupo traz a árvore `Classificação › Atividade › Detalhe` (o detalhe é
configurável: equipamento, grupo, unidade, fazenda ou operador) e o **ciclo
operacional**:

- **Caminhão:** Carregamento → Transporte Carregado → Descarregamento →
  Transporte Vazio, mais as esperas (Ag. Carregamento, Ag. Descarregamento, filas).
- **OffRoad:** Abastecimento → Aplicação → Deslocamento TPL, mais as esperas
  (Falta de Insumo, Ag. Liberação de Serviço). A Manobra é produtiva, mas não
  faz parte do sequencial e entra em "fora do ciclo".

O ciclo fecha o dia inteiro: `etapas do ciclo + esperas do ciclo + fora do ciclo
= 24:00 por equipamento-dia`.

### Tempos por evento

Cada linha da exportação é um apontamento — um evento. Por isso a tabela do
ciclo mostra a **duração medida** de cada evento (mediana, P90 e máximo), e não
a média do período dividida pelo número de ciclos:

| Coluna | O que é |
| --- | --- |
| Eventos | Quantidade de apontamentos da etapa |
| Ev./ciclo | Apontamentos daquela etapa por ciclo — perto de 1,0 o evento é a etapa inteira; acima disso a etapa vem fragmentada por talhão |
| Mediana / P90 / Máx | Duração dos apontamentos individuais |
| Ciclo Típico | Soma das medianas das etapas |

`Ciclo Típico` **não é** a mediana dos ciclos: fechar cada ciclo exigiria hora de
início e fim, que a exportação não traz (ver abaixo).

**Sobre a contagem de ciclos:** a exportação traz o total do dia por
equipamento/talhão, sem hora de início e fim, então não dá para reconstruir cada
ciclo individualmente. Os ciclos são contados pelos apontamentos da etapa-âncora
(Carregamento no caminhão, Abastecimento no offroad), que é a menos fragmentada
por acontecer num ponto só — o transporte é quebrado em dezenas de registros por
talhão. Por isso **Média por ciclo é uma estimativa**; as colunas Horas, % e
HH:MM/dia não dependem dessa premissa.

## Tempos por Atividade — OffRoad (`tempos-offroad.html`)

Página nova e independente do dashboard, focada na **distribuição do tempo
apontado** dos offroads, no formato de árvore
`Classificação › Atividade › Equipamento`:

| Coluna | O que é |
| --- | --- |
| Horas | Soma de `Tempo Decimal` no período filtrado |
| % | Participação sobre o tempo total apontado dos offroads |
| HH:MM | Média por **equipamento-dia** (horas ÷ nº de pares distintos Equipamento × Data), truncada nos minutos |
| Ocorr. | Quantidade de apontamentos |

Também é um arquivo único e autocontido (basta dar duplo clique). Traz filtros
de período, frente, fazenda e equipamento, KPIs do topo, exportação em CSV e
impressão/PDF. As classificações são listadas na ordem de negócio
(PRODUTIVA, AUXILIAR, IMPRODUTIVO, MANUTENÇÃO) e, dentro delas, atividades e
equipamentos aparecem do maior para o menor tempo.

## Estrutura

```
index.html          Estrutura da aplicação e layout das abas
css/style.css        Tema visual corporativo
js/config.js         Regras de classificação e constantes
js/utils.js          Funções utilitárias (formatação, normalização)
js/parser.js         Leitura e validação do XLSX (SheetJS)
js/calculations.js   Cálculo dos indicadores de caminhões e offroads
js/charts.js         Gráficos (Chart.js)
js/render.js         Renderização das tabelas (DataTables) e painéis
js/export.js         Geração do PDF Executivo (impressão otimizada)
js/app.js            Controlador principal / navegação / importação
vendor/               Bibliotecas de terceiros vendorizadas (uso 100% offline)
```

## Bibliotecas utilizadas (vendorizadas em `vendor/`, sem CDN)

- SheetJS (xlsx) — leitura do arquivo Excel
- jQuery + DataTables — tabelas dinâmicas com paginação e busca
- Chart.js — gráficos

## Observações

- Modelos aceitos como **CAMINHÃO**: MB AXOR 3344 (exceto equipamento 13085),
  MB AROCS 3351S EURO6.
- Modelos aceitos como **OFFROAD**: CASE PUMA 215, CASE PUMA 230, PUMA IH 230.
  O equipamento **13085** com modelo MB AXOR 3344 é tratado como exceção e
  classificado como OFFROAD.
- Equipamentos com modelos fora desse padrão aparecem na aba Equipamentos
  como "OUTRO" (não classificado), sem entrar nos indicadores consolidados.
