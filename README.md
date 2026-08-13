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
