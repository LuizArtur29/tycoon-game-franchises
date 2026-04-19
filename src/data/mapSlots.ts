import mapJson from '@/data/mapa.json';

interface TiledLayer {
  type: string;
  name: string;
  data?: number[];
  width?: number;
  height?: number;
  x?: number;
  y?: number;
}

interface TiledMapData {
  width: number;
  height: number;
  layers: TiledLayer[];
}

export interface MapSlotPosition {
  col: number;
  row: number;
  slotIndex: number;
}

const MAP_DATA = mapJson as TiledMapData;

const LOTES_LAYER = MAP_DATA.layers.find(
  (layer) => layer.type === 'tilelayer' && layer.name === 'Lotes'
);

if (!LOTES_LAYER?.data || !LOTES_LAYER.width || !LOTES_LAYER.height) {
  throw new Error('mapa.json invalido: camada Lotes nao encontrada.');
}

const lotesWidth = LOTES_LAYER.width;
const lotesHeight = LOTES_LAYER.height;
const lotesColOffset = LOTES_LAYER.x ?? 0;
const lotesRowOffset = LOTES_LAYER.y ?? 0;

const positions: MapSlotPosition[] = [];
for (let row = 0; row < lotesHeight; row++) {
  for (let col = 0; col < lotesWidth; col++) {
    const gid = LOTES_LAYER.data[row * lotesWidth + col] ?? 0;
    if (gid !== 0) {
      positions.push({
        col: col + lotesColOffset,
        row: row + lotesRowOffset,
        slotIndex: positions.length,
      });
    }
  }
}

export const MAP_LOTES_SLOT_POSITIONS = positions;
export const MAP_LOTES_TILE_KEY_SET = new Set(
  positions.map((position) => `${position.col}_${position.row}`)
);
export const MAP_LOTES_SLOT_SET = new Set(positions.map((position) => position.slotIndex));
export const MAP_LOTES_TOTAL_SLOTS = positions.length;

export function getFirstFreeMapLoteSlot(usedSlots: Set<number>): number | null {
  for (const position of MAP_LOTES_SLOT_POSITIONS) {
    if (!usedSlots.has(position.slotIndex)) {
      return position.slotIndex;
    }
  }
  return null;
}
