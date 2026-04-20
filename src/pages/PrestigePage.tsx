import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/useGameStore';
import { usePrestigeStore } from '@/store/usePrestigeStore';
import { Button } from '@/components/ui/Button';
import { calculatePrestigeReward } from '@/engine/prestigeEngine';
import { audioEngine } from '@/engine/audioEngine';
import { useI18n } from '@/i18n/useI18n';
import Decimal from 'break_infinity.js';
import './PrestigePage.css';

export function PrestigePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  // We use the total money ever earned across all playthroughs for the calculation
  const totalMoneyEarnedStr = useGameStore(state => state.totalMoneyEarned);
  const resetForPrestige = useGameStore(state => state.resetForPrestige);
  const prestigeState = usePrestigeStore();
  
  const totalLifetimeEarned = new Decimal(totalMoneyEarnedStr);
  const currentShares = prestigeState.goldenShares;
  const currentMultiplier = (prestigeState.permanentMultiplier - 1) * 100;
  
  const reward = calculatePrestigeReward(totalLifetimeEarned);
  const canPrestige = reward !== null;
  const newSharesGained = reward ? reward.goldenSharesEarned : 0;

  const handlePrestige = () => {
    if (canPrestige) {
      if (confirm(t('prestige.confirm'))) {
        prestigeState.executePrestige(totalLifetimeEarned);
        resetForPrestige();
        audioEngine.playSFX('prestige');
        window.dispatchEvent(new CustomEvent('spawn_confetti'));
        navigate('/');
      }
    }
  };

  return (
    <div className="tf-prestige-page">
      <header className="tf-prestige-header">
        <Button variant="secondary" onClick={() => navigate('/')}>⬅ {t('prestige.back')}</Button>
        <h1>{t('prestige.title')}</h1>
        <div></div>
      </header>

      <div className="tf-prestige-content">
        <div className="tf-prestige-panel">
          <div className="tf-prestige-icon">📈</div>
          <h2>{t('prestige.heading')}</h2>
          <p>{t('prestige.subtitle')}</p>

          <div className="tf-prestige-stats">
            <div className="stat-box">
              <span className="stat-label">{t('prestige.currentShares')}</span>
              <span className="stat-value">{currentShares}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">{t('prestige.fixedBonus')}</span>
              <span className="stat-value">+{currentMultiplier.toFixed(0)}%</span>
            </div>
          </div>

          <div className="tf-prestige-reward-box">
             <h3>{t('prestige.sellToday')}</h3>
             {canPrestige ? (
               <>
                  <div className="reward-big-number">{t('prestige.sharesGain', { count: newSharesGained })}</div>
                  <p className="reward-sub">{t('prestige.sharesAfter', { current: currentShares, next: currentShares + newSharesGained })}</p>
               </>
             ) : (
               <div className="reward-warning">
                  {t('prestige.minValue')}
               </div>
             )}
          </div>

          <Button 
            variant={canPrestige ? 'primary' : 'secondary'} 
            size="lg" 
            fullWidth 
            disabled={!canPrestige}
            onClick={handlePrestige}
            style={{ marginTop: '20px' }}
          >
            {t('prestige.sellNow')}
          </Button>

        </div>
      </div>
    </div>
  );
}
