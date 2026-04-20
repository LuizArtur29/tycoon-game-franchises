import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BALANCE } from '@/data/balancing';
import { crazyGamesService } from '@/services/crazyGamesService';

interface ActiveBoost {
  type: string;
  multiplier: number;
  expiresAt: number;
}

interface AdsStoreState {
  activeBoosts: ActiveBoost[];

  // Actions
  activateDoubleEarnings: () => void;
  getActiveBoostMultiplier: () => number;
  cleanExpiredBoosts: () => void;

  // In-game modal fallback for environments without SDK
  isAdPlaying: boolean;
  adPromiseResolver: ((success: boolean) => void) | null;
  showRewardedAd: (type: string) => Promise<boolean>;
  resolveAd: (success: boolean) => void;
}

export const useAdsStore = create<AdsStoreState>()(
  persist(
    (set, get) => ({
      activeBoosts: [],
      isAdPlaying: false,
      adPromiseResolver: null,

      // ========== DOUBLE EARNINGS BOOST ==========
      activateDoubleEarnings: () => {
        const state = get();
        const boost: ActiveBoost = {
          type: 'double_earnings',
          multiplier: BALANCE.AD_BOOST_MULTIPLIER,
          expiresAt: Date.now() + BALANCE.AD_BOOST_DURATION_MS,
        };

        // Remove qualquer boost do mesmo tipo e adiciona novo
        const filtered = state.activeBoosts.filter(
          b => b.type !== 'double_earnings'
        );

        set({ activeBoosts: [...filtered, boost] });
      },

      // ========== GET CURRENT MULTIPLIER ==========
      getActiveBoostMultiplier: () => {
        const state = get();
        const now = Date.now();
        let multiplier = 1;

        for (const boost of state.activeBoosts) {
          if (boost.expiresAt > now) {
            multiplier *= boost.multiplier;
          }
        }

        return multiplier;
      },

      // ========== CLEAN EXPIRED ==========
      cleanExpiredBoosts: () => {
        const state = get();
        const now = Date.now();
        const active = state.activeBoosts.filter(b => b.expiresAt > now);
        if (active.length !== state.activeBoosts.length) {
          set({ activeBoosts: active });
        }
      },

      // ========== REWARDED AD FLOW ==========
      showRewardedAd: async (_type: string) => {
        // Bloqueia se já tiver tocando um AD
        if (get().isAdPlaying) return false;

        const sdkResult = await crazyGamesService.requestRewardedAd();
        if (sdkResult !== null) return sdkResult;

        console.log(`[AdService] showRewardedAd('${_type}') - Solicitando abertura do Modal falso`);
        
        // Retorna uma Promise que vai ficar "presa" até o AdModal chamar resolveAd()
        return new Promise<boolean>((resolve) => {
          set({
            isAdPlaying: true,
            adPromiseResolver: resolve,
          });
        });
      },

      resolveAd: (success: boolean) => {
        const resolver = get().adPromiseResolver;
        if (resolver) {
          resolver(success);
        }
        set({ isAdPlaying: false, adPromiseResolver: null });
      },
    }),
    {
      name: 'tycoon-franchises-ads',
      partialize: (state) => ({
        activeBoosts: state.activeBoosts,
      }),
    }
  )
);
