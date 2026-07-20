/* ============================================================
   RENDER.JS - Renderização de UI: resumo, tabelas, rankings,
   painel de equipamentos.
   ============================================================ */

const Render = (function () {

  let dtCaminhoes = null;
  let dtOffroads = null;
  let dtHistorico = null;
  let equipamentoSelecionado = null;

  /* -------------------- RESUMO EXECUTIVO -------------------- */

  function renderResumo(dataset) {
    const r = Calculations.resumoExecutivo(dataset);

    setText('kpiQtdCaminhoes', r.qtdCaminhoes);
    setText('kpiQtdOffroads', r.qtdOffroads);
    setText('kpiCicloCaminhoes', Utils.formatHoras(r.cicloMedioCaminhoes));
    setText('kpiCicloOffroads', Utils.formatHoras(r.cicloMedioOffroads));
    setText('kpiDistCaminhoes', `${Utils.formatNumber(r.distMediaCaminhoes)} km`);
    setText('kpiDistOffroads', `${Utils.formatNumber(r.distMediaOffroads)} km`);
    setText('kpiPercOperacional', Utils.formatPercent(r.percMedioOperacional));
    setText('kpiPercEspera', Utils.formatPercent(r.percMedioEspera));
    setText('kpiPercProdutivoCaminhoes', Utils.formatPercent(r.percProdutivoMedioCaminhoes));
    setText('kpiPercProdutivoOffroads', Utils.formatPercent(r.percProdutivoMedioOffroads));

    // Gráfico 1: Ciclo por Equipamento (granularidade individual, não só a média do tipo)
    const equipamentosCiclo = [
      ...dataset.caminhoes.map(c => ({ equipamento: c.equipamento, ciclo: c.cicloTotal, tipo: 'CAMINHAO' })),
      ...dataset.offroads.map(o => ({ equipamento: o.equipamento, ciclo: o.cicloTotal, tipo: 'OFFROAD' }))
    ].sort((a, b) => b.ciclo - a.ciclo);

    const wrapEl = document.getElementById('chartCicloPorEquipamentoWrap');
    if (wrapEl) wrapEl.style.height = `${Math.max(320, equipamentosCiclo.length * 30)}px`;

    Charts.renderHorizontalBar('chartCicloPorEquipamento',
      equipamentosCiclo.map(e => e.equipamento),
      [{
        label: 'Ciclo (h)',
        data: equipamentosCiclo.map(e => round2(e.ciclo)),
        backgroundColor: equipamentosCiclo.map(e => e.tipo === 'CAMINHAO' ? APP_CONFIG.colors.primary : APP_CONFIG.colors.info)
      }],
      { labelUnit: 'h' }
    );

    // Gráfico 2: Distribuição dos Tempos - separada por Caminhões e Offroads
    const labelsCaminhao = ['Carregamento', 'Ag.Carregamento', 'Transporte', 'Ag.Descarregamento', 'Descarregamento', 'Deslocamento Volta'];
    const valoresCaminhao = [
      Utils.sum(dataset.caminhoes.map(c => c.tempoCarregamento)),
      Utils.sum(dataset.caminhoes.map(c => c.tempoAgCarregamento)),
      Utils.sum(dataset.caminhoes.map(c => c.tempoTransporte)),
      Utils.sum(dataset.caminhoes.map(c => c.tempoAgDescarregamento)),
      Utils.sum(dataset.caminhoes.map(c => c.tempoDescarregamento)),
      Utils.sum(dataset.caminhoes.map(c => c.tempoDeslocamentoVolta))
    ].map(round2);
    Charts.renderDoughnut('chartDistribuicaoCaminhoes', labelsCaminhao, valoresCaminhao);

    const labelsOffroad = ['Aplicação', 'Abastecimento', 'Ag.Carregamento', 'Falta Insumos', 'Ag.Liberação', 'Deslocamento'];
    const valoresOffroad = [
      Utils.sum(dataset.offroads.map(o => o.tempoAplicacao)),
      Utils.sum(dataset.offroads.map(o => o.tempoAbastecimento)),
      Utils.sum(dataset.offroads.map(o => o.tempoAgCarregamento)),
      Utils.sum(dataset.offroads.map(o => o.tempoFaltaInsumos)),
      Utils.sum(dataset.offroads.map(o => o.tempoAgLiberacao)),
      Utils.sum(dataset.offroads.map(o => o.tempoDeslocamento))
    ].map(round2);
    Charts.renderDoughnut('chartDistribuicaoOffroads', labelsOffroad, valoresOffroad);

    // Gráfico 3: Distância Média por Tipo
    Charts.renderBar('chartDistanciaPorTipo', ['Caminhões', 'Offroads'], [{
      label: 'Distância Média (km)',
      data: [round2(r.distMediaCaminhoes), round2(r.distMediaOffroads)],
      backgroundColor: [APP_CONFIG.colors.secondary, APP_CONFIG.colors.accent]
    }], { labelUnit: 'km' });
  }

  /* -------------------- TABELA CAMINHÕES -------------------- */

  function renderCaminhaoCiclo(dataset) {
    const rows = dataset.caminhoes;

    const cicloMedio = Utils.avg(rows.map(c => c.cicloTotal));
    const carregamentoMedio = Utils.avg(rows.map(c => c.tempoCarregamento));
    const agCarregamentoMedio = Utils.avg(rows.map(c => c.tempoAgCarregamento));
    const transporteMedio = Utils.avg(rows.map(c => c.tempoTransporte));
    const agDescarregamentoMedio = Utils.avg(rows.map(c => c.tempoAgDescarregamento));
    const descarregamentoMedio = Utils.avg(rows.map(c => c.tempoDescarregamento));
    const deslocamentoMedio = Utils.avg(rows.map(c => c.tempoDeslocamentoVolta));
    const percProdutivoMedio = Utils.avg(rows.map(c => c.percProdutivo));

    setText('camKpiCiclo', Utils.formatHoras(cicloMedio));
    setText('camKpiCarregamento', Utils.formatHoras(carregamentoMedio));
    setText('camKpiAgCarregamento', Utils.formatHoras(agCarregamentoMedio));
    setText('camKpiTransporte', Utils.formatHoras(transporteMedio));
    setText('camKpiAgDescarregamento', Utils.formatHoras(agDescarregamentoMedio));
    setText('camKpiDescarregamento', Utils.formatHoras(descarregamentoMedio));
    setText('camKpiDeslocamento', Utils.formatHoras(deslocamentoMedio));
    setText('camKpiPercProdutivo', Utils.formatPercent(percProdutivoMedio));

    Charts.renderDoughnut('chartCicloCaminhao',
      ['Carregamento', 'Ag.Carregamento', 'Transporte', 'Ag.Descarregamento', 'Descarregamento', 'Deslocamento Volta'],
      [carregamentoMedio, agCarregamentoMedio, transporteMedio, agDescarregamentoMedio, descarregamentoMedio, deslocamentoMedio].map(round2)
    );
  }

  function renderCaminhoesTab(dataset) {
    renderCaminhaoCiclo(dataset);
    const rows = dataset.caminhoes;
    popularFiltro('filtroCaminhaoEquip', rows.map(r => r.equipamento));
    popularFiltro('filtroCaminhaoFrente', rows.map(r => r.frente));
    popularFiltro('filtroCaminhaoFazenda', rows.map(r => r.fazenda));
    popularFiltro('filtroCaminhaoModelo', rows.map(r => r.modelo));

    const body = rows.map(c => [
      Utils.escapeHtml(c.equipamento),
      Utils.escapeHtml(c.modelo),
      Utils.escapeHtml(c.frente),
      Utils.escapeHtml(c.fazenda),
      c.numCiclos,
      Utils.formatHoras(c.tempoCarregamento),
      Utils.formatHoras(c.tempoAgCarregamento),
      Utils.formatHoras(c.tempoTransporte),
      Utils.formatHoras(c.tempoAgDescarregamento),
      Utils.formatHoras(c.tempoDescarregamento),
      Utils.formatHoras(c.tempoDeslocamentoVolta),
      `${Utils.formatNumber(c.velMediaIda)} km/h`,
      `${Utils.formatNumber(c.velMediaVolta)} km/h`,
      `${Utils.formatNumber(c.distIda)} km`,
      `${Utils.formatNumber(c.distVolta)} km`,
      `${Utils.formatNumber(c.distTotal)} km`,
      Utils.formatHoras(c.cicloTotal),
      Utils.formatPercent(c.percOperacional),
      Utils.formatPercent(c.percEspera),
      Utils.formatPercent(c.percProdutivo)
    ]);

    if (dtCaminhoes) dtCaminhoes.destroy();
    dtCaminhoes = $('#tabelaCaminhoes').DataTable({
      data: body,
      destroy: true,
      pageLength: 10,
      lengthMenu: [10, 25, 50, 100],
      language: dtLangPtBr(),
      columnDefs: [{ targets: '_all', defaultContent: '-' }]
    });

    attachFiltroListeners('caminhao', dtCaminhoes,
      ['filtroCaminhaoEquip', 'filtroCaminhaoFrente', 'filtroCaminhaoFazenda', 'filtroCaminhaoModelo'],
      [0, 2, 3, 1]);
  }

  /* -------------------- TABELA OFFROADS -------------------- */

  function renderOffroadCiclo(dataset) {
    const rows = dataset.offroads;

    const cicloMedio = Utils.avg(rows.map(o => o.cicloTotal));
    const aplicacaoMedio = Utils.avg(rows.map(o => o.tempoAplicacao));
    const abastecimentoMedio = Utils.avg(rows.map(o => o.tempoAbastecimento));
    const agCarregamentoMedio = Utils.avg(rows.map(o => o.tempoAgCarregamento));
    const faltaInsumosMedio = Utils.avg(rows.map(o => o.tempoFaltaInsumos));
    const agLiberacaoMedio = Utils.avg(rows.map(o => o.tempoAgLiberacao));
    const deslocamentoMedio = Utils.avg(rows.map(o => o.tempoDeslocamentoTrecho));
    const percProdutivoMedio = Utils.avg(rows.map(o => o.percProdutivo));

    setText('offKpiCiclo', Utils.formatHoras(cicloMedio));
    setText('offKpiAplicacao', Utils.formatHoras(aplicacaoMedio));
    setText('offKpiAbastecimento', Utils.formatHoras(abastecimentoMedio));
    setText('offKpiAgCarregamento', Utils.formatHoras(agCarregamentoMedio));
    setText('offKpiFaltaInsumos', Utils.formatHoras(faltaInsumosMedio));
    setText('offKpiAgLiberacao', Utils.formatHoras(agLiberacaoMedio));
    setText('offKpiDeslocamento', Utils.formatHoras(deslocamentoMedio));
    setText('offKpiPercProdutivo', Utils.formatPercent(percProdutivoMedio));

    Charts.renderDoughnut('chartCicloOffroad',
      ['Aplicação', 'Abastecimento', 'Deslocamento (trecho)'],
      [aplicacaoMedio, abastecimentoMedio, deslocamentoMedio].map(round2)
    );
  }

  function renderOffroadsTab(dataset) {
    renderOffroadCiclo(dataset);
    const rows = dataset.offroads;
    popularFiltro('filtroOffroadEquip', rows.map(r => r.equipamento));
    popularFiltro('filtroOffroadFrente', rows.map(r => r.frente));
    popularFiltro('filtroOffroadFazenda', rows.map(r => r.fazenda));
    popularFiltro('filtroOffroadModelo', rows.map(r => r.modelo));

    const body = rows.map(o => [
      Utils.escapeHtml(o.equipamento),
      Utils.escapeHtml(o.modelo),
      Utils.escapeHtml(o.frente),
      Utils.escapeHtml(o.fazenda),
      o.numCiclos,
      Utils.formatHoras(o.tempoAplicacao),
      Utils.formatHoras(o.tempoAbastecimento),
      Utils.formatHoras(o.tempoAgCarregamento),
      Utils.formatHoras(o.tempoFaltaInsumos),
      Utils.formatHoras(o.tempoAgLiberacao),
      Utils.formatHoras(o.tempoDeslocamentoTrecho),
      `${Utils.formatNumber(o.velMediaDeslocamento)} km/h`,
      `${Utils.formatNumber(o.distPontoCarregamento)} km`,
      Utils.formatHoras(o.cicloTotal),
      Utils.formatPercent(o.percProdutivo)
    ]);

    if (dtOffroads) dtOffroads.destroy();
    dtOffroads = $('#tabelaOffroads').DataTable({
      data: body,
      destroy: true,
      pageLength: 10,
      lengthMenu: [10, 25, 50, 100],
      language: dtLangPtBr(),
      columnDefs: [{ targets: '_all', defaultContent: '-' }]
    });

    attachFiltroListeners('offroad', dtOffroads,
      ['filtroOffroadEquip', 'filtroOffroadFrente', 'filtroOffroadFazenda', 'filtroOffroadModelo'],
      [0, 2, 3, 1]);
  }

  function attachFiltroListeners(prefix, table, ids, colIndexes) {
    ids.forEach((id, i) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.onchange = () => {
        const val = el.value;
        table.column(colIndexes[i]).search(val ? `^${escapeRegex(val)}$` : '', true, false).draw();
      };
    });
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function popularFiltro(id, values) {
    const el = document.getElementById(id);
    if (!el) return;
    const atual = el.value;
    const unique = Utils.uniqueSorted(values);
    el.innerHTML = '<option value="">Todos</option>' +
      unique.map(v => `<option value="${Utils.escapeHtml(v)}">${Utils.escapeHtml(v)}</option>`).join('');
    if (unique.includes(atual)) el.value = atual;
  }

  /* -------------------- EQUIPAMENTOS -------------------- */

  function renderEquipamentosList(dataset) {
    const container = document.getElementById('listaEquipamentos');
    if (!container) return;

    const todos = [...dataset.caminhoes, ...dataset.offroads, ...dataset.outros]
      .sort((a, b) => a.equipamento.localeCompare(b.equipamento, 'pt-BR'));

    if (todos.length === 0) {
      container.innerHTML = '<p class="empty-msg">Nenhum equipamento encontrado.</p>';
      return;
    }

    container.innerHTML = todos.map(e => `
      <button class="equip-item" data-equip="${Utils.escapeHtml(e.equipamento)}">
        <span class="equip-badge equip-badge--${e.tipo.toLowerCase()}">${e.tipo}</span>
        <span class="equip-nome">${Utils.escapeHtml(e.equipamento)}</span>
        <span class="equip-modelo">${Utils.escapeHtml(e.modelo)}</span>
      </button>
    `).join('');

    container.querySelectorAll('.equip-item').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.equip-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderEquipamentoDetalhe(dataset, btn.getAttribute('data-equip'));
      });
    });

    // Seleciona automaticamente o primeiro equipamento
    if (!equipamentoSelecionado || !todos.find(e => e.equipamento === equipamentoSelecionado)) {
      equipamentoSelecionado = todos[0].equipamento;
    }
    const btnAtivo = container.querySelector(`[data-equip="${cssEscape(equipamentoSelecionado)}"]`);
    if (btnAtivo) btnAtivo.classList.add('active');
    renderEquipamentoDetalhe(dataset, equipamentoSelecionado);
  }

  function cssEscape(str) {
    return String(str).replace(/["\\]/g, '\\$&');
  }

  function renderEquipamentoDetalhe(dataset, equip) {
    equipamentoSelecionado = equip;
    const painel = document.getElementById('painelEquipamento');
    if (!painel) return;

    const item = [...dataset.caminhoes, ...dataset.offroads, ...dataset.outros]
      .find(e => e.equipamento === equip);

    if (!item) {
      painel.innerHTML = '<p class="empty-msg">Selecione um equipamento na lista ao lado.</p>';
      return;
    }

    let infoHtml = `
      <div class="info-grid">
        <div><span class="info-label">Equipamento</span><span class="info-value">${Utils.escapeHtml(item.equipamento)}</span></div>
        <div><span class="info-label">Modelo</span><span class="info-value">${Utils.escapeHtml(item.modelo)}</span></div>
        <div><span class="info-label">Tipo</span><span class="info-value">${item.tipo}</span></div>
        <div><span class="info-label">Frente</span><span class="info-value">${Utils.escapeHtml(item.frente || '-')}</span></div>
        <div><span class="info-label">Fazenda</span><span class="info-value">${Utils.escapeHtml(item.fazenda || '-')}</span></div>
        <div><span class="info-label">Registros</span><span class="info-value">${item.registros.length}</span></div>
        ${item.numCiclos !== undefined ? `<div><span class="info-label">Número de Ciclos</span><span class="info-value">${item.numCiclos}</span></div>` : ''}
      </div>`;

    let indicadoresHtml = '';
    let cicloLabels = [], cicloValores = [];

    if (item.tipo === 'CAMINHAO') {
      indicadoresHtml = indicadorCards([
        ['Tempo Médio Carregamento', Utils.formatHoras(item.tempoCarregamento)],
        ['Tempo Médio Ag. Carregamento', Utils.formatHoras(item.tempoAgCarregamento)],
        ['Tempo Médio Transporte', Utils.formatHoras(item.tempoTransporte)],
        ['Tempo Médio Ag. Descarregamento', Utils.formatHoras(item.tempoAgDescarregamento)],
        ['Tempo Médio Descarregamento', Utils.formatHoras(item.tempoDescarregamento)],
        ['Tempo Médio Deslocamento Volta', Utils.formatHoras(item.tempoDeslocamentoVolta)],
        ['Velocidade Média Ida', `${Utils.formatNumber(item.velMediaIda)} km/h`],
        ['Velocidade Média Volta', `${Utils.formatNumber(item.velMediaVolta)} km/h`],
        ['Distância Média/Ciclo', `${Utils.formatNumber(item.distTotal)} km`],
        ['Ciclo Médio', Utils.formatHoras(item.cicloTotal)],
        ['Eficiência Operacional', Utils.formatPercent(item.percOperacional)],
        ['Tempo de Espera', Utils.formatPercent(item.percEspera)],
        ['% Produtiva', Utils.formatPercent(item.percProdutivo)]
      ]);
      cicloLabels = ['Carregamento', 'Ag.Carregamento', 'Transporte', 'Ag.Descarregamento', 'Descarregamento', 'Deslocamento Volta'];
      cicloValores = [item.tempoCarregamento, item.tempoAgCarregamento, item.tempoTransporte,
        item.tempoAgDescarregamento, item.tempoDescarregamento, item.tempoDeslocamentoVolta];
    } else if (item.tipo === 'OFFROAD') {
      indicadoresHtml = indicadorCards([
        ['Tempo Médio Aplicação', Utils.formatHoras(item.tempoAplicacao)],
        ['Tempo Médio Abastecimento', Utils.formatHoras(item.tempoAbastecimento)],
        ['Tempo Médio Ag. Carregamento', Utils.formatHoras(item.tempoAgCarregamento)],
        ['Tempo Médio Falta Insumos', Utils.formatHoras(item.tempoFaltaInsumos)],
        ['Tempo Médio Ag. Liberação', Utils.formatHoras(item.tempoAgLiberacao)],
        ['Tempo Médio Deslocamento (trecho)', Utils.formatHoras(item.tempoDeslocamentoTrecho)],
        ['Velocidade Média', `${Utils.formatNumber(item.velMediaDeslocamento)} km/h`],
        ['Distância Média/Ciclo', `${Utils.formatNumber(item.distPontoCarregamento)} km`],
        ['Ciclo Médio', Utils.formatHoras(item.cicloTotal)],
        ['% Produtiva', Utils.formatPercent(item.percProdutivo)]
      ]);
      cicloLabels = ['Aplicação', 'Abastecimento', 'Deslocamento (trecho)'];
      cicloValores = [item.tempoAplicacao, item.tempoAbastecimento, item.tempoDeslocamentoTrecho];
    } else {
      indicadoresHtml = '<p class="empty-msg">Equipamento não classificado (modelo fora do padrão OFFROAD/CAMINHÃO).</p>';
    }

    // Participação das atividades: mostramos apenas os TOP 5 ofensores
    // (as atividades que mais consomem tempo), ordenados do maior para o menor.
    const porAtividade = Calculations.groupBy(item.registros, 'Atividade');
    const ativPares = [];
    porAtividade.forEach((rowsAtiv, nomeAtiv) => {
      ativPares.push([nomeAtiv, round2(Utils.sum(rowsAtiv.map(r => r.TempoDecimal)))]);
    });
    ativPares.sort((a, b) => b[1] - a[1]);
    const topAtividades = ativPares.slice(0, 5);
    const ativLabels = topAtividades.map(p => p[0]);
    const ativValores = topAtividades.map(p => p[1]);

    painel.innerHTML = `
      <h3>${Utils.escapeHtml(item.equipamento)} <small>(${item.tipo})</small></h3>
      <div class="equip-section">
        <h4>Informações Gerais</h4>
        ${infoHtml}
      </div>
      <div class="equip-section">
        <h4>Indicadores Calculados</h4>
        ${indicadoresHtml}
      </div>
      <div class="equip-section equip-charts">
        <div class="chart-box">
          <h4>Composição do Ciclo</h4>
          <div class="chart-container"><canvas id="chartComposicaoCiclo"></canvas></div>
        </div>
        <div class="chart-box">
          <h4>Participação das Atividades — Top 5 Ofensores</h4>
          <div class="chart-container"><canvas id="chartParticipacaoAtividades"></canvas></div>
        </div>
      </div>
      <div class="equip-section">
        <h4>Histórico da Operação</h4>
        <table id="tabelaHistorico" class="display compact" style="width:100%">
          <thead><tr>
            <th>Data</th><th>Início</th><th>Fim</th><th>Atividade</th>
            <th>Tempo Decimal</th><th>Velocidade</th><th>Fazenda</th>
          </tr></thead><tbody></tbody>
        </table>
      </div>
    `;

    if (cicloLabels.length) {
      Charts.renderDoughnut('chartComposicaoCiclo', cicloLabels, cicloValores.map(round2));
    }
    if (ativLabels.length) {
      Charts.renderHorizontalBar('chartParticipacaoAtividades', ativLabels, [{
        label: 'Horas',
        data: ativValores,
        backgroundColor: APP_CONFIG.colors.info
      }], { labelUnit: 'h' });
    }

    const historicoBody = item.registros
      .slice()
      .sort((a, b) => (a.Inicio && b.Inicio) ? new Date(a.Inicio) - new Date(b.Inicio) : 0)
      .map(r => [
        Utils.formatDateOnly(r.Data),
        Utils.formatDate(r.Inicio),
        Utils.formatDate(r.Fim),
        Utils.escapeHtml(r.Atividade),
        Utils.formatNumber(r.TempoDecimal),
        Utils.formatNumber(r.Velocidade),
        Utils.escapeHtml(r.Fazenda)
      ]);

    if (dtHistorico) dtHistorico.destroy();
    dtHistorico = $('#tabelaHistorico').DataTable({
      data: historicoBody,
      destroy: true,
      pageLength: 10,
      lengthMenu: [10, 25, 50],
      order: [],
      language: dtLangPtBr()
    });
  }

  function indicadorCards(pairs) {
    return `<div class="indicador-grid">` + pairs.map(([label, val]) => `
      <div class="indicador-card">
        <span class="indicador-label">${label}</span>
        <span class="indicador-valor">${val}</span>
      </div>`).join('') + `</div>`;
  }

  /* -------------------- RANKINGS -------------------- */

  function renderRankings(dataset) {
    renderRankingTable('rankCaminhaoMaiorCiclo',
      topN(dataset.caminhoes, 'cicloTotal', 5, true), 'cicloTotal', 'h');
    renderRankingTable('rankCaminhaoMenorCiclo',
      topN(dataset.caminhoes, 'cicloTotal', 5, false), 'cicloTotal', 'h');
    renderRankingTable('rankCaminhaoMaiorDistancia',
      topN(dataset.caminhoes, 'distTotal', 5, true), 'distTotal', 'km');
    renderRankingTable('rankCaminhaoMenorDistancia',
      topN(dataset.caminhoes, 'distTotal', 5, false), 'distTotal', 'km');
    renderRankingTable('rankCaminhaoMaiorEspera',
      topN(dataset.caminhoes, 'tempoEspera', 5, true), 'tempoEspera', 'h');

    renderRankingTable('rankOffroadMaiorCiclo',
      topN(dataset.offroads, 'cicloTotal', 5, true), 'cicloTotal', 'h');
    renderRankingTable('rankOffroadMaiorEspera',
      topN(dataset.offroads, 'tempoEspera', 5, true), 'tempoEspera', 'h');
    renderRankingTable('rankOffroadMaiorDeslocamento',
      topN(dataset.offroads, 'tempoDeslocamento', 5, true), 'tempoDeslocamento', 'h');
    renderRankingTable('rankOffroadMaiorFaltaInsumos',
      topN(dataset.offroads, 'tempoFaltaInsumos', 5, true), 'tempoFaltaInsumos', 'h');
  }

  function topN(arr, field, n, desc) {
    return arr.slice().sort((a, b) => desc ? b[field] - a[field] : a[field] - b[field]).slice(0, n);
  }

  function renderRankingTable(containerId, items, field, unit) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (items.length === 0) {
      el.innerHTML = '<p class="empty-msg">Sem dados suficientes.</p>';
      return;
    }
    el.innerHTML = `
      <table class="rank-table">
        <thead><tr><th>#</th><th>Equipamento</th><th>Modelo</th><th>Valor</th></tr></thead>
        <tbody>
          ${items.map((it, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${Utils.escapeHtml(it.equipamento)}</td>
              <td>${Utils.escapeHtml(it.modelo)}</td>
              <td>${unit === 'h' ? Utils.formatHoras(it[field]) : `${Utils.formatNumber(it[field])} ${unit}`}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  }

  /* -------------------- HELPERS -------------------- */

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function round2(n) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  function dtLangPtBr() {
    return {
      search: 'Buscar:',
      lengthMenu: 'Mostrar _MENU_ registros',
      info: 'Mostrando _START_ a _END_ de _TOTAL_ registros',
      infoEmpty: 'Nenhum registro disponível',
      infoFiltered: '(filtrado de _MAX_ registros no total)',
      zeroRecords: 'Nenhum registro encontrado',
      paginate: { first: 'Primeiro', last: 'Último', next: 'Próximo', previous: 'Anterior' }
    };
  }

  function renderAll(dataset) {
    renderResumo(dataset);
    renderCaminhoesTab(dataset);
    renderOffroadsTab(dataset);
    renderEquipamentosList(dataset);
    renderRankings(dataset);
  }

  return { renderAll, renderResumo, renderCaminhoesTab, renderOffroadsTab, renderEquipamentosList, renderRankings };
})();
