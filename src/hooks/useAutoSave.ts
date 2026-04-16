import { useEffect } from 'react';
import { BALANCE } from '@/data/balancing';
import { ApiService } from '@/services/apiService';
import { useGameStore } from '@/store/useGameStore';
import { usePrestigeStore } from '@/store/usePrestigeStore';

/**
 * Hook para gerenciar auto-save, forçando a store a escrever no persist.
 * E também despachar o state para o nosso Spring Boot Backend.
 */
export function useAutoSave() {
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('[AutoSave] Jogo salvo localmente. Tentando Cloud Sync...');
      
      const gameState = useGameStore.getState();
      const prestigeState = usePrestigeStore.getState();

      // Fire and forget to the simulated backend
      ApiService.syncCloudSave({
        userId: 'local_player_uid_01', 
        money: gameState.money,
        totalMoneyEarned: gameState.totalMoneyEarned,
        goldenShares: prestigeState.goldenShares,
        lastTickTimestamp: gameState.lastTickTimestamp
      }).catch(err => console.error("Cloud save failed", err));

    }, BALANCE.AUTO_SAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);
}
