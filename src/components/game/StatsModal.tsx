import { useGameStore } from '@/store/useGameStore';
import { usePrestigeStore } from '@/store/usePrestigeStore';
import { useStaffStore } from '@/store/useStaffStore';
import { useAdsStore } from '@/store/useAdsStore';
import { Button } from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import Decimal from 'break_infinity.js';
import './StatsModal.css';

interface StatsModalProps {
  onClose: () => void;
}

export function StatsModal({ onClose }: StatsModalProps) {
  const game = useGameStore();
  const prestige = usePrestigeStore();
  const staff = useStaffStore();
  const ads = useAdsStore();

  const totalMoney = new Decimal(game.totalMoneyEarned);
  const moneyPerSec = new Decimal(game._moneyPerSecond);
  const clickPower = new Decimal(game.clickPower);

  // Formatação de tempo
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  return (
    <div className="tf-modal-overlay">
      <div className="tf-modal-container tf-stats-modal">
        <header className="tf-modal-header">
          <h2>📊 Relatório Consolidado (ERP)</h2>
          <Button variant="secondary" size="sm" onClick={onClose}>X</Button>
        </header>

        <div className="tf-modal-scroll">
          <section className="tf-stats-section">
            <h3>📈 Produção & Ganhos</h3>
            <div className="tf-stat-row">
              <span>Faturamento Vitalício:</span>
              <CurrencyDisplay value={totalMoney} size="sm" />
            </div>
            <div className="tf-stat-row">
              <span>Produção Atual:</span>
              <CurrencyDisplay value={moneyPerSec} size="sm" /> / seg
            </div>
            <div className="tf-stat-row">
              <span>Poder do Clique:</span>
              <CurrencyDisplay value={clickPower} size="sm" /> / clique
            </div>
          </section>

          <section className="tf-stats-section">
            <h3>🛠️ Operações</h3>
            <div className="tf-stat-row">
              <span>Tempo de Operação:</span>
              <strong>{formatTime(game.totalPlayTime)}</strong>
            </div>
            <div className="tf-stat-row">
              <span>Vendas Diretas (Cliques):</span>
              <strong>{game.totalClicks}</strong>
            </div>
            <div className="tf-stat-row">
              <span>Lojas Ativas:</span>
              <strong>{game.stores.length}</strong>
            </div>
            <div className="tf-stat-row">
              <span>Executivos Contratados:</span>
              <strong>{staff.executives.length}</strong>
            </div>
          </section>

          <section className="tf-stats-section">
            <h3>🌟 Multiplicadores Globais</h3>
            <div className="tf-stat-row">
              <span>Bônus de IPO (Wall St):</span>
              <span className="success-text">x{prestige.permanentMultiplier.toFixed(2)}</span>
            </div>
            <div className="tf-stat-row">
              <span>Bônus de Patrocínio (Ads):</span>
              <span className="success-text">x{ads.getActiveBoostMultiplier().toFixed(2)}</span>
            </div>
            <div className="tf-stat-row">
              <span>Bônus Geral:</span>
              <span className="success-text">x{(game.globalMultiplier * game.productionMultiplier).toFixed(2)}</span>
            </div>
          </section>
        </div>

        <footer className="tf-modal-footer">
          <Button variant="primary" fullWidth onClick={onClose}>FECHAR RELATÓRIO</Button>
        </footer>
      </div>
    </div>
  );
}
