import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Decimal from 'break_infinity.js';
import type { GameStore, Upgrade } from '@/types';
import { STORE_DEFINITIONS } from '@/data/stores';
import { UPGRADES } from '@/data/upgrades';
import { REGIONS } from '@/data/regions';
import { BALANCE } from '@/data/balancing';
import {
  calculateTotalProfitPerSecond,
  calculateStoreCost,
} from '@/engine/profitCalculator';
import { generateId } from '@/engine/utils';
import { useStaffStore } from '@/store/useStaffStore';
import { usePrestigeStore } from '@/store/usePrestigeStore';
import { useAdsStore } from '@/store/useAdsStore';
import { useMarketStore } from '@/store/useMarketStore';

// ============================================
// Serialization helpers for Decimal
// ============================================
function serializeDecimal(d: Decimal): string {
  return d.toString();
}
function deserializeDecimal(s: string): Decimal {
  return new Decimal(s);
}

// ============================================
// GAME STORE INTERFACE
// ============================================
interface GameStoreState {
  // Player
  money: string; // serialized Decimal
  totalMoneyEarned: string;
  clickPower: string;
  globalMultiplier: number;
  productionMultiplier: number;
  totalClicks: number;

  // Stores
  stores: GameStore[];
  currentRegion: string;
  unlockedRegions: string[];

  // Upgrades
  upgrades: Upgrade[];

  // Timestamps
  lastTickTimestamp: number;
  totalPlayTime: number;
  gameVersion: string;

  // Computed (not persisted, recalculated)
  _moneyPerSecond: string;

  // Actions
  tick: (deltaMs: number) => void;
  click: () => void;
  buyStore: (definitionId: string) => boolean;
  upgradeStore: (storeId: string) => boolean;
  buyUpgrade: (upgradeId: string) => boolean;
  unlockRegion: (regionId: string) => boolean;
  changeRegion: (regionId: string) => void;
  addMoney: (amount: Decimal) => void;
  resetForPrestige: () => void;
  recalculateMoneyPerSecond: () => void;

  // Getters
  getMoney: () => Decimal;
  getTotalMoneyEarned: () => Decimal;
  getClickPower: () => Decimal;
  getMoneyPerSecond: () => Decimal;
}

export const useGameStore = create<GameStoreState>()(
  persist(
    (set, get) => ({
      // Initial State
      money: '0',
      totalMoneyEarned: '0',
      clickPower: String(BALANCE.BASE_CLICK_POWER),
      globalMultiplier: 1,
      productionMultiplier: 1,
      totalClicks: 0,

      stores: [],
      currentRegion: 'esperanca',
      unlockedRegions: ['esperanca'],

      upgrades: JSON.parse(JSON.stringify(UPGRADES)),

      lastTickTimestamp: Date.now(),
      totalPlayTime: 0,
      gameVersion: '0.1.0',

      _moneyPerSecond: '0',

      // ========== GETTERS ==========
      getMoney: () => deserializeDecimal(get().money),
      getTotalMoneyEarned: () => deserializeDecimal(get().totalMoneyEarned),
      getClickPower: () => deserializeDecimal(get().clickPower),
      getMoneyPerSecond: () => deserializeDecimal(get()._moneyPerSecond),

      // ========== TICK (main game loop) ==========
      tick: (deltaMs: number) => {
        const state = get();
        const staffState = useStaffStore.getState();
        const prestigeState = usePrestigeStore.getState();
        const adsState = useAdsStore.getState();

        const adMultiplier = adsState.getActiveBoostMultiplier();
        const marketState = useMarketStore.getState();
        const marketMultiplier = marketState.activeEvent ? marketState.activeEvent.multiplier : 1;

        const profitPerSecond = calculateTotalProfitPerSecond(
          state.stores,
          staffState.executives,
          state.globalMultiplier,
          prestigeState.permanentMultiplier,
          adMultiplier,
          state.productionMultiplier,
          marketMultiplier
        );

        const deltaSeconds = deltaMs / 1000;
        const earned = profitPerSecond.times(deltaSeconds);

        const currentMoney = deserializeDecimal(state.money);
        const currentTotal = deserializeDecimal(state.totalMoneyEarned);

        set({
          money: serializeDecimal(currentMoney.plus(earned)),
          totalMoneyEarned: serializeDecimal(currentTotal.plus(earned)),
          _moneyPerSecond: serializeDecimal(profitPerSecond),
          lastTickTimestamp: Date.now(),
          totalPlayTime: state.totalPlayTime + deltaSeconds,
        });
      },

      // ========== CLICK ==========
      click: () => {
        const state = get();
        const clickPower = deserializeDecimal(state.clickPower);
        const prestigeState = usePrestigeStore.getState();
        const adsState = useAdsStore.getState();

        const totalClick = clickPower
          .times(state.globalMultiplier)
          .times(prestigeState.permanentMultiplier)
          .times(adsState.getActiveBoostMultiplier());

        const currentMoney = deserializeDecimal(state.money);
        const currentTotal = deserializeDecimal(state.totalMoneyEarned);

        set({
          money: serializeDecimal(currentMoney.plus(totalClick)),
          totalMoneyEarned: serializeDecimal(currentTotal.plus(totalClick)),
          totalClicks: state.totalClicks + 1,
        });
      },

      // ========== BUY STORE ==========
      buyStore: (definitionId: string) => {
        const state = get();
        const definition = STORE_DEFINITIONS.find(d => d.id === definitionId);
        if (!definition) return false;

        // Conta quantas lojas já tem deste tipo
        const existingCount = state.stores.filter(
          s => s.definitionId === definitionId
        ).length;

        const cost = calculateStoreCost(definitionId, existingCount, 0);
        const currentMoney = deserializeDecimal(state.money);

        if (currentMoney.lt(cost)) return false;

        // Encontra o menor slotIndex disponível na região
        const regionStores = state.stores.filter(s => s.region === definition.region);
        const usedSlots = new Set(regionStores.map(s => s.slotIndex));
        let slotIndex = 0;
        while (usedSlots.has(slotIndex)) slotIndex++;

        const newStore: GameStore = {
          id: generateId(),
          definitionId,
          level: 1,
          managerId: null,
          region: definition.region,
          upgrades: [],
          purchasedAt: Date.now(),
          slotIndex,
        };

        set({
          money: serializeDecimal(currentMoney.minus(cost)),
          stores: [...state.stores, newStore],
        });

        // Recalcula $/s
        get().recalculateMoneyPerSecond();
        return true;
      },

      // ========== UPGRADE STORE ==========
      upgradeStore: (storeId: string) => {
        const state = get();
        const storeIndex = state.stores.findIndex(s => s.id === storeId);
        if (storeIndex === -1) return false;

        const store = state.stores[storeIndex];
        const cost = calculateStoreCost(store.definitionId, store.level, 0);
        const currentMoney = deserializeDecimal(state.money);

        if (currentMoney.lt(cost)) return false;

        const updatedStores = [...state.stores];
        updatedStores[storeIndex] = { ...store, level: store.level + 1 };

        set({
          money: serializeDecimal(currentMoney.minus(cost)),
          stores: updatedStores,
        });

        get().recalculateMoneyPerSecond();
        return true;
      },

      // ========== BUY UPGRADE ==========
      buyUpgrade: (upgradeId: string) => {
        const state = get();
        const upgradeIndex = state.upgrades.findIndex(u => u.id === upgradeId);
        if (upgradeIndex === -1) return false;

        const upgrade = state.upgrades[upgradeIndex];
        if (upgrade.purchased && !upgrade.repeatable) return false;

        const currentMoney = deserializeDecimal(state.money);
        const cost = new Decimal(upgrade.cost);

        if (currentMoney.lt(cost)) return false;

        const updatedUpgrades = [...state.upgrades];
        updatedUpgrades[upgradeIndex] = {
          ...upgrade,
          purchased: true,
          currentLevel: upgrade.currentLevel + 1,
        };

        // Aplica efeito
        let newState: Partial<GameStoreState> = {
          money: serializeDecimal(currentMoney.minus(cost)),
          upgrades: updatedUpgrades,
        };

        const effect = upgrade.effect;
        if (effect.target === 'clickPower') {
          const currentClick = deserializeDecimal(state.clickPower);
          newState.clickPower = serializeDecimal(
            effect.type === 'multiply'
              ? currentClick.times(effect.value)
              : currentClick.plus(effect.value)
          );
        } else if (effect.target === 'globalMultiplier') {
          newState.globalMultiplier =
            effect.type === 'multiply'
              ? state.globalMultiplier * effect.value
              : state.globalMultiplier + effect.value;
        } else if (effect.target === 'storeProfit') {
          newState.productionMultiplier =
            effect.type === 'multiply'
              ? state.productionMultiplier * effect.value
              : state.productionMultiplier + effect.value;
        }

        set(newState);
        get().recalculateMoneyPerSecond();
        return true;
      },

      // ========== UNLOCK REGION ==========
      unlockRegion: (regionId: string) => {
        const state = get();
        if (state.unlockedRegions.includes(regionId)) return false;

        const region = REGIONS.find((r) => r.id === regionId);
        if (!region) return false;

        const currentMoney = deserializeDecimal(state.money);
        const cost = new Decimal(region.unlockCost);

        if (currentMoney.lt(cost)) return false;

        set({
          money: serializeDecimal(currentMoney.minus(cost)),
          unlockedRegions: [...state.unlockedRegions, regionId],
          currentRegion: regionId,
        });

        return true;
      },

      // ========== CHANGE REGION ==========
      changeRegion: (regionId: string) => {
        const state = get();
        if (state.unlockedRegions.includes(regionId)) {
          set({ currentRegion: regionId });
        }
      },

      // ========== ADD MONEY ==========
      addMoney: (amount: Decimal) => {
        const state = get();
        const currentMoney = deserializeDecimal(state.money);
        const currentTotal = deserializeDecimal(state.totalMoneyEarned);
        set({
          money: serializeDecimal(currentMoney.plus(amount)),
          totalMoneyEarned: serializeDecimal(currentTotal.plus(amount)),
        });
      },

      // ========== PRESTIGE RESET ==========
      resetForPrestige: () => {
        set({
          money: '0',
          totalMoneyEarned: '0',
          clickPower: String(BALANCE.BASE_CLICK_POWER),
          globalMultiplier: 1,
          productionMultiplier: 1,
          totalClicks: 0,
          stores: [],
          currentRegion: 'esperanca',
          unlockedRegions: ['esperanca'],
          upgrades: JSON.parse(JSON.stringify(UPGRADES)),
          _moneyPerSecond: '0',
          lastTickTimestamp: Date.now(),
        });
      },

      // ========== RECALCULATE $/s ==========
      recalculateMoneyPerSecond: () => {
        const state = get();
        const staffState = useStaffStore.getState();
        const prestigeState = usePrestigeStore.getState();
        const adsState = useAdsStore.getState();
        const marketState = useMarketStore.getState();
        const marketMultiplier = marketState.activeEvent ? marketState.activeEvent.multiplier : 1;

        const profitPerSecond = calculateTotalProfitPerSecond(
          state.stores,
          staffState.executives,
          state.globalMultiplier,
          prestigeState.permanentMultiplier,
          adsState.getActiveBoostMultiplier(),
          state.productionMultiplier,
          marketMultiplier
        );

        set({ _moneyPerSecond: serializeDecimal(profitPerSecond) });
      },
    }),
    {
      name: 'tycoon-franchises-game',
      partialize: (state) => ({
        money: state.money,
        totalMoneyEarned: state.totalMoneyEarned,
        clickPower: state.clickPower,
        globalMultiplier: state.globalMultiplier,
        productionMultiplier: state.productionMultiplier,
        totalClicks: state.totalClicks,
        stores: state.stores,
        currentRegion: state.currentRegion,
        unlockedRegions: state.unlockedRegions,
        upgrades: state.upgrades,
        lastTickTimestamp: state.lastTickTimestamp,
        totalPlayTime: state.totalPlayTime,
        gameVersion: state.gameVersion,
      }),
    }
  )
);
