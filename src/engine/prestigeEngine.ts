import Decimal from 'break_infinity.js';
import type { PrestigeReward } from '@/types';
import { BALANCE } from '@/data/balancing';

/**
 * Calcula a recompensa de prestígio baseado no dinheiro total ganho na run
 */
export function calculatePrestigeReward(totalMoneyEarned: Decimal): PrestigeReward | null {
  // Valor mínimo para fazer prestige
  if (totalMoneyEarned.lt(BALANCE.PRESTIGE_MIN_EARNED)) {
    return null;
  }

  // Golden Shares = sqrt(totalEarned / base)
  const goldenSharesEarned = Math.floor(
    Math.sqrt(totalMoneyEarned.dividedBy(BALANCE.GOLDEN_SHARE_FORMULA_BASE).toNumber())
  );

  if (goldenSharesEarned <= 0) return null;

  // Cada golden share = +500% (5x)
  const bonusMultiplier = 1 + goldenSharesEarned * BALANCE.GOLDEN_SHARE_MULTIPLIER;

  return {
    goldenSharesEarned,
    bonusMultiplier,
  };
}

/**
 * Calcula o multiplicador permanente baseado no total de golden shares
 */
export function calculatePrestigeMultiplier(goldenShares: number): number {
  if (goldenShares <= 0) return 1;
  return 1 + goldenShares * BALANCE.GOLDEN_SHARE_MULTIPLIER;
}
