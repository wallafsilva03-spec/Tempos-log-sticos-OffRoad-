/* ============================================================
   CHARTS.JS - Criação e atualização de gráficos Chart.js
   ============================================================ */

const Charts = (function () {
  const registry = {};

  if (typeof ChartDataLabels !== 'undefined' && typeof Chart !== 'undefined') {
    Chart.register(ChartDataLabels);
  }

  function destroy(id) {
    if (registry[id]) {
      registry[id].destroy();
      delete registry[id];
    }
  }

  function destroyAll() {
    Object.keys(registry).forEach(destroy);
  }

  function baseOptions(extra = {}) {
    return Object.assign({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
        tooltip: { enabled: true },
        datalabels: { display: false }
      }
    }, extra);
  }

  function renderBar(canvasId, labels, datasets, opts = {}) {
    destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;
    registry[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets },
      options: baseOptions(Object.assign({
        scales: { y: { beginAtZero: true } },
        plugins: {
          datalabels: {
            display: true,
            anchor: 'end',
            align: 'top',
            color: APP_CONFIG.colors.slate,
            font: { weight: '600', size: 11 },
            formatter: (value) => formatLabelValue(value, opts.labelUnit)
          }
        }
      }, opts))
    });
    return registry[canvasId];
  }

  function renderDoughnut(canvasId, labels, data, opts = {}) {
    destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;
    const total = Utils.sum(data);
    registry[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: APP_CONFIG.colors.chartPalette,
          borderWidth: 1
        }]
      },
      options: baseOptions(Object.assign({
        plugins: {
          datalabels: {
            display: (ctx2) => ctx2.dataset.data[ctx2.dataIndex] > 0,
            color: '#fff',
            font: { weight: '600', size: 10.5 },
            formatter: (value) => {
              if (!total) return '';
              const perc = (value / total) * 100;
              return perc >= 4 ? `${Utils.formatNumber(perc, 1)}%` : '';
            }
          }
        }
      }, opts))
    });
    return registry[canvasId];
  }

  function renderHorizontalBar(canvasId, labels, datasets, opts = {}) {
    destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;
    registry[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets },
      options: baseOptions(Object.assign({
        indexAxis: 'y',
        scales: { x: { beginAtZero: true } },
        plugins: {
          datalabels: {
            display: true,
            anchor: 'end',
            align: 'end',
            color: APP_CONFIG.colors.slate,
            font: { weight: '600', size: 11 },
            formatter: (value) => formatLabelValue(value, opts.labelUnit)
          }
        }
      }, opts))
    });
    return registry[canvasId];
  }

  function formatLabelValue(value, unit) {
    if (!isFinite(value)) return '';
    if (unit === 'h') return Utils.formatHoras(value);
    if (unit === 'km') return `${Utils.formatNumber(value)} km`;
    return Utils.formatNumber(value);
  }

  // Se o gráfico vive em uma aba que nunca foi exibida (display:none), seu
  // canvas ainda tem tamanho 0x0 e a imagem exportada sairia em branco.
  // Forçar um tamanho explícito antes de capturar resolve isso; depois
  // devolve o gráfico ao modo responsivo normal.
  function getImage(canvasId, forceWidth = 640, forceHeight = 360) {
    const chart = registry[canvasId];
    if (!chart) return null;
    const precisaForcar = chart.width === 0 || chart.height === 0;
    if (precisaForcar) chart.resize(forceWidth, forceHeight);
    const img = chart.toBase64Image();
    if (precisaForcar) chart.resize();
    return img;
  }

  return { renderBar, renderDoughnut, renderHorizontalBar, destroy, destroyAll, getImage, registry };
})();
