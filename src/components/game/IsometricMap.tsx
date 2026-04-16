import { useEffect, useRef, useState, useCallback } from 'react';
import { Application, Graphics, Container, FederatedPointerEvent } from 'pixi.js';
import { useGameStore } from '@/store/useGameStore';
import { STORE_DEFINITIONS } from '@/data/stores';
import { BUILDING_COLORS } from '@/data/stores';
import { REGIONS } from '@/data/regions';
import mapJson from '@/data/mapa.json';
import type { GameStore, StoreDefinition } from '@/types';
import './IsometricMap.css';

// ============================================
// ISOMETRIC CONFIG
// ============================================

const TILE_WIDTH = 128;
const TILE_HEIGHT = 64;

interface TiledLayer {
  type: string;
  name: string;
  data?: number[];
  width?: number;
  height?: number;
}

interface TiledTileset {
  firstgid: number;
  name?: string;
}

interface TiledMapData {
  width: number;
  height: number;
  layers: TiledLayer[];
  tilesets: TiledTileset[];
}

const MAP_DATA = mapJson as TiledMapData;
const BASE_LAYER = MAP_DATA.layers.find(l => l.type === 'tilelayer' && l.name === 'Camada de Blocos 1')
  ?? MAP_DATA.layers.find(l => l.type === 'tilelayer');

if (!BASE_LAYER?.data || !BASE_LAYER.width || !BASE_LAYER.height) {
  throw new Error('mapa.json invalido: camada base nao encontrada.');
}

const BASE_LAYER_DATA = BASE_LAYER.data as number[];
const BASE_LAYER_WIDTH = BASE_LAYER.width as number;
const BASE_LAYER_HEIGHT = BASE_LAYER.height as number;

function collectBuildableGids(tilesets: TiledTileset[]): Set<number> {
  const sorted = [...tilesets].sort((a, b) => a.firstgid - b.firstgid);
  const out = new Set<number>();
  for (let i = 0; i < sorted.length; i++) {
    const ts = sorted[i];
    const next = i + 1 < sorted.length ? sorted[i + 1].firstgid : Number.MAX_SAFE_INTEGER;
    if (!ts.name?.startsWith('landscapeTiles_')) continue;
    for (let gid = ts.firstgid; gid < next; gid++) out.add(gid);
  }
  return out;
}

const GRID_COLS = BASE_LAYER_WIDTH;
const GRID_ROWS = BASE_LAYER_HEIGHT;
const BUILDABLE_GID_SET = collectBuildableGids(MAP_DATA.tilesets);

type TileKind = 'void' | 'buildable' | 'blocked';

function cartToIso(col: number, row: number) {
  return {
    x: (col - row) * (TILE_WIDTH / 2),
    y: (col + row) * (TILE_HEIGHT / 2),
  };
}

function isoToCart(isoX: number, isoY: number) {
  const col = (isoX / (TILE_WIDTH / 2) + isoY / (TILE_HEIGHT / 2)) / 2;
  const row = (isoY / (TILE_HEIGHT / 2) - isoX / (TILE_WIDTH / 2)) / 2;
  return { col: Math.floor(col), row: Math.floor(row) };
}

// ============================================
// VECTOR BUILDING DRAWING
// ============================================

function hexToNum(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

function drawIsometricBuilding(
  g: Graphics, x: number, y: number,
  defId: string, level: number
) {
  const colors = BUILDING_COLORS[defId] || { primary: '#607D8B', secondary: '#37474F', roof: '#90A4AE' };
  const primary = hexToNum(colors.primary);
  const secondary = hexToNum(colors.secondary);
  const roof = hexToNum(colors.roof);

  // Building dimensions scale with level
  const baseW = TILE_WIDTH * 0.6;
  const baseH = TILE_HEIGHT * 0.35;
  const buildingHeight = 28 + Math.min(level, 20) * 3;

  // Left face (darker)
  g.moveTo(x - baseW / 2, y);
  g.lineTo(x, y + baseH / 2);
  g.lineTo(x, y + baseH / 2 - buildingHeight);
  g.lineTo(x - baseW / 2, y - buildingHeight);
  g.closePath();
  g.fill({ color: secondary, alpha: 0.95 });

  // Right face (primary)
  g.moveTo(x + baseW / 2, y);
  g.lineTo(x, y + baseH / 2);
  g.lineTo(x, y + baseH / 2 - buildingHeight);
  g.lineTo(x + baseW / 2, y - buildingHeight);
  g.closePath();
  g.fill({ color: primary, alpha: 0.95 });

  // Roof (top face)
  g.moveTo(x, y - buildingHeight - baseH / 2);
  g.lineTo(x + baseW / 2, y - buildingHeight);
  g.lineTo(x, y - buildingHeight + baseH / 2);
  g.lineTo(x - baseW / 2, y - buildingHeight);
  g.closePath();
  g.fill({ color: roof, alpha: 0.95 });

  // Windows on left face
  const windowRows = Math.min(Math.floor(buildingHeight / 14), 5);
  for (let wr = 0; wr < windowRows; wr++) {
    const wy = y - 8 - wr * 14;
    const wx = x - baseW * 0.28;
    g.rect(wx - 3, wy - 4, 6, 5);
    g.fill({ color: 0xffeb3b, alpha: 0.7 });
    g.rect(wx + 5, wy - 4, 6, 5);
    g.fill({ color: 0xfff9c4, alpha: 0.5 });
  }

  // Windows on right face
  for (let wr = 0; wr < windowRows; wr++) {
    const wy = y - 8 - wr * 14;
    const wx = x + baseW * 0.15;
    g.rect(wx - 3, wy - 4, 6, 5);
    g.fill({ color: 0xffeb3b, alpha: 0.6 });
    g.rect(wx + 5, wy - 4, 6, 5);
    g.fill({ color: 0xfff9c4, alpha: 0.4 });
  }

  // Door on right face
  g.rect(x + 2, y - 10, 8, 10);
  g.fill({ color: secondary, alpha: 0.8 });

  // Outline
  g.moveTo(x - baseW / 2, y);
  g.lineTo(x, y + baseH / 2);
  g.lineTo(x + baseW / 2, y);
  g.lineTo(x + baseW / 2, y - buildingHeight);
  g.lineTo(x, y - buildingHeight - baseH / 2);
  g.lineTo(x - baseW / 2, y - buildingHeight);
  g.lineTo(x - baseW / 2, y);
  g.stroke({ color: 0x000000, width: 1.2, alpha: 0.25 });
}

// ============================================
// LAYOUT GENERATION
// ============================================

interface SlotPosition { col: number; row: number; slotIndex: number; }
interface MapLayout {
  cols: number;
  rows: number;
  tileKinds: TileKind[][];
  slotPositions: SlotPosition[];
}

function generateMapLayout(totalSlots: number): MapLayout {
  const allBuildableCells: { col: number; row: number }[] = [];
  const tileKinds: TileKind[][] = [];

  for (let r = 0; r < GRID_ROWS; r++) {
    const rowKinds: TileKind[] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      const gid = BASE_LAYER_DATA[r * GRID_COLS + c] ?? 0;
      const kind: TileKind = gid === 0 ? 'void' : (BUILDABLE_GID_SET.has(gid) ? 'buildable' : 'blocked');
      rowKinds.push(kind);
      if (kind === 'buildable') {
        allBuildableCells.push({ col: c, row: r });
      }
    }
    tileKinds.push(rowKinds);
  }

  const centerCol = (GRID_COLS - 1) / 2;
  const centerRow = (GRID_ROWS - 1) / 2;
  allBuildableCells.sort((a, b) => {
    const da = Math.abs(a.col - centerCol) + Math.abs(a.row - centerRow);
    const db = Math.abs(b.col - centerCol) + Math.abs(b.row - centerRow);
    if (da !== db) return da - db;
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });

  const slotCells = allBuildableCells.slice(0, Math.min(totalSlots, allBuildableCells.length));
  const slotPositions = slotCells.map((cell, idx) => ({ ...cell, slotIndex: idx }));

  return {
    cols: GRID_COLS,
    rows: GRID_ROWS,
    tileKinds,
    slotPositions,
  };
}

// ============================================
// GROUND DRAWING
// ============================================

function drawIsoDiamond(g: Graphics, x: number, y: number, w: number, h: number, color: number, alpha = 1) {
  g.moveTo(x, y - h / 2);
  g.lineTo(x + w / 2, y);
  g.lineTo(x, y + h / 2);
  g.lineTo(x - w / 2, y);
  g.closePath();
  g.fill({ color, alpha });
}

function drawBlockedTile(g: Graphics, x: number, y: number) {
  drawIsoDiamond(g, x, y, TILE_WIDTH, TILE_HEIGHT, 0x5f6770, 0.95);
  drawIsoDiamond(g, x, y, TILE_WIDTH - 8, TILE_HEIGHT - 4, 0x737d87, 0.84);
}

function drawEmptyLot(g: Graphics, x: number, y: number) {
  drawIsoDiamond(g, x, y, TILE_WIDTH - 6, TILE_HEIGHT - 3, 0x7d6a58, 0.34);
  drawIsoDiamond(g, x, y, TILE_WIDTH - 16, TILE_HEIGHT - 8, 0xb39b86, 0.22);
  // Dashed outline
  g.moveTo(x, y - (TILE_HEIGHT - 6) / 2);
  g.lineTo(x + (TILE_WIDTH - 10) / 2, y);
  g.lineTo(x, y + (TILE_HEIGHT - 6) / 2);
  g.lineTo(x - (TILE_WIDTH - 10) / 2, y);
  g.closePath();
  g.stroke({ color: 0xffffff, width: 1.5, alpha: 0.2 });
  // Plus sign
  const s = 7;
  g.moveTo(x - s, y); g.lineTo(x + s, y);
  g.stroke({ color: 0xffffff, width: 2, alpha: 0.25 });
  g.moveTo(x, y - s * 0.5); g.lineTo(x, y + s * 0.5);
  g.stroke({ color: 0xffffff, width: 2, alpha: 0.25 });
}

function drawPurchasableLot(g: Graphics, x: number, y: number, pulse: number) {
  drawEmptyLot(g, x, y);
  const glowAlpha = 0.14 + pulse * 0.16;
  const outlineAlpha = 0.28 + pulse * 0.2;

  drawIsoDiamond(g, x, y, TILE_WIDTH - 8, TILE_HEIGHT - 4, 0x22c55e, glowAlpha);
  g.moveTo(x, y - (TILE_HEIGHT - 10) / 2);
  g.lineTo(x + (TILE_WIDTH - 14) / 2, y);
  g.lineTo(x, y + (TILE_HEIGHT - 10) / 2);
  g.lineTo(x - (TILE_WIDTH - 14) / 2, y);
  g.closePath();
  g.stroke({ color: 0xffffff, width: 1.8, alpha: outlineAlpha });

  // Price marker style dot to quickly indicate a buyable slot.
  drawIsoDiamond(g, x, y - 2, TILE_WIDTH * 0.18, TILE_HEIGHT * 0.12, 0xfacc15, 0.9);
}

function drawGroundContact(g: Graphics, x: number, groundY: number, footprintScale = 1, alpha = 0.2) {
  // Hard contact right under the building to "pin" the sprite to the floor.
  drawIsoDiamond(g, x, groundY + 1, TILE_WIDTH * 0.38 * footprintScale, TILE_HEIGHT * 0.2, 0x000000, alpha * 0.55);
  // Soft penumbra for depth.
  drawIsoDiamond(g, x, groundY + 5, TILE_WIDTH * 0.58 * footprintScale, TILE_HEIGHT * 0.34, 0x000000, alpha * 0.35);
}

function drawGround(
  g: Graphics, centerX: number, centerY: number,
  cols: number,
  rows: number,
  tileKinds: TileKind[][],
  slotLookup: Map<string, number>
) {
  // Outer grass
  for (let r = -4; r < rows + 4; r++) {
    for (let c = -4; c < cols + 4; c++) {
      const inside = c >= 0 && c < cols && r >= 0 && r < rows;
      if (inside) continue;
      const pos = cartToIso(c, r);
      const grass = ((c + r) % 2 === 0) ? 0x7cb342 : 0x689f38;
      drawIsoDiamond(g, centerX + pos.x, centerY + pos.y, TILE_WIDTH, TILE_HEIGHT, grass, 0.4);
    }
  }

  // Inner grid
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const pos = cartToIso(c, r);
      const tx = centerX + pos.x;
      const ty = centerY + pos.y;
      const key = `${c}_${r}`;
      const hasBldg = slotLookup.has(key);
      const kind = tileKinds[r]?.[c] ?? 'void';

      if (kind === 'void') {
        continue;
      }

      if (kind === 'blocked') {
        drawBlockedTile(g, tx, ty);
        continue;
      }

      if (hasBldg) {
        // Occupied lot: slightly denser green to anchor building footprints.
        const grass = ((Math.floor(c / 2) + Math.floor(r / 2)) % 2 === 0) ? 0x9ece63 : 0x94c55c;
        drawIsoDiamond(g, tx, ty, TILE_WIDTH, TILE_HEIGHT, grass);
        drawIsoDiamond(g, tx, ty, TILE_WIDTH - 6, TILE_HEIGHT - 3, 0xffffff, 0.08);
      } else {
        // Empty lot checker look similar to city-builder block textures.
        const grass = ((Math.floor(c / 2) + Math.floor(r / 2)) % 2 === 0) ? 0xb2df76 : 0xa7d66f;
        drawIsoDiamond(g, tx, ty, TILE_WIDTH, TILE_HEIGHT, grass, 0.96);
        drawIsoDiamond(g, tx, ty, TILE_WIDTH - 10, TILE_HEIGHT - 6, 0xffffff, 0.07);
      }
    }
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

interface IsometricMapProps {
  onSlotClick: (slotIndex: number, store: GameStore | null) => void;
}

export function IsometricMap({ onSlotClick }: IsometricMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean; x: number; y: number;
    name: string; level: number; detail: string;
  }>({ visible: false, x: 0, y: 0, name: '', level: 0, detail: '' });

  const stores = useGameStore(s => s.stores);
  const currentRegion = useGameStore(s => s.currentRegion);
  const storesRef = useRef(stores);
  const currentRegionRef = useRef(currentRegion);
  const buildAnimRef = useRef<Map<number, number>>(new Map());

  useEffect(() => { storesRef.current = stores; }, [stores]);
  useEffect(() => { currentRegionRef.current = currentRegion; }, [currentRegion]);

  const panRef = useRef({ x: 0, y: 0, dragging: false, startX: 0, startY: 0, panStartX: 0, panStartY: 0 });
  const zoomRef = useRef(1);

  const getRegionStores = useCallback(() =>
    storesRef.current.filter(s => s.region === currentRegionRef.current), []);

  const region = REGIONS.find(r => r.id === currentRegion);
  const totalSlots = region?.storeSlots || 16;

  const layoutRef = useRef<MapLayout | null>(null);
  const layoutRegionRef = useRef('');
  if (layoutRegionRef.current !== currentRegion) {
    layoutRef.current = generateMapLayout(totalSlots);
    layoutRegionRef.current = currentRegion;
  }
  const layout = layoutRef.current!;

  useEffect(() => {
    let app: Application;
    let isDestroyed = false;

    const init = async () => {
      app = new Application();
      const width = containerRef.current?.clientWidth || 800;
      const height = containerRef.current?.clientHeight || 600;

      await app.init({
        width, height, backgroundAlpha: 0, antialias: true,
        resolution: Math.min(window.devicePixelRatio, 2), autoDensity: true
      });

      if (isDestroyed) { app.destroy(true); return; }
      appRef.current = app;
      if (containerRef.current && app.canvas)
        containerRef.current.appendChild(app.canvas as HTMLCanvasElement);

      const worldContainer = new Container();
      app.stage.addChild(worldContainer);

      const groundLayer = new Container();
      const buildingLayer = new Container();
      worldContainer.addChild(groundLayer);
      worldContainer.addChild(buildingLayer);

      const centerX = width / 2;
      const centerY = height / 2 - 60;

      app.stage.eventMode = 'static';
      app.stage.hitArea = app.screen;

      let hoveredSlot = -1;

      const slotLookup = new Map<string, number>();
      for (const sp of layout.slotPositions) slotLookup.set(`${sp.col}_${sp.row}`, sp.slotIndex);

      const redraw = () => {
        let gfx = groundLayer.children[0] as Graphics;
        if (!gfx) {
          gfx = new Graphics();
          groundLayer.addChild(gfx);
        } else {
          gfx.clear();
        }

        let bldgGfx = buildingLayer.children[0] as Graphics;
        if (!bldgGfx) {
          bldgGfx = new Graphics();
          buildingLayer.addChild(bldgGfx);
        } else {
          bldgGfx.clear();
        }

        const zoom = zoomRef.current;
        worldContainer.scale.set(zoom);
        worldContainer.position.set(
          width / 2 + panRef.current.x - centerX * zoom,
          height / 2 + panRef.current.y - centerY * zoom
        );

        const regionStores = getRegionStores();
        const pulse = (Math.sin(app.ticker.lastTime * 0.008) + 1) * 0.5;
        drawGround(gfx, centerX, centerY, layout.cols, layout.rows, layout.tileKinds, slotLookup);

        // Draw order sorted by depth
        const items: { c: number; r: number; depth: number; slotIdx: number }[] = [];
        for (let r = 0; r < layout.rows; r++) {
          for (let c = 0; c < layout.cols; c++) {
            const key = `${c}_${r}`;
            if (slotLookup.has(key)) items.push({ c, r, depth: r + c, slotIdx: slotLookup.get(key)! });
          }
        }
        items.sort((a, b) => a.depth - b.depth);

        for (const item of items) {
          const pos = cartToIso(item.c, item.r);
          const tx = centerX + pos.x;
          const ty = centerY + pos.y;
          const slotIdx = item.slotIdx;
          const store = regionStores.find(s => s.slotIndex === slotIdx);

          if (store) {
            let anim = buildAnimRef.current.get(slotIdx) ?? 1;
            if (anim < 1) { anim = Math.min(1, anim + 0.03); buildAnimRef.current.set(slotIdx, anim); }

            // Draw shadow / ground contact
            drawGroundContact(gfx, tx, ty + TILE_HEIGHT / 2, 1, 0.2 * anim);

            // Draw vector building
            drawIsometricBuilding(bldgGfx, tx, ty + TILE_HEIGHT / 2, store.definitionId, store.level);
          } else if (layout.tileKinds[item.r]?.[item.c] === 'buildable') {
            drawPurchasableLot(gfx, tx, ty, pulse);
          }

          if (hoveredSlot === slotIdx) {
            drawIsoDiamond(gfx, tx, ty, TILE_WIDTH - 6, TILE_HEIGHT - 3, 0xffffff, 0.15);
          }
        }
      };

      // === INPUT ===
      app.stage.on('pointerdown', (e: FederatedPointerEvent) => {
        panRef.current.dragging = true;
        panRef.current.startX = e.global.x; panRef.current.startY = e.global.y;
        panRef.current.panStartX = panRef.current.x; panRef.current.panStartY = panRef.current.y;
      });

      app.stage.on('pointermove', (e: FederatedPointerEvent) => {
        const zoom = zoomRef.current;
        if (panRef.current.dragging) {
          panRef.current.x = panRef.current.panStartX + (e.global.x - panRef.current.startX);
          panRef.current.y = panRef.current.panStartY + (e.global.y - panRef.current.startY);
          return;
        }
        const wx = (e.global.x - width / 2 - panRef.current.x) / zoom + centerX;
        const wy = (e.global.y - height / 2 - panRef.current.y) / zoom + centerY;
        const { col, row } = isoToCart(wx - centerX, wy - centerY);

        if (col >= 0 && col < layout.cols && row >= 0 && row < layout.rows) {
          const key = `${col}_${row}`;
          if (slotLookup.has(key)) {
            hoveredSlot = slotLookup.get(key)!;
            const st = getRegionStores().find(s => s.slotIndex === hoveredSlot);
            if (st) {
              const def = STORE_DEFINITIONS.find((d: StoreDefinition) => d.id === st.definitionId);
              if (def) setTooltip({ visible: true, x: e.global.x, y: e.global.y, name: def.name, level: st.level, detail: def.description });
            } else {
              setTooltip({ visible: true, x: e.global.x, y: e.global.y, name: 'Lote Vazio', level: 0, detail: 'Clique para construir!' });
            }
          } else {
            hoveredSlot = -1;
            setTooltip(t => ({ ...t, visible: false }));
          }
        } else {
          hoveredSlot = -1;
          setTooltip(t => ({ ...t, visible: false }));
        }
      });

      app.stage.on('pointerup', (e: FederatedPointerEvent) => {
        const drag = panRef.current.dragging;
        const dist = Math.abs(e.global.x - panRef.current.startX) + Math.abs(e.global.y - panRef.current.startY);
        panRef.current.dragging = false;
        if (drag && dist < 8) {
          const zoom = zoomRef.current;
          const wx = (e.global.x - width / 2 - panRef.current.x) / zoom + centerX;
          const wy = (e.global.y - height / 2 - panRef.current.y) / zoom + centerY;
          const { col, row } = isoToCart(wx - centerX, wy - centerY);
          const key = `${col}_${row}`;
          if (col >= 0 && col < layout.cols && row >= 0 && row < layout.rows && slotLookup.has(key)) {
            const idx = slotLookup.get(key)!;
            const st = getRegionStores().find(s => s.slotIndex === idx) || null;
            if (!st) buildAnimRef.current.set(idx, 0);
            onSlotClick(idx, st);
          }
        }
      });

      app.stage.on('pointerleave', () => {
        panRef.current.dragging = false; hoveredSlot = -1;
        setTooltip(t => ({ ...t, visible: false }));
      });

      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        zoomRef.current = Math.min(2.5, Math.max(0.3, zoomRef.current + (e.deltaY > 0 ? -0.1 : 0.1)));
      };
      containerRef.current?.addEventListener('wheel', onWheel, { passive: false });

      app.ticker.add(() => redraw());
      return () => { containerRef.current?.removeEventListener('wheel', onWheel); };
    };

    const p = init();
    return () => {
      isDestroyed = true;
      p.then(c => { if (c) c(); if (app) app.destroy({ removeView: true }, { children: true, texture: true }); });
    };
  }, [currentRegion, totalSlots, layout, getRegionStores, onSlotClick]);

  const handleZoom = (d: number) => {
    zoomRef.current = Math.min(2.5, Math.max(0.3, zoomRef.current + d * 0.15));
  };

  return (
    <div className="iso-map-wrapper" ref={containerRef}>
      <div className="iso-map-hud">
        <div className="iso-hud-pill"><span className="hud-emoji">📍</span>{region?.name || 'Região'}</div>
        <div className="iso-hud-pill"><span className="hud-emoji">🏢</span>{stores.filter(s => s.region === currentRegion).length}/{totalSlots} lotes</div>
      </div>
      <div className="iso-zoom-controls">
        <button className="iso-zoom-btn" onClick={() => handleZoom(1)}>+</button>
        <button className="iso-zoom-btn" onClick={() => handleZoom(-1)}>−</button>
      </div>
      <div className={`iso-tooltip ${tooltip.visible ? 'visible' : ''}`} style={{ left: tooltip.x, top: tooltip.y }}>
        <div className="iso-tooltip-name">
          {tooltip.name}
          {tooltip.level > 0 && <span className="iso-tooltip-level">Nv. {tooltip.level}</span>}
        </div>
        <div className="iso-tooltip-detail">{tooltip.detail}</div>
      </div>
    </div>
  );
}
