// ============================================
// NPC BUILDINGS — Prédios decorativos do cenário
// Não interagem com a gameplay, apenas povoam o mapa
// ============================================

export interface NpcBuilding {
  id: string;
  name: string;
  emoji: string;
  colors: { primary: string; secondary: string; roof: string };
  heightRange: [number, number]; // [min, max] height em pixels
}

export const NPC_BUILDINGS: NpcBuilding[] = [
  {
    id: 'casa-1',
    name: 'Casa Residencial',
    emoji: '🏠',
    colors: { primary: '#8D6E63', secondary: '#5D4037', roof: '#A1887F' },
    heightRange: [20, 32],
  },
  {
    id: 'casa-2',
    name: 'Sobrado',
    emoji: '🏡',
    colors: { primary: '#66BB6A', secondary: '#388E3C', roof: '#A5D6A7' },
    heightRange: [28, 38],
  },
  {
    id: 'lojinha',
    name: 'Lojinha de Bairro',
    emoji: '🏪',
    colors: { primary: '#FF7043', secondary: '#BF360C', roof: '#FFAB91' },
    heightRange: [25, 38],
  },
  {
    id: 'igreja',
    name: 'Igreja',
    emoji: '⛪',
    colors: { primary: '#ECEFF1', secondary: '#B0BEC5', roof: '#CFD8DC' },
    heightRange: [38, 55],
  },
  {
    id: 'escola',
    name: 'Escola',
    emoji: '🏫',
    colors: { primary: '#42A5F5', secondary: '#1565C0', roof: '#90CAF9' },
    heightRange: [30, 45],
  },
  {
    id: 'banco',
    name: 'Banco',
    emoji: '🏦',
    colors: { primary: '#78909C', secondary: '#37474F', roof: '#B0BEC5' },
    heightRange: [35, 50],
  },
  {
    id: 'hospital',
    name: 'Hospital',
    emoji: '🏥',
    colors: { primary: '#EF5350', secondary: '#B71C1C', roof: '#EF9A9A' },
    heightRange: [40, 58],
  },
  {
    id: 'parque',
    name: 'Praça',
    emoji: '🌳',
    colors: { primary: '#66BB6A', secondary: '#2E7D32', roof: '#81C784' },
    heightRange: [12, 20],
  },
  {
    id: 'predio',
    name: 'Prédio Comercial',
    emoji: '🏢',
    colors: { primary: '#5C6BC0', secondary: '#283593', roof: '#9FA8DA' },
    heightRange: [48, 72],
  },
  {
    id: 'apartamento',
    name: 'Apartamento',
    emoji: '🏬',
    colors: { primary: '#AB47BC', secondary: '#6A1B9A', roof: '#CE93D8' },
    heightRange: [42, 65],
  },
  {
    id: 'delegacia',
    name: 'Delegacia',
    emoji: '🏛️',
    colors: { primary: '#455A64', secondary: '#263238', roof: '#78909C' },
    heightRange: [30, 42],
  },
  {
    id: 'mercadinho',
    name: 'Mercadinho',
    emoji: '🛒',
    colors: { primary: '#FFA726', secondary: '#E65100', roof: '#FFB74D' },
    heightRange: [22, 35],
  },
  {
    id: 'oficina',
    name: 'Oficina Mecânica',
    emoji: '🔧',
    colors: { primary: '#607D8B', secondary: '#37474F', roof: '#90A4AE' },
    heightRange: [20, 30],
  },
  {
    id: 'cafeteria',
    name: 'Cafeteria',
    emoji: '☕',
    colors: { primary: '#795548', secondary: '#4E342E', roof: '#A1887F' },
    heightRange: [22, 32],
  },
];
