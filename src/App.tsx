import { useState } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MainGame } from './pages/MainGame'
import { useGameLoop } from './hooks/useGameLoop'
import { useAutoSave } from './hooks/useAutoSave'
import { useOfflineEarnings } from './hooks/useOfflineEarnings'
import { OfflineModal } from './components/game/OfflineModal'
import { AdModal } from './components/ui/AdModal'
import { PixiCanvas } from './components/effects/PixiCanvas'
import { StaffHQ } from './pages/StaffHQ'
import { RegionView } from './pages/RegionView'
import { PrestigePage } from './pages/PrestigePage'
import { StockMarket } from './pages/StockMarket'
import { LeaderboardPage } from './pages/Leaderboard'
import type { OfflineEarnings } from './types'

function App() {
  // Inicialização das engines e loops globais
  useGameLoop();
  useAutoSave();
  
  const [offlineEarnings, setOfflineEarnings] = useState<OfflineEarnings | null>(null);

  // Calcula ganhos offline no primeiro render
  useOfflineEarnings((earnings) => {
    setOfflineEarnings(earnings);
  });

  return (
    <>
      <PixiCanvas />

      {offlineEarnings && (
        <OfflineModal 
          earnings={offlineEarnings} 
          onClose={() => setOfflineEarnings(null)} 
        />
      )}

      <HashRouter>
        <AdModal />
        <Routes>
          <Route path="/" element={<MainGame />} />
          <Route path="/staff" element={<StaffHQ />} />
          <Route path="/map" element={<RegionView />} />
          <Route path="/stocks" element={<StockMarket />} />
          <Route path="/prestige" element={<PrestigePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </>
  )
}

export default App
