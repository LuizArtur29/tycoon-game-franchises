import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/useGameStore';
import { REGIONS } from '@/data/regions';
import { Button } from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { audioEngine } from '@/engine/audioEngine';
import Decimal from 'break_infinity.js';
import './RegionView.css';

export function RegionView() {
  const navigate = useNavigate();
  const currentRegion = useGameStore(state => state.currentRegion);
  const unlockedRegions = useGameStore(state => state.unlockedRegions);
  const moneyStr = useGameStore(state => state.money);
  const money = new Decimal(moneyStr);
  const unlockRegion = useGameStore(state => state.unlockRegion);
  const changeRegion = useGameStore(state => state.changeRegion);

  const handleUnlock = (regionId: string) => {
    if (unlockRegion(regionId)) {
       audioEngine.playSFX('unlock');
       window.dispatchEvent(new CustomEvent('spawn_confetti'));
       alert('Nova região destrancada!');
    }
  };

  return (
    <div className="tf-region-page">
      <header className="tf-region-header">
        <Button variant="secondary" onClick={() => navigate('/')}>⬅ VOLTAR</Button>
        <h1>Mapa de Expansão</h1>
        <div className="tf-region-money">
           <CurrencyDisplay value={money} size="md" />
        </div>
      </header>

      <div className="tf-region-content">
        <p className="tf-region-subtitle">Escolha o seu próximo mercado de atuação. Expanda para novas cidades e domine o mundo dos negócios!</p>

        <div className="tf-region-grid">
          {REGIONS.map(region => {
            const isUnlocked = unlockedRegions.includes(region.id);
            const isCurrent = currentRegion === region.id;
            const cost = new Decimal(region.unlockCost);
            const canAfford = money.gte(cost);

            return (
              <div 
                key={region.id} 
                className={`tf-region-card ${isCurrent ? 'current' : ''} ${!isUnlocked ? 'locked' : ''}`}
              >
                <div className="tf-region-icon">🏙️</div>
                <h2 className="tf-region-name">{region.name}</h2>
                <div className="tf-region-bonus">Nível Urbano: {region.tier.toUpperCase()}</div>

                <div className="tf-region-action">
                  {isCurrent ? (
                    <span className="tf-region-active-badge">ATIVO AQUI</span>
                  ) : isUnlocked ? (
                    <Button variant="success" fullWidth onClick={() => {
                        changeRegion(region.id);
                        navigate('/');
                    }}>
                      Viajar para {region.name}
                    </Button>
                  ) : (
                    <Button 
                      variant={canAfford ? 'primary' : 'secondary'} 
                      fullWidth 
                      disabled={!canAfford}
                      onClick={() => handleUnlock(region.id)}
                    >
                      Comprar Acesso 
                      <br/>
                      <CurrencyDisplay value={cost} size="sm" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
