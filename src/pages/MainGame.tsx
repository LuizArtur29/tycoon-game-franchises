import React, { useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/useGameStore';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { NewsTicker } from '@/components/ui/NewsTicker';
import { IsometricMap } from '@/components/game/IsometricMap';
import { SidePanel } from '@/components/game/SidePanel';
import { AngelInvestor } from '@/components/game/AngelInvestor';
import { StatsModal } from '@/components/game/StatsModal';
import { UpgradePanel } from '@/components/game/UpgradePanel';
import { Modal } from '@/components/ui/Modal';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { audioEngine } from '@/engine/audioEngine';
import Decimal from 'break_infinity.js';
import type { GameStore } from '@/types';
import { useI18n } from '@/i18n/useI18n';
import './MainGame.css';

export function MainGame() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const moneyStr = useGameStore(state => state.money);
  const money = new Decimal(moneyStr);
  const _moneyPerSecond = useGameStore(state => state._moneyPerSecond);
  const moneyPerSecond = new Decimal(_moneyPerSecond);
  const clickPowerStr = useGameStore(state => state.clickPower);
  const clickPower = new Decimal(clickPowerStr);
  const click = useGameStore(state => state.click);

  const [isMuted, setIsMuted] = useState(audioEngine.isMuted());
  const [showStats, setShowStats] = useState(false);
  const [showUpgrades, setShowUpgrades] = useState(false);

  // Side Panel state
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelSlot, setPanelSlot] = useState(0);
  const [panelStore, setPanelStore] = useState<GameStore | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const [clickEffects, setClickEffects] = useState<{ id: number; x: number; y: number }[]>([]);

  const handleManualClick = (e: React.MouseEvent) => {
    audioEngine.startBGM();
    audioEngine.playSFX('click');
    click();

    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left - 20;
      const y = e.clientY - rect.top - 20;

      const newEffect = { id: Date.now(), x, y };
      setClickEffects(prev => [...prev, newEffect]);

      const globalX = e.clientX;
      const globalY = e.clientY;
      window.dispatchEvent(new CustomEvent('spawn_coin', {
        detail: { x: globalX, y: globalY, amount: 5 }
      }));

      setTimeout(() => {
        setClickEffects(prev => prev.filter(effect => effect.id !== newEffect.id));
      }, 1000);
    }
  };

  const handleSlotClick = useCallback((slotIndex: number, store: GameStore | null) => {
    setPanelSlot(slotIndex);
    setPanelStore(store);
    setPanelOpen(true);
  }, []);

  const handlePanelClose = useCallback(() => {
    setPanelOpen(false);
  }, []);

  const toggleMute = () => {
    const newMuted = audioEngine.toggleMute();
    setIsMuted(newMuted);
  };

  return (
    <div className="tf-main-game">
      <NewsTicker />
      {/* HEADER */}
      <header className="tf-header">
        <div className="tf-header-logo">
          🍔 {t('app.name')}
        </div>
        <div className="tf-header-nav">
          <button
             className="tf-nav-btn"
             onClick={toggleMute}
             title={isMuted ? t('main.sound.enable') : t('main.sound.mute')}
          >
             {isMuted ? '🔇' : '🔊'}
          </button>
          <LanguageSwitcher />
          <button
             className="tf-nav-btn"
             disabled
             title={t('main.map.activeTitle')}
          >
             🗺️ {t('main.map.button')}
          </button>
          <button
             className="tf-nav-btn"
             onClick={() => navigate('/stocks')}
          >
             💹 {t('main.nav.investments')}
          </button>
          <button
             className="tf-nav-btn"
             onClick={() => setShowStats(true)}
          >
             📊 {t('main.nav.stats')}
          </button>
          <button
             className="tf-nav-btn"
             onClick={() => setShowUpgrades(!showUpgrades)}
          >
             🔧 {t('main.nav.upgrades')}
          </button>
          <button
             className="tf-nav-btn"
             onClick={() => navigate('/staff')}
          >
             👥 {t('main.nav.hr')}
          </button>
          <button
             className="tf-nav-btn tf-nav-prestige"
             onClick={() => navigate('/prestige')}
          >
             📈 {t('main.nav.ipo')}
          </button>
          <button
             className="tf-nav-btn"
             onClick={() => navigate('/leaderboard')}
          >
             🌍 {t('main.nav.rankings')}
          </button>
        </div>
        <div className="tf-header-stats">
           <div className="tf-money-container">
             <CurrencyDisplay value={money} size="lg" />
           </div>
           <div className="tf-income-container">
             <CurrencyDisplay value={moneyPerSecond} size="sm" icon="📈" showPlus /> {t('main.income.perSecond')}
           </div>
        </div>
      </header>

      {showStats && <StatsModal onClose={() => setShowStats(false)} />}

      {/* CONTENT: Mapa */}
      <div className="tf-content-grid">
        <AngelInvestor />

        {/* Mapa Isométrico — ocupa a maior parte */}
        <main className="tf-map-area">
          <IsometricMap onSlotClick={handleSlotClick} />

          {/* Botão de clique flutuante */}
          <div className="tf-floating-click-container">
            <button
              ref={buttonRef}
              className="tf-big-click-btn"
              onClick={handleManualClick}
            >
              <span className="tf-big-click-icon">🏪</span>
              <h1>{t('main.click.sell')}</h1>
              <p>+{clickPower.toExponential(0)} {t('main.click.perClick')}</p>

              {clickEffects.map(effect => (
                <span
                  key={effect.id}
                  className="tf-floating-text"
                  style={{ left: effect.x, top: effect.y }}
                >
                  +{clickPower.toExponential(0)}
                </span>
              ))}
            </button>
          </div>
        </main>
      </div>

      <Modal
        isOpen={showUpgrades}
        onClose={() => setShowUpgrades(false)}
        title={t('main.modal.upgrades')}
        contentClassName="tf-modal-content-upgrades"
      >
        <div className="tf-upgrades-modal-content">
          <UpgradePanel />
        </div>
      </Modal>

      {/* Side Panel (comprar/gerenciar) */}
      <SidePanel
        isOpen={panelOpen}
        slotIndex={panelSlot}
        store={panelStore}
        onClose={handlePanelClose}
      />
    </div>
  );
}
