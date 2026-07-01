/* ============================================================
   APP.JS - Controlador principal: navegação, importação,
   estado global e ligação de eventos.
   ============================================================ */

const App = (function () {
  let dataset = null;

  function init() {
    bindNav();
    bindFileInput();
    bindExport();
    showEmptyState();
  }

  function bindNav() {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-target');
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        const panel = document.getElementById(target);
        if (panel) panel.classList.add('active');
      });
    });
  }

  function bindFileInput() {
    const input = document.getElementById('fileInput');
    if (!input) return;
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      await processFile(file);
      input.value = '';
    });
  }

  function bindExport() {
    const btn = document.getElementById('btnGerarPdf');
    if (!btn) return;
    btn.addEventListener('click', () => ExportModule.gerarPdfExecutivo(dataset));
  }

  async function processFile(file) {
    setLoading(true);
    hideError();
    try {
      const rows = await Parser.readFile(file);
      dataset = Calculations.buildDataset(rows);

      if (dataset.caminhoes.length === 0 && dataset.offroads.length === 0) {
        showWarning('Nenhum equipamento foi classificado como CAMINHÃO ou OFFROAD. ' +
          'Verifique se a coluna Modelo segue o padrão esperado.');
      }

      Render.renderAll(dataset);
      updateFileStatus(file.name, dataset);
      showApp();
    } catch (err) {
      console.error(err);
      showError(err.message || 'Erro desconhecido ao processar o arquivo.');
    } finally {
      setLoading(false);
    }
  }

  function updateFileStatus(fileName, dataset) {
    const el = document.getElementById('fileStatus');
    if (!el) return;
    const agora = new Date().toLocaleString('pt-BR');
    el.innerHTML = `<strong>${Utils.escapeHtml(fileName)}</strong> · ${dataset.totalLinhas} registros ·
      atualizado em ${agora}`;
  }

  function showLoadingBanner() {}

  function setLoading(isLoading) {
    const el = document.getElementById('loadingIndicator');
    if (el) el.style.display = isLoading ? 'inline-flex' : 'none';
  }

  function showError(msg) {
    const el = document.getElementById('errorBanner');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    el.classList.remove('warning-banner');
    el.classList.add('error-banner');
  }

  function showWarning(msg) {
    const el = document.getElementById('errorBanner');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    el.classList.remove('error-banner');
    el.classList.add('warning-banner');
  }

  function hideError() {
    const el = document.getElementById('errorBanner');
    if (el) { el.style.display = 'none'; el.textContent = ''; }
  }

  function showEmptyState() {
    document.getElementById('appContent').style.display = 'none';
    document.getElementById('emptyState').style.display = 'flex';
  }

  function showApp() {
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('appContent').style.display = 'block';
  }

  return { init, getDataset: () => dataset };
})();

document.addEventListener('DOMContentLoaded', App.init);
