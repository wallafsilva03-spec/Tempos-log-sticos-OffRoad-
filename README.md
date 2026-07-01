# Dashboard Operacional - Distribuição de Vinhaça

Aplicação 100% local (HTML + CSS + JavaScript puro) para análise operacional
de caminhões e offroads na distribuição de vinhaça. Não requer servidor,
banco de dados ou instalação de software.

## Como usar

1. Abra `index.html` diretamente no navegador (duplo clique ou `Abrir com...`).
2. Clique em **Importar XLSX** e selecione o arquivo padrão da operação.
3. O sistema processa e recalcula tudo automaticamente.
4. Navegue pelo menu lateral: Resumo Executivo, Caminhões, Offroads,
   Equipamentos, Rankings e Exportação.
5. Para atualizar os dados, basta importar um novo XLSX — tudo é
   reprocessado do zero.

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
