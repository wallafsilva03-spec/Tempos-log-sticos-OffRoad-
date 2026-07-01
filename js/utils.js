/* ============================================================
   UTILS.JS - Funções utilitárias genéricas
   ============================================================ */

const Utils = (function () {

  function removeAccents(str) {
    return String(str)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  }

  function normalize(str) {
    if (str === null || str === undefined) return '';
    return removeAccents(String(str)).trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function toNumber(val) {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return isFinite(val) ? val : 0;
    const cleaned = String(val).trim().replace(/\./g, '').replace(',', '.');
    const n1 = parseFloat(String(val).trim());
    if (!isNaN(n1) && String(val).indexOf(',') === -1) return n1;
    const n2 = parseFloat(cleaned);
    return isNaN(n2) ? 0 : n2;
  }

  function toStringSafe(val) {
    if (val === null || val === undefined) return '';
    return String(val).trim();
  }

  function mode(arr) {
    const clean = arr.filter(v => v !== null && v !== undefined && v !== '');
    if (clean.length === 0) return '';
    const counts = new Map();
    let best = clean[0], bestCount = 0;
    for (const v of clean) {
      const c = (counts.get(v) || 0) + 1;
      counts.set(v, c);
      if (c > bestCount) { bestCount = c; best = v; }
    }
    return best;
  }

  function sum(arr) {
    return arr.reduce((a, b) => a + (isFinite(b) ? b : 0), 0);
  }

  function avg(arr) {
    const clean = arr.filter(v => typeof v === 'number' && isFinite(v));
    if (clean.length === 0) return 0;
    return sum(clean) / clean.length;
  }

  // Converte horas decimais em "Hh Mm"
  function formatHoras(decimalHoras) {
    if (!isFinite(decimalHoras) || decimalHoras < 0) decimalHoras = 0;
    const totalMin = Math.round(decimalHoras * 60);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${h}h ${String(m).padStart(2, '0')}m`;
  }

  function formatNumber(n, decimals = 2) {
    if (!isFinite(n)) n = 0;
    return n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  function formatPercent(n, decimals = 1) {
    if (!isFinite(n)) n = 0;
    return `${formatNumber(n, decimals)}%`;
  }

  function formatDate(val) {
    if (!val) return '';
    if (val instanceof Date && !isNaN(val)) {
      return val.toLocaleString('pt-BR');
    }
    return String(val);
  }

  function uniqueSorted(arr) {
    return Array.from(new Set(arr.filter(v => v !== null && v !== undefined && v !== '')))
      .sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'));
  }

  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = String(str === null || str === undefined ? '' : str);
    return div.innerHTML;
  }

  return {
    removeAccents, normalize, toNumber, toStringSafe, mode, sum, avg,
    formatHoras, formatNumber, formatPercent, formatDate, uniqueSorted,
    debounce, escapeHtml
  };
})();
