import type { Region } from '@/types';

export const REGIONS: Region[] = [
  {
    id: 'megalopolis',
    name: 'Megalopolis',
    state: 'Global',
    tier: 'national',
    unlockCost: 0,
    description: 'Mapa único atual do jogo. Novas regiões chegarão em expansões futuras.',
    storeSlots: 32,
    coordinates: { x: 50, y: 50 },
  },
];
