/* ============================================================
   CONFIG.JS - Constantes, mapeamento de colunas e regras
   de classificação/atividades da operação de vinhaça.
   ============================================================ */

const APP_CONFIG = {
  // Cabeçalho padrão esperado no XLSX
  requiredColumns: [
    'Equipamento', 'Modelo', 'Atividade', 'Tempo Decimal', 'Velocidade'
  ],
  allColumns: [
    'Data', 'Frente', 'Equipamento', 'Modelo', 'Classificacao_Ativ',
    'CD Atividade', 'Atividade', 'Funcionario', 'Fazenda', 'cod_quadra',
    'cod_talhao', 'Inicio', 'Fim', 'Tempo Decimal', 'Hori_Odom_Ini',
    'Hori_Odom_Fim', 'latitude', 'longitude', 'Tempo Efetivo',
    'Velocidade', 'Motor Ocioso'
  ],

  // Classificação de equipamentos
  offroadModelos: ['CASE PUMA 215', 'CASE PUMA 230', 'PUMA IH 230'],
  caminhaoModelos: ['MB AXOR 3344', 'MB AROCS 3351S EURO6'],
  offroadExcecaoEquipamento: '13085',
  offroadExcecaoModelo: 'MB AXOR 3344',

  // Atividades - Caminhões
  atividadesCaminhao: {
    carregamento: 'Carregamento',
    agCarregamento: 'Ag.Carregamento',
    transporte: 'Transporte Vinhaça',
    agDescarregamento: 'Ag.Descarregamento',
    descarregamento: 'Descarregamento',
    deslocamentoVolta: 'Deslocamento Unid. Carregamento'
  },

  // Atividades - Offroads
  atividadesOffroad: {
    abastecimento: 'Abastecimento - Insumos',
    agCarregamento: 'Aguardando carregamento',
    faltaInsumos: 'Falta de insumos',
    agLiberacao: 'Aguardando liberação de serviço',
    deslocamento: 'Deslocamento'
  },

  // Paleta de cores corporativa (tema agroindustrial)
  colors: {
    primary: '#1f6f43',
    primaryDark: '#154a2d',
    secondary: '#8a5a2b',
    accent: '#d9a441',
    danger: '#b3392c',
    info: '#2f6f8f',
    slate: '#334155',
    light: '#f4f6f5',
    chartPalette: [
      '#1f6f43', '#2f6f8f', '#d9a441', '#8a5a2b', '#b3392c',
      '#5b8c5a', '#3d5a80', '#e0a458', '#6d4c41', '#8e9aaf'
    ]
  }
};

// Congela para evitar mutações acidentais em runtime
Object.freeze(APP_CONFIG.requiredColumns);
Object.freeze(APP_CONFIG.allColumns);
Object.freeze(APP_CONFIG.offroadModelos);
Object.freeze(APP_CONFIG.caminhaoModelos);
Object.freeze(APP_CONFIG.atividadesCaminhao);
Object.freeze(APP_CONFIG.atividadesOffroad);
