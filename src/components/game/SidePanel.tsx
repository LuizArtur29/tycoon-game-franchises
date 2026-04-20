import { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useStaffStore } from '@/store/useStaffStore';
import { STORE_DEFINITIONS } from '@/data/stores';
import { BALANCE } from '@/data/balancing';
import { calculateStoreCost, calculateStoreProfit, calculateStoreSellValue } from '@/engine/profitCalculator';
import { audioEngine } from '@/engine/audioEngine';
import { formatMoney } from '@/engine/utils';
import { useI18n } from '@/i18n/useI18n';
import { Modal } from '@/components/ui/Modal';
import Decimal from 'break_infinity.js';
import type { GameStore } from '@/types';
import './SidePanel.css';

function formatExecutiveBonus(
  type: 'profit' | 'cost_reduction' | 'click' | 'global',
  value: number,
  t: (key: string, params?: Record<string, string | number>, fallback?: string) => string,
): string {
  const percent = (value * 100).toFixed(0);
  if (type === 'cost_reduction') return t('side.exec.cost', { percent });
  if (type === 'profit') return t('side.exec.profit', { percent });
  if (type === 'click') return t('side.exec.click', { percent });
  return t('side.exec.global', { percent });
}

function isStoreUnlocked(
  storesCount: number,
  money: Decimal,
  currentRegion: string,
  unlockedRegions: string[],
  unlockCondition: { type: 'money' | 'stores' | 'region' | 'prestige' | 'none'; value: number; regionId?: string }
): boolean {
  if (unlockCondition.type === 'none') return true;
  if (unlockCondition.type === 'stores') return storesCount >= unlockCondition.value;
  if (unlockCondition.type === 'money') return money.gte(unlockCondition.value);
  if (unlockCondition.type === 'region') {
    if (!unlockCondition.regionId) return false;
    return unlockCondition.regionId === currentRegion || unlockedRegions.includes(unlockCondition.regionId);
  }
  return false;
}

function getStoreRequirementText(
  t: (key: string, params?: Record<string, string | number>, fallback?: string) => string,
  unlockCondition: { type: 'money' | 'stores' | 'region' | 'prestige' | 'none'; value: number; regionId?: string }
): string {
  if (unlockCondition.type === 'stores') return t('side.reqStores', { count: unlockCondition.value });
  if (unlockCondition.type === 'money') return t('side.reqMoney', { amount: formatMoney(new Decimal(unlockCondition.value)) });
  if (unlockCondition.type === 'region') return t('side.reqRegion');
  if (unlockCondition.type === 'prestige') return t('side.reqPrestige', { count: unlockCondition.value });
  return '';
}

interface BuyPanelProps {
  slotIndex: number;
  onClose: () => void;
}

function BuyStorePanel({ slotIndex, onClose }: BuyPanelProps) {
  const { t } = useI18n();
  const currentRegion = useGameStore(s => s.currentRegion);
  const unlockedRegions = useGameStore(s => s.unlockedRegions);
  const stores = useGameStore(s => s.stores);
  const buyStore = useGameStore(s => s.buyStore);
  const moneyStr = useGameStore(s => s.money);
  const money = new Decimal(moneyStr);

  const regionDefs = STORE_DEFINITIONS
    .filter(d => d.region === currentRegion)
    .sort((a, b) => a.baseCost - b.baseCost);

  const handleBuy = (defId: string) => {
    const success = buyStore(defId, slotIndex);
    if (success) {
      audioEngine.playSFX('purchase');
      window.dispatchEvent(new CustomEvent('spawn_confetti'));
      onClose();
    }
  };

  return (
    <div className="sp-buy-section">
      <div className="sp-buy-header">
        <h3>🏗️ {t('side.buildLot', { slot: slotIndex + 1 })}</h3>
        <p>{t('side.chooseFranchise')}</p>
      </div>

      {regionDefs.map(def => {
        const existingCount = stores.filter(s => s.definitionId === def.id).length;
        const cost = calculateStoreCost(def.id, existingCount, 0);
        const unlocked = isStoreUnlocked(stores.length, money, currentRegion, unlockedRegions, def.unlockCondition);
        const canAfford = unlocked && money.gte(cost);
        const requirementText = unlocked ? '' : getStoreRequirementText(t, def.unlockCondition);

        return (
          <div
            key={def.id}
            className={`sp-store-option ${!canAfford ? 'cant-afford' : ''}`}
            onClick={() => canAfford && handleBuy(def.id)}
          >
            <div className="sp-store-emoji">{def.emoji}</div>
            <div className="sp-store-info">
              <div className="sp-store-name">{t(`store.${def.id}.name`, undefined, def.name)}</div>
              <div className="sp-store-desc">
                {unlocked ? t(`store.${def.id}.description`, undefined, def.description) : requirementText}
              </div>
            </div>
            <div className={`sp-store-cost ${canAfford ? 'affordable' : ''}`}>
              {formatMoney(cost)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface ManagePanelProps {
  storeId: string;
  onClose: () => void;
}

function ManageStorePanel({ storeId, onClose }: ManagePanelProps) {
  const { t } = useI18n();
  const [isSellConfirmOpen, setIsSellConfirmOpen] = useState(false);
  const store = useGameStore(s => s.stores.find(existingStore => existingStore.id === storeId) ?? null);
  const upgradeStore = useGameStore(s => s.upgradeStore);
  const sellStore = useGameStore(s => s.sellStore);
  const moneyStr = useGameStore(s => s.money);
  const storeUpgradeCostReduction = useGameStore(s => s.storeUpgradeCostReduction);
  const money = new Decimal(moneyStr);
  const executives = useStaffStore(s => s.executives);
  const productionMultiplier = useGameStore(s => s.productionMultiplier);

  if (!store) return null;

  const definition = STORE_DEFINITIONS.find(d => d.id === store.definitionId);
  if (!definition) return null;

  const upgradeCost = calculateStoreCost(store.definitionId, store.level, storeUpgradeCostReduction);
  const canAfford = money.gte(upgradeCost);
  const currentProfit = calculateStoreProfit(store, executives, productionMultiplier);
  const sellValue = calculateStoreSellValue(store.definitionId, store.level, BALANCE.STORE_SELL_REFUND_RATE);

  const assignedExec = executives.find(e => e.assignedStoreId === store.id);

  const handleUpgrade = () => {
    const success = upgradeStore(store.id);
    if (success) {
      audioEngine.playSFX('purchase');
    }
  };

  const handleConfirmSell = () => {
    const success = sellStore(store.id);
    if (success) {
      audioEngine.playSFX('unlock');
      setIsSellConfirmOpen(false);
      onClose();
    }
  };

  return (
    <div className="sp-manage-section">
      <div className="sp-store-hero">
        <span className="sp-hero-emoji">{definition.emoji}</span>
        <h3 className="sp-hero-name">{t(`store.${definition.id}.name`, undefined, definition.name)}</h3>
        <span className="sp-hero-level-badge">{t('side.level', { level: store.level })}</span>
      </div>

      <div className="sp-stat-row">
        <span className="sp-stat-label">📈 {t('side.profitPerSec')}</span>
        <span className="sp-stat-value money">{formatMoney(currentProfit)}</span>
      </div>
      <div className="sp-stat-row">
        <span className="sp-stat-label">🏗️ {t('side.lot')}</span>
        <span className="sp-stat-value">#{store.slotIndex + 1}</span>
      </div>
      <div className="sp-stat-row">
        <span className="sp-stat-label">💸 {t('side.sellValue')}</span>
        <span className="sp-stat-value money">{formatMoney(sellValue)}</span>
      </div>

      <div className="sp-manager-section">
        <h4 className="sp-manager-title">👔 {t('side.execAssigned')}</h4>
        {assignedExec ? (
          <div className="sp-manager-info">
            <span className="sp-manager-portrait">{assignedExec.portrait}</span>
            <div>
              <div className="sp-manager-name">{assignedExec.name}</div>
              <div className="sp-manager-bonus">
                {formatExecutiveBonus(assignedExec.multiplier.type, assignedExec.multiplier.value, t)}
              </div>
            </div>
          </div>
        ) : (
          <p className="sp-no-manager">{t('side.noExec')}</p>
        )}
      </div>

      <button
        className={`sp-upgrade-btn ${canAfford ? 'can-buy' : 'cant-buy'}`}
        onClick={handleUpgrade}
        disabled={!canAfford}
      >
        ⬆️ {t('side.upgradeTo', { level: store.level + 1 })}
        <span>{formatMoney(upgradeCost)}</span>
      </button>

      <button className="sp-sell-btn" onClick={() => setIsSellConfirmOpen(true)}>
        🧾 {t('side.sell')}
        <span>+{formatMoney(sellValue)}</span>
      </button>

      <Modal
        isOpen={isSellConfirmOpen}
        onClose={() => setIsSellConfirmOpen(false)}
        title={t('side.sellConfirmTitle')}
      >
        <p className="sp-sell-confirm-text">
          {t('side.sellConfirmBody', { amount: formatMoney(sellValue) }, t('side.sellConfirm'))}
        </p>
        <div className="sp-sell-confirm-actions">
          <button
            className="sp-sell-confirm-btn cancel"
            onClick={() => setIsSellConfirmOpen(false)}
          >
            {t('side.sellConfirmCancel')}
          </button>
          <button
            className="sp-sell-confirm-btn confirm"
            onClick={handleConfirmSell}
          >
            {t('side.sellConfirmAccept')}
          </button>
        </div>
      </Modal>
    </div>
  );
}

interface SidePanelProps {
  isOpen: boolean;
  slotIndex: number;
  store: GameStore | null;
  onClose: () => void;
}

export function SidePanel({ isOpen, slotIndex, store, onClose }: SidePanelProps) {
  const { t } = useI18n();

  return (
    <div className={`side-panel-overlay ${isOpen ? 'open' : ''}`}>
      <div className="side-panel-backdrop" onClick={onClose} />
      <div className="side-panel">
        <div className="sp-header">
          <div className="sp-title">
            <span className="sp-title-emoji">
              {store ? (STORE_DEFINITIONS.find(d => d.id === store.definitionId)?.emoji || '🏢') : '🏗️'}
            </span>
            {store ? t('side.manageStore') : t('side.newBusiness')}
          </div>
          <button className="sp-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="sp-content">
          {store ? (
            <ManageStorePanel storeId={store.id} onClose={onClose} />
          ) : (
            <BuyStorePanel slotIndex={slotIndex} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}
