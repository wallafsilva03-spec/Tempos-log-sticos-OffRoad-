/* ============================================================
   PARSER.JS - Leitura e normalização do arquivo XLSX
   ============================================================ */

const Parser = (function () {

  function classificarTipo(equipamento, modelo) {
    const eq = Utils.toStringSafe(equipamento);
    const mod = Utils.normalize(modelo);

    // Regra especial: equipamento 13085 com MB AXOR 3344 -> OFFROAD
    if (eq === APP_CONFIG.offroadExcecaoEquipamento &&
        mod === Utils.normalize(APP_CONFIG.offroadExcecaoModelo)) {
      return 'OFFROAD';
    }

    const isOffroad = APP_CONFIG.offroadModelos.some(m => Utils.normalize(m) === mod);
    if (isOffroad) return 'OFFROAD';

    const isCaminhao = APP_CONFIG.caminhaoModelos.some(m => Utils.normalize(m) === mod);
    if (isCaminhao) return 'CAMINHAO';

    return 'OUTRO';
  }

  function normalizeHeaderKey(key) {
    return String(key).trim();
  }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error('Nenhum arquivo selecionado.'));

      const validExt = /\.(xlsx|xls)$/i.test(file.name);
      if (!validExt) {
        return reject(new Error('Formato inválido. Selecione um arquivo .xlsx ou .xls.'));
      }

      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Não foi possível ler o arquivo. Tente novamente.'));
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          const firstSheetName = workbook.SheetNames[0];
          if (!firstSheetName) {
            return reject(new Error('O arquivo XLSX não contém planilhas.'));
          }
          const sheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: true });

          if (!json || json.length === 0) {
            return reject(new Error('A planilha está vazia ou não possui dados na primeira aba.'));
          }

          // Normaliza chaves (remove espaços extras dos cabeçalhos)
          const rows = json.map(r => {
            const obj = {};
            Object.keys(r).forEach(k => { obj[normalizeHeaderKey(k)] = r[k]; });
            return obj;
          });

          // Valida colunas obrigatórias
          const headerKeys = Object.keys(rows[0]);
          const missing = APP_CONFIG.requiredColumns.filter(c => !headerKeys.includes(c));
          if (missing.length > 0) {
            return reject(new Error(
              `Colunas obrigatórias ausentes no XLSX: ${missing.join(', ')}. ` +
              `Verifique se o cabeçalho segue o padrão exigido.`
            ));
          }

          const parsed = rows.map(parseRow).filter(r => r.Equipamento !== '');
          if (parsed.length === 0) {
            return reject(new Error('Nenhuma linha válida encontrada (coluna Equipamento vazia em todas as linhas).'));
          }

          resolve(parsed);
        } catch (err) {
          console.error(err);
          reject(new Error('Erro ao processar o arquivo XLSX. Verifique se o arquivo não está corrompido.'));
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  function parseRow(r) {
    const equipamento = Utils.toStringSafe(r['Equipamento']);
    const modelo = Utils.toStringSafe(r['Modelo']);
    const atividade = Utils.toStringSafe(r['Atividade']);

    return {
      Data: r['Data'] || null,
      Frente: Utils.toStringSafe(r['Frente']) || 'Não Informado',
      Equipamento: equipamento,
      Modelo: modelo || 'Não Informado',
      Classificacao_Ativ: Utils.toStringSafe(r['Classificacao_Ativ']),
      CD_Atividade: Utils.toStringSafe(r['CD Atividade']),
      Atividade: atividade || 'Não Informado',
      Funcionario: Utils.toStringSafe(r['Funcionario']),
      Fazenda: Utils.toStringSafe(r['Fazenda']) || 'Não Informado',
      cod_quadra: Utils.toStringSafe(r['cod_quadra']),
      cod_talhao: Utils.toStringSafe(r['cod_talhao']),
      Inicio: r['Inicio'] || null,
      Fim: r['Fim'] || null,
      TempoDecimal: Utils.toNumber(r['Tempo Decimal']),
      Hori_Odom_Ini: Utils.toNumber(r['Hori_Odom_Ini']),
      Hori_Odom_Fim: Utils.toNumber(r['Hori_Odom_Fim']),
      latitude: r['latitude'] !== null ? Utils.toNumber(r['latitude']) : null,
      longitude: r['longitude'] !== null ? Utils.toNumber(r['longitude']) : null,
      TempoEfetivo: Utils.toNumber(r['Tempo Efetivo']),
      Velocidade: Utils.toNumber(r['Velocidade']),
      MotorOcioso: Utils.toNumber(r['Motor Ocioso']),
      Tipo_Equipamento: classificarTipo(equipamento, modelo)
    };
  }

  return { readFile, classificarTipo };
})();
