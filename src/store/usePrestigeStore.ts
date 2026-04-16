import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Decimal from 'break_infinity.js';
import type { PrestigeReward } from '@/types';
import { calculatePrestigeReward, calculatePrestigeMultiplier } from '@/engine/prestigeEngine';

interface PrestigeStoreState {
  goldenShares: number;
  totalPrestigeCount: number;
  permanentMultiplier: number;
  lastPrestigeAt: number | null;
  lifetimeGoldenShares: number;

  // Actions
  canPrestige: (totalMoneyEarned: Decimal) => boolean;
  getPrestigeReward: (totalMoneyEarned: Decimal) => PrestigeReward | null;
  executePrestige: (totalMoneyEarned: Decimal) => PrestigeReward | null;
}

export const usePrestigeStore = create<PrestigeStoreState>()(
  persist(
    (set, get) => ({
      goldenShares: 0,
      totalPrestigeCount: 0,
      permanentMultiplier: 1,
      lastPrestigeAt: null,
      lifetimeGoldenShares: 0,

      canPrestige: (totalMoneyEarned: Decimal) => {
        return calculatePrestigeReward(totalMoneyEarned) !== null;
      },

      getPrestigeReward: (totalMoneyEarned: Decimal) => {
        return calculatePrestigeReward(totalMoneyEarned);
      },

      executePrestige: (totalMoneyEarned: Decimal) => {
        const reward = calculatePrestigeReward(totalMoneyEarned);
        if (!reward) return null;

        const state = get();
        const newGoldenShares = state.goldenShares + reward.goldenSharesEarned;

        set({
          goldenShares: newGoldenShares,
          totalPrestigeCount: state.totalPrestigeCount + 1,
          permanentMultiplier: calculatePrestigeMultiplier(newGoldenShares),
          lastPrestigeAt: Date.now(),
          lifetimeGoldenShares: state.lifetimeGoldenShares + reward.goldenSharesEarned,
        });

        return reward;
      },
    }),
    {
      name: 'tycoon-franchises-prestige',
    }
  )
);
