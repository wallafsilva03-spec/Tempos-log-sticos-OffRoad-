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

  // Normalização tolerante para nomes de atividade: remove ordinais (1ª, 2º),
  // conteúdo entre parênteses, pontuação e múltiplos espaços.
  function normalizeAtividade(str) {
    let n = normalize(str);
    n = n.replace(/[ºª]/g, '');
    n = n.replace(/\(.*?\)/g, ' ');
    n = n.replace(/[.\-\/]/g, ' ');
    n = n.replace(/\d+/g, ' ');
    n = n.replace(/\s+/g, ' ').trim();
    return n;
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

  // Converte um serial de data do Excel (número de dias desde 1899-12-30,
  // incluindo fração para hora) em um objeto Date. Necessário porque
  // algumas exportações gravam a célula como número puro, sem formatação
  // de data, e o SheetJS não converte automaticamente nesse caso.
  function parseExcelSerialDate(serial) {
    if (!isFinite(serial)) return null;
    const utcDays = Math.floor(serial - 25569);
    const utcValue = utcDays * 86400;
    const dateInfo = new Date(utcValue * 1000);
    const fractionalDay = serial - Math.floor(serial) + 0.0000001;
    let totalSeconds = Math.floor(86400 * fractionalDay);
    const seconds = totalSeconds % 60;
    totalSeconds -= seconds;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor(totalSeconds / 60) % 60;
    return new Date(dateInfo.getUTCFullYear(), dateInfo.getUTCMonth(), dateInfo.getUTCDate(), hours, minutes, seconds);
  }

  // Aceita Date, número serial do Excel ou string e retorna um Date válido ou null.
  function toDateSafe(val) {
    if (val === null || val === undefined || val === '') return null;
    if (val instanceof Date) return isNaN(val) ? null : val;
    if (typeof val === 'number') return parseExcelSerialDate(val);
    const d = new Date(val);
    return isNaN(d) ? null : d;
  }

  function formatDate(val) {
    const d = val instanceof Date ? val : toDateSafe(val);
    if (!d) return val === null || val === undefined ? '' : String(val);
    return d.toLocaleString('pt-BR');
  }

  function formatDateOnly(val) {
    const d = val instanceof Date ? val : toDateSafe(val);
    if (!d) return val === null || val === undefined ? '' : String(val);
    return d.toLocaleDateString('pt-BR');
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
    removeAccents, normalize, normalizeAtividade, toNumber, toStringSafe, mode, sum, avg,
    formatHoras, formatNumber, formatPercent, formatDate, formatDateOnly,
    parseExcelSerialDate, toDateSafe, uniqueSorted,
    debounce, escapeHtml
  };
})();
