import Decimal from 'break_infinity.js';
import type { OfflineEarnings } from '@/types';
import { BALANCE } from '@/data/balancing';

/**
 * Calcula os ganhos enquanto o jogador esteve offline
 */
export function calculateOfflineEarnings(
  lastTickTimestamp: number,
  moneyPerSecond: Decimal
): OfflineEarnings {
  const now = Date.now();
  const secondsAway = Math.floor((now - lastTickTimestamp) / 1000);

  if (secondsAway < 10) {
    // Menos de 10 segundos: não mostra modal
    return {
      secondsAway: 0,
      normalEarnings: new Decimal(0),
      doubleEarnings: new Decimal(0),
      cappedAtMax: false,
    };
  }

  // Cap máximo de horas offline
  const maxSeconds = BALANCE.OFFLINE_MAX_HOURS * 3600;
  const effectiveSeconds = Math.min(secondsAway, maxSeconds);
  const cappedAtMax = secondsAway > maxSeconds;

  // Eficiência offline (50% da produção normal)
  const normalEarnings = moneyPerSecond
    .times(effectiveSeconds)
    .times(BALANCE.OFFLINE_EFFICIENCY);

  const doubleEarnings = normalEarnings.times(2);

  return {
    secondsAway: effectiveSeconds,
    normalEarnings,
    doubleEarnings,
    cappedAtMax,
  };
}

/**
 * Formata segundos em string legível
 */
export function formatOfflineTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
}
