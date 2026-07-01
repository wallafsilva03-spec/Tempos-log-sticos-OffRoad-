/* ============================================================
   EXPORT.JS - Geração do PDF Executivo (via impressão do navegador)
   ============================================================ */

const ExportModule = (function () {

  function gerarPdfExecutivo(dataset) {
    if (!dataset) {
      alert('Importe um arquivo XLSX antes de gerar o PDF.');
      return;
    }
    const r = Calculations.resumoExecutivo(dataset);
    const area = document.getElementById('printArea');
    const agora = new Date().toLocaleString('pt-BR');

    const imgCiclo = Charts.getImage('chartCicloPorEquipamento');
    const imgDistCaminhoes = Charts.getImage('chartDistribuicaoCaminhoes');
    const imgDistOffroads = Charts.getImage('chartDistribuicaoOffroads');
    const imgDistTipo = Charts.getImage('chartDistanciaPorTipo');

    area.innerHTML = `
      <div class="print-header">
        <h1>Relatório Executivo - Operação de Vinhaça</h1>
        <p>Gerado em ${agora} • ${dataset.totalLinhas} registros processados</p>
      </div>

      <h2>1. Resumo Executivo</h2>
      <div class="print-kpis">
        ${printKpi('Qtd. Caminhões', r.qtdCaminhoes)}
        ${printKpi('Qtd. Offroads', r.qtdOffroads)}
        ${printKpi('Ciclo Médio Caminhões', Utils.formatHoras(r.cicloMedioCaminhoes))}
        ${printKpi('Ciclo Médio Offroads', Utils.formatHoras(r.cicloMedioOffroads))}
        ${printKpi('Distância Média Caminhões', `${Utils.formatNumber(r.distMediaCaminhoes)} km`)}
        ${printKpi('Distância Média Offroads', `${Utils.formatNumber(r.distMediaOffroads)} km`)}
        ${printKpi('% Operacional Médio', Utils.formatPercent(r.percMedioOperacional))}
        ${printKpi('% Espera Médio', Utils.formatPercent(r.percMedioEspera))}
      </div>

      <h2>2. Indicadores Gerais</h2>
      <p>Total de equipamentos analisados: ${dataset.caminhoes.length + dataset.offroads.length}
        (${dataset.caminhoes.length} caminhões, ${dataset.offroads.length} offroads)${
        dataset.outros.length ? `, ${dataset.outros.length} não classificados` : ''}.</p>

      <h2>3. Consolidado Caminhões</h2>
      ${tabelaConsolidadoCaminhoes(dataset.caminhoes)}

      <h2>4. Consolidado Offroads</h2>
      ${tabelaConsolidadoOffroads(dataset.offroads)}

      <h2>5. Rankings</h2>
      ${blocoRankings(dataset)}

      <h2>6. Gráficos Principais</h2>
      <div class="print-charts">
        ${imgCiclo ? `<div><h4>Ciclo por Equipamento</h4><img src="${imgCiclo}"/></div>` : ''}
        ${imgDistCaminhoes ? `<div><h4>Distribuição dos Tempos - Caminhões</h4><img src="${imgDistCaminhoes}"/></div>` : ''}
        ${imgDistOffroads ? `<div><h4>Distribuição dos Tempos - Offroads</h4><img src="${imgDistOffroads}"/></div>` : ''}
        ${imgDistTipo ? `<div><h4>Distância Média por Tipo</h4><img src="${imgDistTipo}"/></div>` : ''}
      </div>
    `;

    document.body.classList.add('print-mode');
    window.print();
    setTimeout(() => document.body.classList.remove('print-mode'), 500);
  }

  function printKpi(label, value) {
    return `<div class="print-kpi"><span>${label}</span><strong>${value}</strong></div>`;
  }

  function tabelaConsolidadoCaminhoes(rows) {
    if (!rows.length) return '<p>Nenhum caminhão encontrado.</p>';
    return `<table class="print-table">
      <thead><tr>
        <th>Equipamento</th><th>Modelo</th><th>Ciclo Total</th><th>Dist. Total</th>
        <th>% Operacional</th><th>% Espera</th>
      </tr></thead>
      <tbody>
        ${rows.map(c => `<tr>
          <td>${Utils.escapeHtml(c.equipamento)}</td>
          <td>${Utils.escapeHtml(c.modelo)}</td>
          <td>${Utils.formatHoras(c.cicloTotal)}</td>
          <td>${Utils.formatNumber(c.distTotal)} km</td>
          <td>${Utils.formatPercent(c.percOperacional)}</td>
          <td>${Utils.formatPercent(c.percEspera)}</td>
        </tr>`).join('')}
      </tbody></table>`;
  }

  function tabelaConsolidadoOffroads(rows) {
    if (!rows.length) return '<p>Nenhum offroad encontrado.</p>';
    return `<table class="print-table">
      <thead><tr>
        <th>Equipamento</th><th>Modelo</th><th>Ciclo Total</th><th>Dist. Deslocamento</th>
        <th>Tempo Espera</th>
      </tr></thead>
      <tbody>
        ${rows.map(o => `<tr>
          <td>${Utils.escapeHtml(o.equipamento)}</td>
          <td>${Utils.escapeHtml(o.modelo)}</td>
          <td>${Utils.formatHoras(o.cicloTotal)}</td>
          <td>${Utils.formatNumber(o.distPontoCarregamento)} km</td>
          <td>${Utils.formatHoras(o.tempoEspera)}</td>
        </tr>`).join('')}
      </tbody></table>`;
  }

  function blocoRankings(dataset) {
    const secoes = [
      ['Caminhões - Maior Ciclo', rankTop(dataset.caminhoes, 'cicloTotal', true, 'h')],
      ['Caminhões - Menor Ciclo', rankTop(dataset.caminhoes, 'cicloTotal', false, 'h')],
      ['Caminhões - Maior Distância', rankTop(dataset.caminhoes, 'distTotal', true, 'km')],
      ['Caminhões - Menor Distância', rankTop(dataset.caminhoes, 'distTotal', false, 'km')],
      ['Caminhões - Maior Tempo de Espera', rankTop(dataset.caminhoes, 'tempoEspera', true, 'h')],
      ['Offroads - Maior Ciclo', rankTop(dataset.offroads, 'cicloTotal', true, 'h')],
      ['Offroads - Maior Tempo de Espera', rankTop(dataset.offroads, 'tempoEspera', true, 'h')],
      ['Offroads - Maior Tempo de Deslocamento', rankTop(dataset.offroads, 'tempoDeslocamento', true, 'h')],
      ['Offroads - Maior Tempo Falta de Insumos', rankTop(dataset.offroads, 'tempoFaltaInsumos', true, 'h')]
    ];
    return secoes.map(([titulo, html]) => `<h4>${titulo}</h4>${html}`).join('');
  }

  function rankTop(arr, field, desc, unit) {
    const top = arr.slice().sort((a, b) => desc ? b[field] - a[field] : a[field] - b[field]).slice(0, 3);
    if (!top.length) return '<p>Sem dados.</p>';
    return `<table class="print-table print-table--small">
      <tbody>
        ${top.map((it, i) => `<tr>
          <td>${i + 1}º</td>
          <td>${Utils.escapeHtml(it.equipamento)}</td>
          <td>${unit === 'h' ? Utils.formatHoras(it[field]) : `${Utils.formatNumber(it[field])} ${unit}`}</td>
        </tr>`).join('')}
      </tbody></table>`;
  }

  return { gerarPdfExecutivo };
})();
