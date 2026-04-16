import type { Rarity, Executive, ExecutiveDefinition } from '@/types';
import { EXECUTIVE_POOL } from '@/data/staff';
import { RARITY_WEIGHTS } from '@/data/balancing';

/**
 * Executa um giro do gacha e retorna um executivo
 */
export function rollGacha(pityCounter: number, pityThreshold: number): {
  executive: ExecutiveDefinition;
  newPityCounter: number;
} {
  let rarity: Rarity;

  // Pity system: se atingiu o threshold, garante pelo menos Director
  if (pityCounter >= pityThreshold) {
    const roll = Math.random() * 100;
    if (roll < 20) {
      rarity = 'ceo';
    } else {
      rarity = 'director';
    }
  } else {
    rarity = rollRarity();
  }

  // Filtra pool pela raridade
  const candidates = EXECUTIVE_POOL.filter(e => e.rarity === rarity);
  const selected = candidates[Math.floor(Math.random() * candidates.length)];

  // Reset pity se tirou director ou ceo
  const newPityCounter =
    rarity === 'director' || rarity === 'ceo' ? 0 : pityCounter + 1;

  return {
    executive: selected,
    newPityCounter,
  };
}

/**
 * Rola a raridade baseado nos pesos configurados
 */
function rollRarity(): Rarity {
  const totalWeight = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;

  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    roll -= weight;
    if (roll <= 0) {
      return rarity as Rarity;
    }
  }

  return 'intern'; // Fallback
}

/**
 * Cria uma instância de Executive a partir de uma definição
 */
export function createExecutiveFromDefinition(
  definition: ExecutiveDefinition
): Executive {
  return {
    id: `${definition.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    definitionId: definition.id,
    name: definition.name,
    rarity: definition.rarity,
    portrait: definition.portrait,
    multiplier: { ...definition.multiplier },
    assignedStoreId: null,
    recruitedAt: Date.now(),
  };
}

/**
 * Verifica se o jogador pode fazer um giro grátis hoje
 */
export function canClaimFreeSpin(lastFreeSpinDate: string | null): boolean {
  if (!lastFreeSpinDate) return true;
  const today = new Date().toDateString();
  return lastFreeSpinDate !== today;
}
