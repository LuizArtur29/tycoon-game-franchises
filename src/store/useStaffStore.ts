import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Executive } from '@/types';
import { BALANCE } from '@/data/balancing';
import { rollGacha, createExecutiveFromDefinition, canClaimFreeSpin } from '@/engine/gachaEngine';

interface StaffStoreState {
  executives: Executive[];
  pityCounter: number;
  freeSpinsRemaining: number;
  lastFreeSpinDate: string | null;

  // Actions
  recruit: () => { executive: Executive; isNew: boolean } | null;
  reroll: () => { executive: Executive } | null;
  assignToStore: (executiveId: string, storeId: string) => void;
  unassignFromStore: (executiveId: string) => void;
  claimFreeSpin: () => boolean;
  canSpin: () => boolean;
  removeExecutive: (executiveId: string) => void;
}

export const useStaffStore = create<StaffStoreState>()(
  persist(
    (set, get) => ({
      executives: [],
      pityCounter: 0,
      freeSpinsRemaining: BALANCE.FREE_SPINS_PER_DAY,
      lastFreeSpinDate: null,

      // ========== RECRUIT (spin) ==========
      recruit: () => {
        const state = get();
        if (!state.canSpin()) return null;

        const result = rollGacha(
          state.pityCounter,
          BALANCE.GACHA_PITY_THRESHOLD
        );

        const newExecutive = createExecutiveFromDefinition(result.executive);

        set({
          executives: [...state.executives, newExecutive],
          pityCounter: result.newPityCounter,
          freeSpinsRemaining: state.freeSpinsRemaining - 1,
        });

        return { executive: newExecutive, isNew: true };
      },

      // ========== REROLL (ads-powered) ==========
      reroll: () => {
        const state = get();
        const result = rollGacha(
          state.pityCounter,
          BALANCE.GACHA_PITY_THRESHOLD
        );

        const newExecutive = createExecutiveFromDefinition(result.executive);

        // Remove o último executivo (o que foi rerollado) e adiciona o novo
        const updatedExecutives = [...state.executives];
        if (updatedExecutives.length > 0) {
          updatedExecutives.pop();
        }
        updatedExecutives.push(newExecutive);

        set({
          executives: updatedExecutives,
          pityCounter: result.newPityCounter,
        });

        return { executive: newExecutive };
      },

      // ========== ASSIGN TO STORE ==========
      assignToStore: (executiveId: string, storeId: string) => {
        const state = get();
        const updatedExecutives = state.executives.map(e => {
          if (e.id === executiveId) {
            return { ...e, assignedStoreId: storeId };
          }
          // Desassocia qualquer outro executive da mesma loja
          if (e.assignedStoreId === storeId) {
            return { ...e, assignedStoreId: null };
          }
          return e;
        });

        set({ executives: updatedExecutives });
      },

      // ========== UNASSIGN ==========
      unassignFromStore: (executiveId: string) => {
        const state = get();
        const updatedExecutives = state.executives.map(e =>
          e.id === executiveId ? { ...e, assignedStoreId: null } : e
        );
        set({ executives: updatedExecutives });
      },

      // ========== CLAIM FREE SPIN ==========
      claimFreeSpin: () => {
        const state = get();
        if (!canClaimFreeSpin(state.lastFreeSpinDate)) return false;

        set({
          freeSpinsRemaining: BALANCE.FREE_SPINS_PER_DAY,
          lastFreeSpinDate: new Date().toDateString(),
        });
        return true;
      },

      // ========== CAN SPIN ==========
      canSpin: () => {
        const state = get();
        // Tenta claim se é um novo dia
        if (canClaimFreeSpin(state.lastFreeSpinDate)) {
          // Auto-claim
          set({
            freeSpinsRemaining: BALANCE.FREE_SPINS_PER_DAY,
            lastFreeSpinDate: new Date().toDateString(),
          });
          return true;
        }
        return state.freeSpinsRemaining > 0;
      },

      // ========== REMOVE ==========
      removeExecutive: (executiveId: string) => {
        const state = get();
        set({
          executives: state.executives.filter(e => e.id !== executiveId),
        });
      },
    }),
    {
      name: 'tycoon-franchises-staff',
      partialize: (state) => ({
        executives: state.executives,
        pityCounter: state.pityCounter,
        freeSpinsRemaining: state.freeSpinsRemaining,
        lastFreeSpinDate: state.lastFreeSpinDate,
      }),
    }
  )
);
