
import { useGameStore } from '@/store/useGameStore';
import { Button } from '../ui/Button';
import { CurrencyDisplay } from '../ui/CurrencyDisplay';
import { audioEngine } from '@/engine/audioEngine';
import Decimal from 'break_infinity.js';
import { usePrestigeStore } from '@/store/usePrestigeStore';
import { useI18n } from '@/i18n/useI18n';
import './UpgradePanel.css';

export function UpgradePanel() {
  const { t } = useI18n();
  const upgrades = useGameStore(state => state.upgrades);
  const moneyStr = useGameStore(state => state.money);
  const stores = useGameStore(state => state.stores);
  const currentRegion = useGameStore(state => state.currentRegion);
  const unlockedRegions = useGameStore(state => state.unlockedRegions);
  const prestigeCount = usePrestigeStore(state => state.totalPrestigeCount);
  const money = new Decimal(moneyStr);
  const buyUpgrade = useGameStore(state => state.buyUpgrade);

  const isUnlocked = (upgrade: (typeof upgrades)[number]) => {
    const condition = upgrade.unlockCondition;
    if (condition.type === 'none') return true;
    if (condition.type === 'money') return money.gte(condition.value);
    if (condition.type === 'stores') return stores.length >= condition.value;
    if (condition.type === 'prestige') return prestigeCount >= condition.value;
    if (condition.type === 'region') {
      if (!condition.regionId) return false;
      return condition.regionId === currentRegion || unlockedRegions.includes(condition.regionId);
    }
    return false;
  };

  const availableUpgrades = upgrades
    .filter(u => isUnlocked(u) && (!u.purchased || u.repeatable) && (!u.maxLevel || u.currentLevel < u.maxLevel))
    .sort((a, b) => a.cost - b.cost);

  return (
    <div className="tf-upgrade-panel">
      <h2 className="tf-upgrade-title">{t('upgrade.title')}</h2>
      
      {availableUpgrades.length === 0 ? (
        <div className="tf-upgrade-empty">{t('upgrade.empty')}</div>
      ) : (
        <div className="tf-upgrade-list">
          {availableUpgrades.map(upgrade => {
            const cost = new Decimal(upgrade.cost); // Basic cost mapping
            const canAfford = money.gte(cost);
            
            return (
              <div key={upgrade.id} className="tf-upgrade-item">
                <div className="tf-upgrade-icon">{upgrade.emoji}</div>
                <div className="tf-upgrade-info">
                  <div className="tf-upgrade-name">{t(`upgrade.${upgrade.id}.name`, undefined, upgrade.name)}</div>
                  <div className="tf-upgrade-desc">{t(`upgrade.${upgrade.id}.description`, undefined, upgrade.description)}</div>
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
