/* ============================================================
   CALCULATIONS.JS - Agregações e indicadores por equipamento
   ============================================================ */

const Calculations = (function () {

  // Casa uma linha com uma categoria de atividade { codes: [...], aliases: [...] }
  // usando primeiro o código numérico (CD Atividade, estável entre exportações)
  // e, como fallback, o texto normalizado (tolerante a acentos/pontuação/maiúsculas).
  function matchesCategoria(row, categoria) {
    const cod = Utils.toNumber(row.CD_Atividade);
    if (categoria.codes && categoria.codes.length && cod && categoria.codes.includes(cod)) {
      return true;
    }
    const textoLinha = Utils.normalizeAtividade(row.Atividade);
    if (!textoLinha) return false;
    return categoria.aliases.some(alias => {
      const a = Utils.normalizeAtividade(alias);
      return textoLinha === a || textoLinha.startsWith(a);
    });
  }

  function sumTempoAtividade(rows, categoria) {
    return Utils.sum(rows.filter(r => matchesCategoria(r, categoria)).map(r => r.TempoDecimal));
  }

  // Um equipamento executa a mesma atividade (ex.: Carregamento) várias
  // vezes ao longo do período importado (um ciclo por viagem). O indicador
  // de tempo de cada etapa é a MÉDIA de duração por ocorrência - o tempo
  // médio daquela etapa em UM ciclo - e não a soma acumulada do período
  // inteiro (que cresceria sem limite conforme mais dias fossem importados).
  function avgTempoAtividade(rows, categoria, maxTempo) {
    let tempos = rows.filter(r => matchesCategoria(r, categoria)).map(r => r.TempoDecimal);
    // Alguns apontamentos ficam abertos por longos períodos (equipamento
    // parado à noite/fim de semana) e distorcem a média de uma etapa. Quando
    // informado, maxTempo descarta ocorrências acima desse limite (em horas),
    // mantendo apenas os ciclos dentro da janela operacional esperada.
    if (typeof maxTempo === 'number') {
      tempos = tempos.filter(t => t <= maxTempo);
    }
    return Utils.avg(tempos);
  }

  // Limite de duração (horas) para considerar um apontamento de
  // Ag. Descarregamento como parte de um ciclo real. Acima disso é
  // equipamento parado, não espera de descarregamento.
  const MAX_CICLO_AG_DESCARREGAMENTO = 7;

  function countCategoria(rows, categoria) {
    return rows.filter(r => matchesCategoria(r, categoria)).length;
  }

  function avgVelocidadeAtividade(rows, categoria) {
    const vals = rows.filter(r => matchesCategoria(r, categoria) && r.Velocidade > 0).map(r => r.Velocidade);
    return Utils.avg(vals);
  }

  // A coluna Classificacao_Ativ marca cada linha como PRODUTIVA, AUXILIAR,
  // IMPRODUTIVO ou MANUTENCAO, independente da atividade específica. Usamos
  // essa classificação (em vez de uma lista fixa de atividades) para achar
  // o tempo produtivo de forma robusta a mudanças de nomenclatura.
  function isProdutiva(row) {
    return Utils.normalize(row.Classificacao_Ativ) === 'produtiva';
  }

  function avgTempoProdutivo(rows) {
    return Utils.avg(rows.filter(isProdutiva).map(r => r.TempoDecimal));
  }

  // % do tempo total registrado (todas as atividades) que foi produtivo.
  function percProdutivo(rows) {
    const total = Utils.sum(rows.map(r => r.TempoDecimal));
    if (total <= 0) return 0;
    const produtivo = Utils.sum(rows.filter(isProdutiva).map(r => r.TempoDecimal));
    return (produtivo / total) * 100;
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

    const tempoCarregamento = avgTempoAtividade(rows, A.carregamento);
    const tempoAgCarregamento = avgTempoAtividade(rows, A.agCarregamento);
    const tempoTransporte = avgTempoAtividade(rows, A.transporte);
    const tempoAgDescarregamento = avgTempoAtividade(rows, A.agDescarregamento, MAX_CICLO_AG_DESCARREGAMENTO);
    const tempoDescarregamento = avgTempoAtividade(rows, A.descarregamento);
    const tempoDeslocamentoVolta = avgTempoAtividade(rows, A.deslocamentoVolta);
    const numCiclos = countCategoria(rows, A.carregamento);

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

    // No caminhão a atividade produtiva (Classificacao_Ativ = PRODUTIVA) já
    // corresponde ao Transporte + Deslocamento Volta, então já está contida
    // no Ciclo Total acima - aqui só expomos o valor agregado e o % sobre
    // o tempo total registrado.
    const tempoProdutivo = tempoTransporte + tempoDeslocamentoVolta;
    const percProd = percProdutivo(rows);

    return {
      equipamento,
      modelo: Utils.mode(rows.map(r => r.Modelo)),
      frente: Utils.mode(rows.map(r => r.Frente)),
      fazenda: Utils.mode(rows.map(r => r.Fazenda)),
      tipo: 'CAMINHAO',
      numCiclos,
      tempoCarregamento,
      tempoAgCarregamento,
      tempoTransporte,
      tempoAgDescarregamento,
      tempoDescarregamento,
      tempoDeslocamentoVolta,
      tempoProdutivo,
      percProdutivo: percProd,
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

    const tempoAbastecimento = avgTempoAtividade(rows, A.abastecimento);
    const tempoAgCarregamento = avgTempoAtividade(rows, A.agCarregamento);
    const tempoFaltaInsumos = avgTempoAtividade(rows, A.faltaInsumos);
    const tempoAgLiberacao = avgTempoAtividade(rows, A.agLiberacao);
    const tempoDeslocamento = avgTempoAtividade(rows, A.deslocamento);
    const numCiclos = countCategoria(rows, A.deslocamento);

    const velMediaDeslocamento = avgVelocidadeAtividade(rows, A.deslocamento);
    // O deslocamento apontado cobre ida + volta; o trecho é metade.
    const tempoDeslocamentoTrecho = tempoDeslocamento / 2;
    const distPontoCarregamento = (tempoDeslocamento * velMediaDeslocamento) / 2;

    // O offroad não tinha nenhuma atividade "produtiva" (aplicação de
    // vinhaça) nas categorias originais - ela usa códigos próprios que
    // variam de exportação para exportação, então identificamos pelo
    // Classificacao_Ativ = PRODUTIVA em vez de um código fixo. Sem isso o
    // Ciclo Total do offroad não incluía o tempo do trabalho em si.
    const tempoAplicacao = avgTempoProdutivo(rows);

    // O Ciclo do offroad é composto apenas por Aplicação + Abastecimento +
    // Deslocamento (trecho). As demais etapas (Ag. Carregamento, Falta de
    // Insumos, Ag. Liberação) são esperas/paradas e não entram no ciclo.
    const cicloTotal = tempoAplicacao + tempoAbastecimento + tempoDeslocamentoTrecho;

    const tempoEspera = tempoAgCarregamento + tempoAgLiberacao + tempoFaltaInsumos;
    const percProd = percProdutivo(rows);

    return {
      equipamento,
      modelo: Utils.mode(rows.map(r => r.Modelo)),
      frente: Utils.mode(rows.map(r => r.Frente)),
      fazenda: Utils.mode(rows.map(r => r.Fazenda)),
      tipo: 'OFFROAD',
      numCiclos,
      tempoAplicacao,
      percProdutivo: percProd,
      tempoAbastecimento,
      tempoAgCarregamento,
      tempoFaltaInsumos,
      tempoAgLiberacao,
      tempoDeslocamento,
      tempoDeslocamentoTrecho,
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

    const percProdutivoMedioCaminhoes = Utils.avg(caminhoes.map(c => c.percProdutivo));
    const percProdutivoMedioOffroads = Utils.avg(offroads.map(o => o.percProdutivo));

    return {
      qtdCaminhoes, qtdOffroads,
      cicloMedioCaminhoes, cicloMedioOffroads,
      distMediaCaminhoes, distMediaOffroads,
      percMedioOperacional, percMedioEspera,
      percProdutivoMedioCaminhoes, percProdutivoMedioOffroads
    };
  }

  return { buildDataset, resumoExecutivo, sumTempoAtividade, avgTempoAtividade, avgVelocidadeAtividade, countCategoria, groupBy };
})();
