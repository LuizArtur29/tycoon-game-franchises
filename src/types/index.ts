import type Decimal from 'break_infinity.js';

// ============================================
// GAME STATE - Estado principal do jogo
// ============================================

export interface GameState {
  player: PlayerStats;
  stores: GameStore[];
  currentRegion: string;
  unlockedRegions: string[];
  lastTickTimestamp: number;
  totalPlayTime: number;
  gameVersion: string;
}

export interface PlayerStats {
  money: Decimal;
  totalMoneyEarned: Decimal;
  moneyPerSecond: Decimal;
  clickPower: Decimal;
  globalMultiplier: number;
  prestigeMultiplier: number;
  adBoostMultiplier: number;
  adBoostExpiresAt: number | null;
  totalClicks: number;
}

// ============================================
// GAME STORE - Loja do jogador (instância)
// ============================================

export interface GameStore {
  id: string;
  definitionId: string;
  level: number;
  managerId: string | null;
  region: string;
  upgrades: string[];
  purchasedAt: number;
  slotIndex: number;
}

// ============================================
// STORE BUILDING COLORS - Cores dos prédios
// ============================================

export interface BuildingColors {
  primary: string;
  secondary: string;
  roof: string;
}

// ============================================
// STORE DEFINITION - Template de loja
// ============================================

export interface StoreDefinition {
  id: string;
  name: string;
  description: string;
  emoji: string;
  baseCost: number;
  baseProfit: number;
  costMultiplier: number;
  profitMultiplier: number;
  region: string;
  unlockCondition: UnlockCondition;
}

export interface UnlockCondition {
  type: 'money' | 'stores' | 'region' | 'prestige' | 'none';
  value: number;
  regionId?: string;
}

// ============================================
// UPGRADE
// ============================================

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: UpgradeCategory;
  effect: UpgradeEffect;
  emoji: string;
  unlockCondition: UnlockCondition;
  purchased: boolean;
  repeatable: boolean;
  maxLevel?: number;
  currentLevel: number;
}

export type UpgradeCategory = 'click' | 'production' | 'cost_reduction' | 'global' | 'regional';

export interface UpgradeEffect {
  type: 'multiply' | 'add' | 'reduce';
  target: 'clickPower' | 'storeProfit' | 'upgradeCost' | 'globalMultiplier';
  value: number;
  storeDefinitionId?: string;
  regionId?: string;
}

// ============================================
// STAFF / EXECUTIVES
// ============================================

export type Rarity = 'intern' | 'manager' | 'director' | 'ceo';

export interface Executive {
  id: string;
  definitionId: string;
  name: string;
  rarity: Rarity;
  portrait: string;
  multiplier: ExecutiveMultiplier;
  assignedStoreId: string | null;
  recruitedAt: number;
}

export interface ExecutiveDefinition {
  id: string;
  name: string;
  rarity: Rarity;
  portrait: string;
  multiplier: ExecutiveMultiplier;
  flavor: string;
}

export interface ExecutiveMultiplier {
  type: 'profit' | 'cost_reduction' | 'click' | 'global';
  value: number;
  regionId?: string;
  storeDefinitionId?: string;
}

export interface GachaConfig {
  rarityWeights: Record<Rarity, number>;
  freeSpinsPerDay: number;
  pityCounter: number;
  pityThreshold: number;
}

// ============================================
// PRESTIGE
// ============================================

export interface PrestigeState {
  goldenShares: number;
  totalPrestigeCount: number;
  permanentMultiplier: number;
  lastPrestigeAt: number | null;
  lifetimeGoldenShares: number;
}

export interface PrestigeReward {
  goldenSharesEarned: number;
  bonusMultiplier: number;
}

// ============================================
// REGION
// ============================================

export interface Region {
  id: string;
  name: string;
  state: string;
  tier: ExpansionTier;
  unlockCost: number;
  description: string;
  storeSlots: number;
  coordinates: { x: number; y: number };
}

export type ExpansionTier = 'local' | 'municipal' | 'state' | 'national';

// ============================================
// ADS (hooks para monetização futura)
// ============================================

export type AdEventType =
  | 'double_earnings'
  | 'offline_double'
  | 'angel_investor'
  | 'premium_recruit'
  | 'reroll_candidate';

export interface AdRewardConfig {
  type: AdEventType;
  durationMs?: number;
  rewardMultiplier?: number;
  callbackOnComplete: () => void;
  callbackOnSkip?: () => void;
}

export interface AdService {
  showRewardedAd: (config: AdRewardConfig) => Promise<boolean>;
  isAdReady: () => boolean;
  preloadAd: () => void;
}

// ============================================
// OFFLINE EARNINGS
// ============================================

export interface OfflineEarnings {
  secondsAway: number;
  normalEarnings: Decimal;
  doubleEarnings: Decimal;
  cappedAtMax: boolean;
}
// ============================================
// MARKET EVENTS & STOCKS
// ============================================

export interface MarketEvent {
  id: string;
  title: string;
  description: string;
  multiplier: number;
  targetCategory?: UpgradeCategory | 'all';
  durationMs: number;
  startedAt: number | null;
  type: 'boom' | 'recession' | 'sector_boost' | 'neutral';
}

export interface Stock {
  id: string;
  symbol: string;
  companyName: string;
  currentPrice: number;
  history: number[]; // Last prices for trend
  volatility: number;
}

export interface OwnedStock {
  stockId: string;
  shares: number;
  avgBuyPrice: number;
}
