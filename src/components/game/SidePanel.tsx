import { useGameStore } from '@/store/useGameStore';
import { useStaffStore } from '@/store/useStaffStore';
import { STORE_DEFINITIONS } from '@/data/stores';
import { calculateStoreCost, calculateStoreProfit } from '@/engine/profitCalculator';
import { audioEngine } from '@/engine/audioEngine';
import Decimal from 'break_infinity.js';
import type { GameStore } from '@/types';
import './SidePanel.css';

// ============================================
// CURRENCY FORMATTER (inline para o painel)
// ============================================
function formatMoney(value: Decimal): string {
  if (value.lt(1000)) return `R$ ${value.toFixed(0)}`;
  if (value.lt(1e6)) return `R$ ${(value.toNumber() / 1000).toFixed(1)}K`;
  if (value.lt(1e9)) return `R$ ${(value.toNumber() / 1e6).toFixed(2)}M`;
  if (value.lt(1e12)) return `R$ ${(value.toNumber() / 1e9).toFixed(2)}B`;
  return `R$ ${value.toExponential(2)}`;
}

// ============================================
// BUY PANEL - Mostrado quando lote está vazio
// ============================================
interface BuyPanelProps {
  slotIndex: number;
  onClose: () => void;
}

function BuyStorePanel({ slotIndex, onClose }: BuyPanelProps) {
  const currentRegion = useGameStore(s => s.currentRegion);
  const stores = useGameStore(s => s.stores);
  const buyStore = useGameStore(s => s.buyStore);
  const moneyStr = useGameStore(s => s.money);
  const money = new Decimal(moneyStr);

  const regionDefs = STORE_DEFINITIONS.filter(d => d.region === currentRegion);

  const handleBuy = (defId: string) => {
    const success = buyStore(defId);
    if (success) {
      audioEngine.playSFX('purchase');
      // Dispara confete
      window.dispatchEvent(new CustomEvent('spawn_confetti'));
      onClose();
    }
  };

  return (
    <div className="sp-buy-section">
      <div className="sp-buy-header">
        <h3>🏗️ Construir no Lote #{slotIndex + 1}</h3>
        <p>Escolha qual franquia construir aqui</p>
      </div>

      {regionDefs.map(def => {
        const existingCount = stores.filter(s => s.definitionId === def.id).length;
        const cost = calculateStoreCost(def.id, existingCount, 0);
        const canAfford = money.gte(cost);

        return (
          <div
            key={def.id}
            className={`sp-store-option ${!canAfford ? 'cant-afford' : ''}`}
            onClick={() => canAfford && handleBuy(def.id)}
          >
            <div className="sp-store-emoji">{def.emoji}</div>
            <div className="sp-store-info">
              <div className="sp-store-name">{def.name}</div>
              <div className="sp-store-desc">{def.description}</div>
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

// ============================================
// MANAGE PANEL - Mostrado quando clica num prédio
// ============================================
interface ManagePanelProps {
  store: GameStore;
  onClose: () => void;
}

function ManageStorePanel({ store, onClose }: ManagePanelProps) {
  const upgradeStore = useGameStore(s => s.upgradeStore);
  const moneyStr = useGameStore(s => s.money);
  const money = new Decimal(moneyStr);
  const executives = useStaffStore(s => s.executives);
  const productionMultiplier = useGameStore(s => s.productionMultiplier);

  const definition = STORE_DEFINITIONS.find(d => d.id === store.definitionId);
  if (!definition) return null;

  const upgradeCost = calculateStoreCost(store.definitionId, store.level, 0);
  const canAfford = money.gte(upgradeCost);
  const currentProfit = calculateStoreProfit(store, executives, productionMultiplier);

  const assignedExec = executives.find(e => e.assignedStoreId === store.id);

  const handleUpgrade = () => {
    const success = upgradeStore(store.id);
    if (success) {
      audioEngine.playSFX('purchase');
    }
  };

  return (
    <div className="sp-manage-section">
      {/* Hero */}
      <div className="sp-store-hero">
        <span className="sp-hero-emoji">{definition.emoji}</span>
        <h3 className="sp-hero-name">{definition.name}</h3>
        <span className="sp-hero-level-badge">Nível {store.level}</span>
      </div>

      {/* Stats */}
      <div className="sp-stat-row">
        <span className="sp-stat-label">📈 Lucro/s</span>
        <span className="sp-stat-value money">{formatMoney(currentProfit)}</span>
      </div>
      <div className="sp-stat-row">
        <span className="sp-stat-label">🏗️ Lote</span>
        <span className="sp-stat-value">#{store.slotIndex + 1}</span>
      </div>

      {/* Manager */}
      <div className="sp-manager-section">
        <h4 className="sp-manager-title">👔 Executivo Designado</h4>
        {assignedExec ? (
          <div className="sp-manager-info">
            <span className="sp-manager-portrait">{assignedExec.portrait}</span>
            <div>
              <div className="sp-manager-name">{assignedExec.name}</div>
              <div className="sp-manager-bonus">
                +{(assignedExec.multiplier.value * 100).toFixed(0)}% {assignedExec.multiplier.type}
              </div>
            </div>
          </div>
        ) : (
          <p className="sp-no-manager">Nenhum executivo designado. Vá ao RH!</p>
        )}
      </div>

      {/* Upgrade Button */}
      <button
        className={`sp-upgrade-btn ${canAfford ? 'can-buy' : 'cant-buy'}`}
        onClick={handleUpgrade}
        disabled={!canAfford}
      >
        ⬆️ Upgrade → Nível {store.level + 1}
        <span>{formatMoney(upgradeCost)}</span>
      </button>
    </div>
  );
}

// ============================================
// SIDE PANEL - Container Principal
// ============================================

interface SidePanelProps {
  isOpen: boolean;
  slotIndex: number;
  store: GameStore | null;
  onClose: () => void;
}

export function SidePanel({ isOpen, slotIndex, store, onClose }: SidePanelProps) {
  return (
    <div className={`side-panel-overlay ${isOpen ? 'open' : ''}`}>
      <div className="side-panel-backdrop" onClick={onClose} />
      <div className="side-panel">
        <div className="sp-header">
          <div className="sp-title">
            <span className="sp-title-emoji">
              {store ? (STORE_DEFINITIONS.find(d => d.id === store.definitionId)?.emoji || '🏢') : '🏗️'}
            </span>
            {store ? 'Gerenciar Loja' : 'Novo Empreendimento'}
          </div>
          <button className="sp-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="sp-content">
          {store ? (
            <ManageStorePanel store={store} onClose={onClose} />
          ) : (
            <BuyStorePanel slotIndex={slotIndex} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}
