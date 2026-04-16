import React, { useRef, useState, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { NewsTicker } from '@/components/ui/NewsTicker';
import { IsometricMap } from '@/components/game/IsometricMap';
import { SidePanel } from '@/components/game/SidePanel';
import { AngelInvestor } from '@/components/game/AngelInvestor';
import { StatsModal } from '@/components/game/StatsModal';
import { UpgradePanel } from '@/components/game/UpgradePanel';
import { audioEngine } from '@/engine/audioEngine';
import Decimal from 'break_infinity.js';
import type { GameStore } from '@/types';
import './MainGame.css';

export function MainGame() {
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
          🍔 Tycoon Franchises
        </div>
        <div className="tf-header-nav">
          <button 
             className="tf-nav-btn"
             onClick={toggleMute}
             title={isMuted ? "Ativar Som" : "Mudar p/ Mudo"}
          >
             {isMuted ? '🔇' : '🔊'}
          </button>
          <button 
             className="tf-nav-btn"
             onClick={() => window.location.href = '/map'}
          >
             🗺️ Mapa
          </button>
          <button 
             className="tf-nav-btn"
             onClick={() => window.location.href = '/stocks'}
          >
             💹 Investimentos
          </button>
          <button 
             className="tf-nav-btn"
             onClick={() => setShowStats(true)}
          >
             📊 Stats
          </button>
          <button 
             className="tf-nav-btn"
             onClick={() => setShowUpgrades(!showUpgrades)}
          >
             🔧 Upgrades
          </button>
          <button 
             className="tf-nav-btn"
             onClick={() => window.location.href = '/staff'}
          >
             👥 RH
          </button>
          <button 
             className="tf-nav-btn tf-nav-prestige"
             onClick={() => window.location.href = '/prestige'}
          >
             📈 IPO
          </button>
          <button 
             className="tf-nav-btn"
             onClick={() => window.location.href = '/leaderboard'}
          >
             🌍 Rankings
          </button>
        </div>
        <div className="tf-header-stats">
           <div className="tf-money-container">
             <CurrencyDisplay value={money} size="lg" />
           </div>
           <div className="tf-income-container">
             <CurrencyDisplay value={moneyPerSecond} size="sm" icon="📈" showPlus /> / seg
           </div>
        </div>
      </header>

      {showStats && <StatsModal onClose={() => setShowStats(false)} />}

      {/* CONTENT: Mapa + Upgrade Drawer */}
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
              <h1>VENDER!</h1>
              <p>+{clickPower.toExponential(0)} / clique</p>

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

        {/* Upgrades Drawer (condicional) */}
        {showUpgrades && (
          <aside className="tf-side-area">
            <UpgradePanel />
          </aside>
        )}
      </div>

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
