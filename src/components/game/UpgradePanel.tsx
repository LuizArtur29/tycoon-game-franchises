
import { useGameStore } from '@/store/useGameStore';
import { Button } from '../ui/Button';
import { CurrencyDisplay } from '../ui/CurrencyDisplay';
import { audioEngine } from '@/engine/audioEngine';
import Decimal from 'break_infinity.js';
import './UpgradePanel.css';

export function UpgradePanel() {
  const upgrades = useGameStore(state => state.upgrades);
  const moneyStr = useGameStore(state => state.money);
  const money = new Decimal(moneyStr);
  const buyUpgrade = useGameStore(state => state.buyUpgrade);

  // Filtra upgrades disponíveis (por enquanto mostraremos todos não comprados)
  // TODO: filter por unlockConditions futuramente
  const availableUpgrades = upgrades.filter(u => (!u.purchased || u.repeatable) && (!u.maxLevel || u.currentLevel < u.maxLevel));

  return (
    <div className="tf-upgrade-panel">
      <h2 className="tf-upgrade-title">Pesquisa & Melhorias</h2>
      
      {availableUpgrades.length === 0 ? (
        <div className="tf-upgrade-empty">Nenhum upgrade disponível no momento.</div>
      ) : (
        <div className="tf-upgrade-list">
          {availableUpgrades.map(upgrade => {
            const cost = new Decimal(upgrade.cost); // Basic cost mapping
            const canAfford = money.gte(cost);
            
            return (
              <div key={upgrade.id} className="tf-upgrade-item">
                <div className="tf-upgrade-icon">{upgrade.emoji}</div>
                <div className="tf-upgrade-info">
                  <div className="tf-upgrade-name">{upgrade.name}</div>
                  <div className="tf-upgrade-desc">{upgrade.description}</div>
                </div>
                <Button 
                  variant={canAfford ? 'primary' : 'secondary'}
                  size="sm"
                  disabled={!canAfford}
                  onClick={() => {
                    const success = buyUpgrade(upgrade.id);
                    if (success) audioEngine.playSFX('purchase');
                  }}
                >
                  <CurrencyDisplay value={cost} size="sm" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
