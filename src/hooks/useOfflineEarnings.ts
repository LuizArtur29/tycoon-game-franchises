import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { calculateOfflineEarnings } from '@/engine/offlineCalculator';
import Decimal from 'break_infinity.js';
import type { OfflineEarnings } from '@/types';

/**
 * Hook que calcula ganhos offline ao carregar o aplicativo
 */
export function useOfflineEarnings(onEarningsCalculated: (earnings: OfflineEarnings) => void) {
  const [calculated, setCalculated] = useState(false);
  const lastTickTimestamp = useGameStore(state => state.lastTickTimestamp);
  const _moneyPerSecond = useGameStore(state => state._moneyPerSecond);
  const moneyPerSecond = new Decimal(_moneyPerSecond);

  useEffect(() => {
    if (calculated) return;

    const earnings = calculateOfflineEarnings(lastTickTimestamp, moneyPerSecond);

    // Só avisa se passou tempo suficiente (ex: 10 segundos configurados no calculator)
    if (earnings.secondsAway > 0) {
      onEarningsCalculated(earnings);
    }

    setCalculated(true);
  }, [calculated, lastTickTimestamp, moneyPerSecond, onEarningsCalculated]);

  return calculated;
}
