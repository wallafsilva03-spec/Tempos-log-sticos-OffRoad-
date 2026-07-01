/* ============================================================
   EXPORT.JS - Geração do PDF Executivo (via impressão do navegador)
   Contém apenas a Visão de Ciclo de Caminhões e Offroads.
   ============================================================ */

const ExportModule = (function () {

  async function gerarPdfExecutivo(dataset) {
    if (!dataset) {
      alert('Importe um arquivo XLSX antes de gerar o PDF.');
      return;
    }
    const area = document.getElementById('printArea');
    const agora = new Date().toLocaleString('pt-BR');

    const cam = cicloMedioCaminhao(dataset.caminhoes);
    const off = cicloMedioOffroad(dataset.offroads);

    const painelOriginal = document.querySelector('.tab-panel.active');
    const [imgCam, imgOff] = await capturarImagensCiclo(dataset);
    if (painelOriginal) {
      document.querySelectorAll('.tab-panel.active').forEach(p => p.classList.remove('active'));
      painelOriginal.classList.add('active');
    }

    area.innerHTML = `
      <div class="print-header">
        <h1>Relatório Executivo - Operação de Vinhaça</h1>
        <p>Gerado em ${agora} • ${dataset.totalLinhas} registros processados</p>
      </div>

      <h2>Visão de Ciclo - Caminhões</h2>
      <div class="print-kpis">
        ${printKpi('Ciclo Médio', Utils.formatHoras(cam.cicloMedio))}
        ${printKpi('Tempo Médio Carregamento', Utils.formatHoras(cam.carregamentoMedio))}
        ${printKpi('Tempo Médio Ag. Carregamento', Utils.formatHoras(cam.agCarregamentoMedio))}
        ${printKpi('Tempo Médio Transporte', Utils.formatHoras(cam.transporteMedio))}
        ${printKpi('Tempo Médio Ag. Descarregamento', Utils.formatHoras(cam.agDescarregamentoMedio))}
        ${printKpi('Tempo Médio Descarregamento', Utils.formatHoras(cam.descarregamentoMedio))}
        ${printKpi('Tempo Médio Deslocamento Volta', Utils.formatHoras(cam.deslocamentoMedio))}
      </div>
      ${imgCam ? `<div class="print-charts"><div><h4>Composição do Ciclo Médio - Caminhão</h4><img src="${imgCam}"/></div></div>` : ''}

      <h2>Visão de Ciclo - Offroads</h2>
      <div class="print-kpis">
        ${printKpi('Ciclo Médio', Utils.formatHoras(off.cicloMedio))}
        ${printKpi('Tempo Médio Abastecimento', Utils.formatHoras(off.abastecimentoMedio))}
        ${printKpi('Tempo Médio Ag. Carregamento', Utils.formatHoras(off.agCarregamentoMedio))}
        ${printKpi('Tempo Médio Falta Insumos', Utils.formatHoras(off.faltaInsumosMedio))}
        ${printKpi('Tempo Médio Ag. Liberação', Utils.formatHoras(off.agLiberacaoMedio))}
        ${printKpi('Tempo Médio Deslocamento', Utils.formatHoras(off.deslocamentoMedio))}
      </div>
      ${imgOff ? `<div class="print-charts"><div><h4>Composição do Ciclo Médio - Offroad</h4><img src="${imgOff}"/></div></div>` : ''}
    `;

    document.body.classList.add('print-mode');
    window.print();
    setTimeout(() => document.body.classList.remove('print-mode'), 500);
  }

  // Os gráficos de composição do ciclo vivem nas abas Caminhões/Offroads.
  // Se o usuário nunca visitou essas abas, o canvas foi criado dentro de um
  // container display:none - o ResizeObserver do Chart.js ignora containers
  // 0x0 na criação e o gráfico nunca chega a desenhar, então só chamar
  // resize() depois não resolve. A solução é tornar a aba visível e
  // recriar o gráfico nesse momento, quando o container já tem tamanho
  // real; depois devolvemos a aba ativa original.
  async function capturarImagensCiclo(dataset) {
    const imgCam = await capturarUmaAba('tab-caminhoes', 'chartCicloCaminhao', () => Render.renderCaminhoesTab(dataset));
    const imgOff = await capturarUmaAba('tab-offroads', 'chartCicloOffroad', () => Render.renderOffroadsTab(dataset));
    return [imgCam, imgOff];
  }

  // Ativa uma única aba por vez, recria seu gráfico e captura a imagem.
  // Processar uma de cada vez (em vez de deixar as duas visíveis ao mesmo
  // tempo) evita que o navegador calcule um layout inconsistente durante
  // a transição. A aba originalmente ativa é restaurada pelo chamador.
  async function capturarUmaAba(painelId, canvasId, renderFn) {
    const painel = document.getElementById(painelId);
    document.querySelectorAll('.tab-panel.active').forEach(p => p.classList.remove('active'));
    painel.classList.add('active');
    renderFn();

    // O gráfico acabou de ser (re)criado, então a animação de entrada do
    // Chart.js (duração padrão de 1s) ainda está em andamento; capturar
    // cedo demais pega um quadro parcial (arco "crescendo"). Espera a
    // animação terminar antes de gerar a imagem.
    await new Promise(resolve => setTimeout(resolve, 1100));
    return Charts.getImage(canvasId);
  }

  function cicloMedioCaminhao(rows) {
    return {
      cicloMedio: Utils.avg(rows.map(c => c.cicloTotal)),
      carregamentoMedio: Utils.avg(rows.map(c => c.tempoCarregamento)),
      agCarregamentoMedio: Utils.avg(rows.map(c => c.tempoAgCarregamento)),
      transporteMedio: Utils.avg(rows.map(c => c.tempoTransporte)),
      agDescarregamentoMedio: Utils.avg(rows.map(c => c.tempoAgDescarregamento)),
      descarregamentoMedio: Utils.avg(rows.map(c => c.tempoDescarregamento)),
      deslocamentoMedio: Utils.avg(rows.map(c => c.tempoDeslocamentoVolta))
    };
  }

  function cicloMedioOffroad(rows) {
    return {
      cicloMedio: Utils.avg(rows.map(o => o.cicloTotal)),
      abastecimentoMedio: Utils.avg(rows.map(o => o.tempoAbastecimento)),
      agCarregamentoMedio: Utils.avg(rows.map(o => o.tempoAgCarregamento)),
      faltaInsumosMedio: Utils.avg(rows.map(o => o.tempoFaltaInsumos)),
      agLiberacaoMedio: Utils.avg(rows.map(o => o.tempoAgLiberacao)),
      deslocamentoMedio: Utils.avg(rows.map(o => o.tempoDeslocamento))
    };
  }

  function printKpi(label, value) {
    return `<div class="print-kpi"><span>${label}</span><strong>${value}</strong></div>`;
  }

  return { gerarPdfExecutivo };
})();
