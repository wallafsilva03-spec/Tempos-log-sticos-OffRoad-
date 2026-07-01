/* ============================================================
   CALCULATIONS.JS - Agregações e indicadores por equipamento
   ============================================================ */

const Calculations = (function () {

  function sumTempoAtividade(rows, nomeAtividade) {
    const alvo = Utils.normalize(nomeAtividade);
    return Utils.sum(rows.filter(r => Utils.normalize(r.Atividade) === alvo).map(r => r.TempoDecimal));
  }

  function avgVelocidadeAtividade(rows, nomeAtividade) {
    const alvo = Utils.normalize(nomeAtividade);
    const vals = rows.filter(r => Utils.normalize(r.Atividade) === alvo && r.Velocidade > 0).map(r => r.Velocidade);
    return Utils.avg(vals);
  }

  function groupBy(rows, key) {
    const map = new Map();
    rows.forEach(r => {
      const k = r[key];
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(r);
    });
    return map;
  }

  function calcularCaminhao(equipamento, rows) {
    const A = APP_CONFIG.atividadesCaminhao;

    const tempoCarregamento = sumTempoAtividade(rows, A.carregamento);
    const tempoAgCarregamento = sumTempoAtividade(rows, A.agCarregamento);
    const tempoTransporte = sumTempoAtividade(rows, A.transporte);
    const tempoAgDescarregamento = sumTempoAtividade(rows, A.agDescarregamento);
    const tempoDescarregamento = sumTempoAtividade(rows, A.descarregamento);
    const tempoDeslocamentoVolta = sumTempoAtividade(rows, A.deslocamentoVolta);

    const velMediaIda = avgVelocidadeAtividade(rows, A.transporte);
    const velMediaVolta = avgVelocidadeAtividade(rows, A.deslocamentoVolta);

    const distIda = tempoTransporte * velMediaIda;
    const distVolta = tempoDeslocamentoVolta * velMediaVolta;
    const distTotal = distIda + distVolta;

    const cicloTotal = tempoAgCarregamento + tempoCarregamento + tempoTransporte +
      tempoAgDescarregamento + tempoDescarregamento + tempoDeslocamentoVolta;

    const percEspera = cicloTotal > 0
      ? ((tempoAgCarregamento + tempoAgDescarregamento) / cicloTotal) * 100
      : 0;
    const percOperacional = cicloTotal > 0
      ? ((tempoCarregamento + tempoTransporte + tempoDescarregamento + tempoDeslocamentoVolta) / cicloTotal) * 100
      : 0;

    return {
      equipamento,
      modelo: Utils.mode(rows.map(r => r.Modelo)),
      frente: Utils.mode(rows.map(r => r.Frente)),
      fazenda: Utils.mode(rows.map(r => r.Fazenda)),
      tipo: 'CAMINHAO',
      tempoCarregamento,
      tempoAgCarregamento,
      tempoTransporte,
      tempoAgDescarregamento,
      tempoDescarregamento,
      tempoDeslocamentoVolta,
      velMediaIda,
      velMediaVolta,
      distIda,
      distVolta,
      distTotal,
      cicloTotal,
      percOperacional,
      percEspera,
      tempoEspera: tempoAgCarregamento + tempoAgDescarregamento,
      registros: rows
    };
  }

  function calcularOffroad(equipamento, rows) {
    const A = APP_CONFIG.atividadesOffroad;

    const tempoAbastecimento = sumTempoAtividade(rows, A.abastecimento);
    const tempoAgCarregamento = sumTempoAtividade(rows, A.agCarregamento);
    const tempoFaltaInsumos = sumTempoAtividade(rows, A.faltaInsumos);
    const tempoAgLiberacao = sumTempoAtividade(rows, A.agLiberacao);
    const tempoDeslocamento = sumTempoAtividade(rows, A.deslocamento);

    const velMediaDeslocamento = avgVelocidadeAtividade(rows, A.deslocamento);
    const distPontoCarregamento = tempoDeslocamento * velMediaDeslocamento;

    const cicloTotal = tempoAbastecimento + tempoAgCarregamento + tempoFaltaInsumos +
      tempoAgLiberacao + tempoDeslocamento;

    const tempoEspera = tempoAgCarregamento + tempoAgLiberacao + tempoFaltaInsumos;

    return {
      equipamento,
      modelo: Utils.mode(rows.map(r => r.Modelo)),
      frente: Utils.mode(rows.map(r => r.Frente)),
      fazenda: Utils.mode(rows.map(r => r.Fazenda)),
      tipo: 'OFFROAD',
      tempoAbastecimento,
      tempoAgCarregamento,
      tempoFaltaInsumos,
      tempoAgLiberacao,
      tempoDeslocamento,
      velMediaDeslocamento,
      distPontoCarregamento,
      cicloTotal,
      tempoEspera,
      registros: rows
    };
  }

  function buildDataset(rows) {
    const porEquipamento = groupBy(rows, 'Equipamento');

    const caminhoes = [];
    const offroads = [];
    const outros = [];

    porEquipamento.forEach((rowsEq, equipamento) => {
      const tipo = Utils.mode(rowsEq.map(r => r.Tipo_Equipamento));
      if (tipo === 'CAMINHAO') {
        caminhoes.push(calcularCaminhao(equipamento, rowsEq));
      } else if (tipo === 'OFFROAD') {
        offroads.push(calcularOffroad(equipamento, rowsEq));
      } else {
        outros.push({
          equipamento,
          modelo: Utils.mode(rowsEq.map(r => r.Modelo)),
          frente: Utils.mode(rowsEq.map(r => r.Frente)),
          fazenda: Utils.mode(rowsEq.map(r => r.Fazenda)),
          tipo: 'OUTRO',
          registros: rowsEq
        });
      }
    });

    caminhoes.sort((a, b) => a.equipamento.localeCompare(b.equipamento, 'pt-BR'));
    offroads.sort((a, b) => a.equipamento.localeCompare(b.equipamento, 'pt-BR'));
    outros.sort((a, b) => a.equipamento.localeCompare(b.equipamento, 'pt-BR'));

    return {
      rawRows: rows,
      caminhoes,
      offroads,
      outros,
      totalLinhas: rows.length,
      geradoEm: new Date()
    };
  }

  function resumoExecutivo(dataset) {
    const { caminhoes, offroads } = dataset;

    const qtdCaminhoes = caminhoes.length;
    const qtdOffroads = offroads.length;

    const cicloMedioCaminhoes = Utils.avg(caminhoes.map(c => c.cicloTotal));
    const cicloMedioOffroads = Utils.avg(offroads.map(o => o.cicloTotal));

    const distMediaCaminhoes = Utils.avg(caminhoes.map(c => c.distTotal));
    const distMediaOffroads = Utils.avg(offroads.map(o => o.distPontoCarregamento));

    const percMedioOperacional = Utils.avg(caminhoes.map(c => c.percOperacional));
    const percMedioEspera = Utils.avg(caminhoes.map(c => c.percEspera));

    return {
      qtdCaminhoes, qtdOffroads,
      cicloMedioCaminhoes, cicloMedioOffroads,
      distMediaCaminhoes, distMediaOffroads,
      percMedioOperacional, percMedioEspera
    };
  }

  return { buildDataset, resumoExecutivo, sumTempoAtividade, avgVelocidadeAtividade, groupBy };
})();
