import Decimal from 'break_infinity.js';
import type { GameStore, Executive } from '@/types';
import { STORE_DEFINITIONS } from '@/data/stores';

/**
 * Calcula o lucro por segundo de uma única loja
 */
export function calculateStoreProfit(
  store: GameStore,
  executives: Executive[],
  productionMultiplier: number
): Decimal {
  const definition = STORE_DEFINITIONS.find(d => d.id === store.definitionId);
  if (!definition) return new Decimal(0);

  // Lucro base * (profitMultiplier ^ level)
  let profit = new Decimal(definition.baseProfit).times(
    Math.pow(definition.profitMultiplier, store.level - 1)
  );

  // Multiplicador de executivos designados
  const assignedExec = executives.find(
    e => e.assignedStoreId === store.id
  );
  if (assignedExec) {
    if (assignedExec.multiplier.type === 'profit') {
      profit = profit.times(1 + assignedExec.multiplier.value);
    }
  }

  // Multiplicadores de executivos globais (type: 'global')
  const globalExecs = executives.filter(
    e => e.multiplier.type === 'global' && e.assignedStoreId !== null
  );
  for (const exec of globalExecs) {
    profit = profit.times(1 + exec.multiplier.value);
  }

  // Multiplicadores regionais
  const regionalExecs = executives.filter(
    e =>
      e.multiplier.regionId === store.region &&
      e.multiplier.type === 'profit' &&
      e.assignedStoreId !== store.id
  );
  for (const exec of regionalExecs) {
    profit = profit.times(1 + exec.multiplier.value);
  }

  // Multiplicador de produção global (upgrades, etc.)
  profit = profit.times(productionMultiplier);

  return profit;
}

/**
 * Calcula o lucro total por segundo de todas as lojas
 */
export function calculateTotalProfitPerSecond(
  stores: GameStore[],
  executives: Executive[],
  globalMultiplier: number,
  prestigeMultiplier: number,
  adBoostMultiplier: number,
  productionMultiplier: number,
  marketEventMultiplier: number = 1
): Decimal {
  let total = new Decimal(0);

  for (const store of stores) {
    total = total.plus(calculateStoreProfit(store, executives, productionMultiplier));
  }

  // Multiplicadores globais
  total = total.times(globalMultiplier);
  total = total.times(prestigeMultiplier);
  total = total.times(adBoostMultiplier);
  total = total.times(marketEventMultiplier);

  return total;
}

/**
 * Calcula o custo para comprar/upgrade de uma loja
 */
export function calculateStoreCost(
  definitionId: string,
  currentLevel: number,
  costReduction: number
): Decimal {
  const definition = STORE_DEFINITIONS.find(d => d.id === definitionId);
  if (!definition) return new Decimal(Infinity);

  const cost = new Decimal(definition.baseCost).times(
    Math.pow(definition.costMultiplier, currentLevel)
  );

  return cost.times(1 - costReduction);
}

/**
 * Calcula o valor de venda de uma loja baseado no investimento teorico
 * (compra inicial + upgrades por nivel) e uma taxa de retorno.
 */
export function calculateStoreSellValue(
  definitionId: string,
  level: number,
  refundRate: number
): Decimal {
  const definition = STORE_DEFINITIONS.find(d => d.id === definitionId);
  if (!definition) return new Decimal(0);

  const safeLevel = Math.max(1, Math.floor(level));
  const safeRefund = Math.max(0, Math.min(1, refundRate));
  const growth = definition.costMultiplier;

  let invested = new Decimal(0);
  for (let i = 0; i < safeLevel; i++) {
    invested = invested.plus(new Decimal(definition.baseCost).times(Math.pow(growth, i)));
  }

  return invested.times(safeRefund);
}

/**
 * Calcula o multiplicador de produção baseado nos upgrades comprados
 */
export function calculateProductionMultiplier(purchasedUpgradeEffectValues: number[]): number {
  let multiplier = 1;
  for (const value of purchasedUpgradeEffectValues) {
    multiplier *= value;
  }
  return multiplier;
}
