import { useGameStore } from '@/store/useGameStore';
import { calculateStoreCost } from '@/engine/profitCalculator';
import { STORE_DEFINITIONS } from '@/data/stores';
import { audioEngine } from '@/engine/audioEngine';
import { Button } from '../ui/Button';
import { CurrencyDisplay } from '../ui/CurrencyDisplay';
import { ProgressBar } from '../ui/ProgressBar';
import Decimal from 'break_infinity.js';
import './StoreCard.css';

interface StoreCardProps {
  definitionId: string;
}

export function StoreCard({ definitionId }: StoreCardProps) {
  const storeInstance = useGameStore(state => 
    state.stores.find(s => s.definitionId === definitionId)
  );
  
  const definition = STORE_DEFINITIONS.find(d => d.id === definitionId);
  const buyStore = useGameStore(state => state.buyStore);
  const upgradeStore = useGameStore(state => state.upgradeStore);
  const moneyStr = useGameStore(state => state.money);
  const money = new Decimal(moneyStr);

  if (!definition) return null;

  const isPurchased = !!storeInstance;
  const level = storeInstance?.level || 0;
  
  // Custom logic to handle total instances vs level
  // Em muitos jogos clicker as lojas são instâncias (várias mercearias).
  // No nosso plano "level" diz quantas lojas daquele tipo foram compradas na região.
  const cost = calculateStoreCost(definitionId, level, 0); // TODO: Add cost reduction from upgrades
  const canAfford = money.gte(cost);

  const handleBuyOrUpgrade = () => {
    let success = false;
    if (isPurchased) {
      success = upgradeStore(storeInstance.id);
    } else {
      success = buyStore(definitionId);
    }

    if (success) {
      audioEngine.playSFX('purchase');
    }
  };

  return (
    <div className={`tf-store-card ${!isPurchased ? 'tf-store-locked' : ''}`}>
      <div className="tf-store-icon">{definition.emoji}</div>
      
      <div className="tf-store-info">
        <h3 className="tf-store-name">{definition.name}</h3>
        <div className="tf-store-stats">
          {isPurchased ? (
            <>
              <span className="tf-store-level">Nível {level}</span>
              {/* Here we can calculate current profit to display */}
              <span className="tf-store-profit-indicator">Ativa</span> 
            </>
          ) : (
            <span className="tf-store-desc">{definition.description}</span>
          )}
        </div>
      </div>

      <div className="tf-store-actions">
        <Button 
          variant={canAfford ? 'success' : 'secondary'} 
          size="sm" 
          disabled={!canAfford}
          onClick={handleBuyOrUpgrade}
        >
          {isPurchased ? 'UPGRADE' : 'COMPRAR'}
          <br/>
          <CurrencyDisplay value={cost} size="sm" />
        </Button>
      </div>

      {isPurchased && (
        <div className="tf-store-progress">
           {/* Temporary progress bar simulation */}
           <ProgressBar progress={100} height={10} color="#3498db" />
        </div>
      )}
    </div>
  );
}
