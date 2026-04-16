import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAdsStore } from '@/store/useAdsStore';
import { useMarketStore } from '@/store/useMarketStore';
import { BALANCE } from '@/data/balancing';

/**
 * Hook que inicia o loop principal do jogo (calculando $/s a cada tick)
 * Agora também gerencia a periodicidade da Bolsa de Valores e Eventos.
 */
export function useGameLoop() {
  const tick = useGameStore(state => state.tick);
  const cleanExpiredBoosts = useAdsStore(state => state.cleanExpiredBoosts);
  const tickStocks = useMarketStore(state => state.tickStocks);
  const randomizeEvent = useMarketStore(state => state.randomizeEvent);

  // Contadores de ticks para eventos de longa duração
  const stockTickCounter = useRef(0);
  const eventTickCounter = useRef(0);

  useEffect(() => {
    let lastTime = performance.now();

    const interval = setInterval(() => {
      const now = performance.now();
      const deltaMs = now - lastTime;
      lastTime = now;

      try {
        // 1. Tick de Ganhos / Produção
        tick(deltaMs);
        
        // 2. Limpeza de Boosts expirados
        cleanExpiredBoosts();

        // 3. Volatilidade da Bolsa (a cada 5 segundos)
        stockTickCounter.current += 1;
        if (stockTickCounter.current >= 5) {
          tickStocks();
          stockTickCounter.current = 0;
        }

        // 4. Sorteio de Eventos (a cada 8 minutos = 480 segundos)
        eventTickCounter.current += 1;
        if (eventTickCounter.current >= 480) {
          randomizeEvent();
          eventTickCounter.current = 0;
        }

      } catch (error) {
        console.error('Erro no Game Loop:', error);
      }
    }, BALANCE.TICK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [tick, cleanExpiredBoosts, tickStocks, randomizeEvent]);
}
