import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/useGameStore';
import { usePrestigeStore } from '@/store/usePrestigeStore';
import { Button } from '@/components/ui/Button';
import { calculatePrestigeReward } from '@/engine/prestigeEngine';
import { audioEngine } from '@/engine/audioEngine';
import Decimal from 'break_infinity.js';
import './PrestigePage.css';

export function PrestigePage() {
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
      if (confirm('Vender a corporação fará você perder o dinheiro atual, lojas e upgrades em troca das Ações de Ouro permanentes. Deseja prosseguir na IPO?')) {
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
        <Button variant="secondary" onClick={() => navigate('/')}>⬅ VOLTAR</Button>
        <h1>Bolsa de Valores (IPO)</h1>
        <div></div>
      </header>

      <div className="tf-prestige-content">
        <div className="tf-prestige-panel">
          <div className="tf-prestige-icon">📈</div>
          <h2>Oferta Pública Inicial</h2>
          <p>Seus investidores de Wall Street estão acompanhando seus ganhos.</p>

          <div className="tf-prestige-stats">
            <div className="stat-box">
              <span className="stat-label">Ações de Ouro Atuais</span>
              <span className="stat-value">{currentShares}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Bônus Global Fixo</span>
              <span className="stat-value">+{currentMultiplier.toFixed(0)}%</span>
            </div>
          </div>

          <div className="tf-prestige-reward-box">
             <h3>Se você vender a Franquia hoje:</h3>
             {canPrestige ? (
               <>
                 <div className="reward-big-number">+{newSharesGained} Ações</div>
                 <p className="reward-sub">Você passará de {currentShares} para {currentShares + newSharesGained} ações de ouro!</p>
               </>
             ) : (
               <div className="reward-warning">
                 Sua corporação ainda não vale o mínimo para abrir o capital em Wall Street.
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
            VENDER EMPRESA AGORA
          </Button>

        </div>
      </div>
    </div>
  );
}
