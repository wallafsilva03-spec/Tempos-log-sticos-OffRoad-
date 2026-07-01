/* ============================================================
   CHARTS.JS - Criação e atualização de gráficos Chart.js
   ============================================================ */

const Charts = (function () {
  const registry = {};

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
        tooltip: { enabled: true }
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
        scales: { y: { beginAtZero: true } }
      }, opts))
    });
    return registry[canvasId];
  }

  function renderDoughnut(canvasId, labels, data, opts = {}) {
    destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;
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
      options: baseOptions(opts)
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
        scales: { x: { beginAtZero: true } }
      }, opts))
    });
    return registry[canvasId];
  }

  function getImage(canvasId) {
    const chart = registry[canvasId];
    return chart ? chart.toBase64Image() : null;
  }

  return { renderBar, renderDoughnut, renderHorizontalBar, destroy, destroyAll, getImage, registry };
})();
