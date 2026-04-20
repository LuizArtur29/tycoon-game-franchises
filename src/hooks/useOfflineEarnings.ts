import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { calculateOfflineEarnings } from '@/engine/offlineCalculator';
import Decimal from 'break_infinity.js';
import type { OfflineEarnings } from '@/types';

/**
 * Hook que calcula ganhos offline ao carregar o aplicativo
 */
export function useOfflineEarnings(onEarningsCalculated: (earnings: OfflineEarnings) => void) {
  const hasCalculatedRef = useRef(false);
  const lastTickTimestamp = useGameStore(state => state.lastTickTimestamp);
  const _moneyPerSecond = useGameStore(state => state._moneyPerSecond);

  useEffect(() => {
    if (hasCalculatedRef.current) return;

    const moneyPerSecond = new Decimal(_moneyPerSecond);

    const earnings = calculateOfflineEarnings(lastTickTimestamp, moneyPerSecond);

    // Só avisa se passou tempo suficiente (ex: 10 segundos configurados no calculator)
    if (earnings.secondsAway > 0) {
      onEarningsCalculated(earnings);
    }

    hasCalculatedRef.current = true;
  }, [lastTickTimestamp, _moneyPerSecond, onEarningsCalculated]);
}
