// ============================================
// CONSTANTES DE BALANCEAMENTO
// ============================================

export const BALANCE = {
  // Game Loop
  TICK_INTERVAL_MS: 1000,
  AUTO_SAVE_INTERVAL_MS: 30000,

  // Clique
  BASE_CLICK_POWER: 1,
  CLICK_UPGRADE_MULTIPLIER: 1.5,

  // Lojas
  STORE_COST_GROWTH: 1.15,       // Custo aumenta 15% por nível
  STORE_PROFIT_GROWTH: 1.10,     // Lucro aumenta 10% por nível

  // Prestige
  PRESTIGE_MIN_EARNED: 1e6,      // Mínimo de $ para fazer prestige
  GOLDEN_SHARE_FORMULA_BASE: 150, // goldenShares = sqrt(totalEarned / base)
  GOLDEN_SHARE_MULTIPLIER: 5.0,  // Cada golden share = +500% multiplicador

  // Offline
  OFFLINE_MAX_HOURS: 24,
  OFFLINE_EFFICIENCY: 0.5,       // 50% da produção normal

  // Gacha
  GACHA_PITY_THRESHOLD: 50,     // Garantia de Épico+ a cada 50 giros
  FREE_SPINS_PER_DAY: 1,

  // Ads boost
  AD_BOOST_DURATION_MS: 4 * 60 * 60 * 1000, // 4 horas
  AD_BOOST_MULTIPLIER: 2,

  // Eventos aleatórios
  ANGEL_INVESTOR_CHANCE: 0.02,   // 2% por tick
  ANGEL_INVESTOR_REWARD_MULTIPLIER: 60, // 60 segundos de produção

  // UI
  OPERATIONS_CENTER_THRESHOLD: 25, // Franquias para liberar dashboard ERP
} as const;

export const RARITY_COLORS: Record<string, string> = {
  intern: '#8B9467',
  manager: '#4A90D9',
  director: '#9B59B6',
  ceo: '#F39C12',
};

export const RARITY_LABELS: Record<string, string> = {
  intern: 'Estagiário',
  manager: 'Gerente',
  director: 'Diretor',
  ceo: 'CEO Visionário',
};

export const RARITY_WEIGHTS: Record<string, number> = {
  intern: 70,
  manager: 20,
  director: 8,
  ceo: 2,
};
