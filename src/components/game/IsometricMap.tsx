import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Application, Graphics, Container, FederatedPointerEvent, Sprite, Assets, Texture } from 'pixi.js';
import { useGameStore } from '@/store/useGameStore';
import { STORE_DEFINITIONS } from '@/data/stores';
import { REGIONS } from '@/data/regions';
import mapJson from '@/data/mapa.json';
import { MAP_LOTES_SLOT_POSITIONS, MAP_LOTES_TILE_KEY_SET, MAP_LOTES_TOTAL_SLOTS, MAP_LOTES_SLOT_SET } from '@/data/mapSlots';
import { useI18n } from '@/i18n/useI18n';

import lojaBrancaImg from '@/assets/loja_branca.png';
import lojaBrancaFrenteImg from '@/assets/loja_branca_frente.png';
import logaVermelhaFrenteImg from '@/assets/loga_vermelha_frente.png';
import lojaVermelhaImg from '@/assets/loja_vermelha.png';
import mapaVisualImg from '@/assets/mapa_visual.png';
import type { GameStore, StoreDefinition } from '@/types';
import './IsometricMap.css';

// ============================================
// ISOMETRIC CONFIG
// ============================================

const TILE_WIDTH = 128;
const TILE_HEIGHT = 64;
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 1.8;
const WHEEL_ZOOM_STEP = 0.06;
const BUTTON_ZOOM_STEP = 0.1;

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

// A camada de lotes e lida via mapSlots (fonte unica de verdade).

if (!BASE_LAYER?.data || !BASE_LAYER.width || !BASE_LAYER.height) {
  throw new Error('mapa.json invalido: camada base nao encontrada.');
}

const BASE_LAYER_DATA = BASE_LAYER.data as number[];
const BASE_LAYER_WIDTH = BASE_LAYER.width as number;
const BASE_LAYER_HEIGHT = BASE_LAYER.height as number;

const GRID_COLS = BASE_LAYER_WIDTH;
const GRID_ROWS = BASE_LAYER_HEIGHT;

const STORE_SPRITE_POOL = [
  lojaBrancaImg,
  lojaBrancaFrenteImg,
  logaVermelhaFrenteImg,
  lojaVermelhaImg,
];

const PLAYER_SPRITE_SEED_KEY = 'tgf_player_sprite_seed';

function getOrCreatePlayerSpriteSeed(): string {
  if (typeof window === 'undefined') return 'player_seed_default';
  const existingSeed = window.localStorage.getItem(PLAYER_SPRITE_SEED_KEY);
  if (existingSeed) return existingSeed;

  const generatedSeed = `player_${Math.random().toString(36).slice(2, 12)}`;
  window.localStorage.setItem(PLAYER_SPRITE_SEED_KEY, generatedSeed);
  return generatedSeed;
}

function hashToPositiveInt(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

type TileKind = 'void' | 'buildable' | 'blocked';

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

interface PanOffset {
  x: number;
  y: number;
}

function generateMapLayout(): MapLayout {
  const tileKinds: TileKind[][] = [];

  for (let r = 0; r < GRID_ROWS; r++) {
    const rowKinds: TileKind[] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      let kind: TileKind = 'void';
      const baseGid = BASE_LAYER_DATA[r * GRID_COLS + c] ?? 0;
      const tileKey = `${c}_${r}`;

      if (MAP_LOTES_TILE_KEY_SET.has(tileKey)) {
        kind = 'buildable';
      } else if (baseGid !== 0) {
        kind = 'blocked';
      }

      rowKinds.push(kind);
    }
    tileKinds.push(rowKinds);
  }

  return {
    cols: GRID_COLS,
    rows: GRID_ROWS,
    tileKinds,
    slotPositions: MAP_LOTES_SLOT_POSITIONS,
  };
}

function cartToIso(col: number, row: number) {
  return {
    x: (col - row) * (TILE_WIDTH / 2),
    y: (col + row) * (TILE_HEIGHT / 2) + (TILE_HEIGHT / 2),
  };
}

function isoToCart(isoX: number, isoY: number) {
  const normalizedY = isoY - (TILE_HEIGHT / 2);
  const col = (isoX / (TILE_WIDTH / 2) + normalizedY / (TILE_HEIGHT / 2)) / 2;
  const row = (normalizedY / (TILE_HEIGHT / 2) - isoX / (TILE_WIDTH / 2)) / 2;
  return { col: Math.floor(col), row: Math.floor(row) };
}

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function calculateInitialPan(layout: MapLayout): PanOffset {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (let r = 0; r < layout.rows; r++) {
    for (let c = 0; c < layout.cols; c++) {
      if (layout.tileKinds[r][c] === 'void') continue;
      const pos = cartToIso(c, r);
      minX = Math.min(minX, pos.x);
      maxX = Math.max(maxX, pos.x);
      minY = Math.min(minY, pos.y);
      maxY = Math.max(maxY, pos.y);
    }
  }

  if (!Number.isFinite(minX) || !Number.isFinite(maxX) || !Number.isFinite(minY) || !Number.isFinite(maxY)) {
    return { x: 0, y: 0 };
  }

  return {
    x: -((minX + maxX) / 2),
    y: -((minY + maxY) / 2),
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

function drawGround() {
  // FUNÇÃO VAZIA!
  // O PixiJS não vai desenhar mais nenhum losango base transparente.
  // A lógica de cliques continuará funcionando graças à matemática.
}

// ============================================
// MAIN COMPONENT
// ============================================

interface IsometricMapProps {
  onSlotClick: (slotIndex: number, store: GameStore | null) => void;
}

export function IsometricMap({ onSlotClick }: IsometricMapProps) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean; x: number; y: number;
    name: string; level: number; detail: string;
  }>({ visible: false, x: 0, y: 0, name: '', level: 0, detail: '' });

  const stores = useGameStore(s => s.stores);
  const currentRegion = useGameStore(s => s.currentRegion);
  const storesRef = useRef(stores);
  const currentRegionRef = useRef(currentRegion);
  const buildAnimRef = useRef<Map<number, number>>(new Map());
  const playerSpriteSeedRef = useRef(getOrCreatePlayerSpriteSeed());

  useEffect(() => { storesRef.current = stores; }, [stores]);
  useEffect(() => { currentRegionRef.current = currentRegion; }, [currentRegion]);

  const panRef = useRef({ x: 0, y: 0, dragging: false, startX: 0, startY: 0, panStartX: 0, panStartY: 0 });
  const zoomRef = useRef(1);

  const getRegionStores = useCallback(() =>
    storesRef.current.filter(s => s.region === currentRegionRef.current), []);

  const region = REGIONS.find(r => r.id === currentRegion);
  const totalSlots = MAP_LOTES_TOTAL_SLOTS;
  const usedValidSlots = stores.filter(
    s => s.region === currentRegion && MAP_LOTES_SLOT_SET.has(s.slotIndex)
  ).length;

  const layout = useMemo(() => generateMapLayout(), []);

  useEffect(() => {
    let isCancelled = false; // A nossa Trava de Segurança
    const app = new Application();
    const mountNode = containerRef.current;
    let handleWheel: ((e: WheelEvent) => void) | null = null;

    const setupPixi = async () => {
      if (!mountNode) return;
      const width = mountNode.clientWidth || 800;
      const height = mountNode.clientHeight || 600;

      await app.init({
        width, height, backgroundAlpha: 0, antialias: true,
        resolution: Math.min(window.devicePixelRatio, 2), autoDensity: true
      });

      // Se o React recarregou a página enquanto o PixiJS iniciava, aborte!
      if (isCancelled) {
        app.destroy(true);
        return;
      }

      // Injeta o canvas de forma nativa e segura
      mountNode.appendChild(app.canvas as HTMLCanvasElement);

      const worldContainer = new Container();
      app.stage.addChild(worldContainer);

      const centerX = width / 2;
      const centerY = height / 2 - 60;
      const initialPan = calculateInitialPan(layout);
      panRef.current.x = initialPan.x;
      panRef.current.y = initialPan.y;
      panRef.current.panStartX = initialPan.x;
      panRef.current.panStartY = initialPan.y;

      // === IMPORTAÇÃO DO FUNDO DO TILED ===
      try {
        const bgTex = await Assets.load(mapaVisualImg);
        if (isCancelled) return; // Aborta se desmontou durante o download

        const bgSprite = new Sprite(bgTex);
        bgSprite.anchor.set(0.5, 0);

        // 🛑 CALIBRAÇÃO DO MAPA AQUI:
        // Como o seu mapa mudou, os eixos X e Y precisam ser calibrados.
        // Se a arte estiver para a direita, diminua o X. Se estiver para baixo, diminua o Y.
        bgSprite.x = centerX + 370;
        bgSprite.y = centerY - 33;

        worldContainer.addChildAt(bgSprite, 0);
      } catch (e) {
        console.error("Erro ao carregar a imagem do mapa:", e);
      }

      // Carrega todos os sprites de loja disponiveis para variar visualmente os lotes.
      const lojaTextures: Texture[] = (
        await Promise.all(
          STORE_SPRITE_POOL.map(async (spriteUrl) => {
            try {
              return await Assets.load(spriteUrl);
            } catch (e) {
              console.error(`Erro ao carregar sprite de loja: ${spriteUrl}`, e);
              return null;
            }
          })
        )
      ).filter((tex): tex is Texture => tex !== null);
      if (isCancelled) return;

      const groundLayer = new Container();
      const buildingLayer = new Container();
      buildingLayer.sortableChildren = true;
      worldContainer.addChild(groundLayer);
      worldContainer.addChild(buildingLayer);

      const buildingSprites = new Map<number, Sprite>();

      // Distribuicao fixa por usuario+regiao+slot para manter o mesmo visual entre sessoes.
      const getDeterministicTextureForSlot = (slotIndex: number): Texture | undefined => {
        if (!lojaTextures.length) return undefined;

        const regionId = currentRegionRef.current;
        const hashInput = `${playerSpriteSeedRef.current}:${regionId}:${slotIndex}`;
        const textureIndex = hashToPositiveInt(hashInput) % lojaTextures.length;
        return lojaTextures[textureIndex];
      };

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

        const zoom = zoomRef.current;
        worldContainer.scale.set(zoom);
        worldContainer.position.set(
          width / 2 + panRef.current.x - centerX * zoom,
          height / 2 + panRef.current.y - centerY * zoom
        );

        const regionStores = getRegionStores();

        drawGround();

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

            const existingSprite = buildingSprites.get(slotIdx);
            if (!existingSprite) {
              const storeTexture = getDeterministicTextureForSlot(slotIdx);
              if (!storeTexture) continue;
              const sprite = new Sprite(storeTexture);
              sprite.anchor.set(0.5, 1);
              buildingLayer.addChild(sprite);
              buildingSprites.set(slotIdx, sprite);
            }

            const sprite = buildingSprites.get(slotIdx);

            if (sprite) {
              sprite.visible = true;
              sprite.x = tx + 3;
              sprite.y = ty + (TILE_HEIGHT / 2) - 8;
              sprite.zIndex = item.depth;
              sprite.scale.set(1, anim);
            }

          } else {
            const sprite = buildingSprites.get(slotIdx);
            if (sprite) sprite.visible = false;
          }

          if (hoveredSlot === slotIdx) {
            // O Losango Guia! Use ele para calibrar o bgSprite.x e bgSprite.y
            drawIsoDiamond(gfx, tx, ty, TILE_WIDTH - 6, TILE_HEIGHT - 3, 0xffffff, 0.25);
          }
        }
      };

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
              if (def) setTooltip({
                visible: true,
                x: e.global.x,
                y: e.global.y,
                name: t(`store.${def.id}.name`, undefined, def.name),
                level: st.level,
                detail: t(`store.${def.id}.description`, undefined, def.description),
              });
            } else {
              setTooltip({ visible: true, x: e.global.x, y: e.global.y, name: t('map.tooltip.empty'), level: 0, detail: t('map.tooltip.build') });
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

      handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        const direction = e.deltaY > 0 ? -1 : 1;
        const intensity = Math.min(1, Math.abs(e.deltaY) / 120);
        const delta = direction * WHEEL_ZOOM_STEP * intensity;
        zoomRef.current = clampZoom(zoomRef.current + delta);
      };

      mountNode.addEventListener('wheel', handleWheel, { passive: false });
      app.ticker.add(() => redraw());
    };

    setupPixi();

    // Limpeza super agressiva e garantida
    return () => {
      isCancelled = true; // Impede promises pela metade de continuarem
      if (handleWheel && mountNode) {
        mountNode.removeEventListener('wheel', handleWheel);
      }
      try {
        // Arranca o canvas do HTML
        if (app.canvas && app.canvas.parentNode) {
          app.canvas.parentNode.removeChild(app.canvas);
        }
        app.destroy(true, { children: true, texture: true });
      } catch {
        // fail silently
      }
    };
  }, [currentRegion, layout, getRegionStores, onSlotClick, t]);

  const handleZoom = (d: number) => {
    zoomRef.current = clampZoom(zoomRef.current + d * BUTTON_ZOOM_STEP);
  };

  return (
    <div className="iso-map-wrapper" ref={containerRef}>
      <div className="iso-map-hud">
        <div className="iso-hud-pill"><span className="hud-emoji">📍</span>{region?.name || t('map.regionFallback')}</div>
        <div className="iso-hud-pill"><span className="hud-emoji">🏢</span>{t('map.lots', { used: usedValidSlots, total: totalSlots })}</div>
      </div>
      <div className="iso-zoom-controls">
        <button className="iso-zoom-btn" onClick={() => handleZoom(1)}>+</button>
        <button className="iso-zoom-btn" onClick={() => handleZoom(-1)}>−</button>
      </div>
      <div className={`iso-tooltip ${tooltip.visible ? 'visible' : ''}`} style={{ left: tooltip.x, top: tooltip.y }}>
        <div className="iso-tooltip-name">
          {tooltip.name}
          {tooltip.level > 0 && <span className="iso-tooltip-level">{t('map.tooltip.level', { level: tooltip.level })}</span>}
        </div>
        <div className="iso-tooltip-detail">{tooltip.detail}</div>
      </div>
    </div>
  );
}