import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MarketEvent, Stock, OwnedStock } from '@/types';

interface MarketStoreState {
  // Eventos
  activeEvent: MarketEvent | null;
  lastEventAt: number;
  
  // Ações
  stocks: Stock[];
  playerPortfolio: OwnedStock[];

  // Actions
  tickStocks: () => void;
  randomizeEvent: () => void;
  buyStock: (stockId: string, amount: number, currentPrice: number) => boolean;
  sellStock: (stockId: string, amount: number) => boolean;
  getOwnedShares: (stockId: string) => number;
}

const INITIAL_STOCKS: Stock[] = [
  { id: '1', symbol: 'GLB', companyName: 'Global Foods Inc', currentPrice: 150, history: [150], volatility: 0.05 },
  { id: '2', symbol: 'TEC', companyName: 'Tech Nova Corp', currentPrice: 420, history: [420], volatility: 0.12 },
  { id: '3', symbol: 'NRG', companyName: 'Neo Energy Group', currentPrice: 85, history: [85], volatility: 0.08 },
  { id: '4', symbol: 'LOG', companyName: 'Logistics Pro', currentPrice: 210, history: [210], volatility: 0.06 },
  { id: '5', symbol: 'REX', companyName: 'Retail Express', currentPrice: 55, history: [55], volatility: 0.15 },
];

const POSSIBLE_EVENTS: Partial<MarketEvent>[] = [
  { id: 'e1', title: 'Boom Econômico!', description: 'O mercado está aquecido! Todos os lucros subiram 20%.', multiplier: 1.2, type: 'boom', durationMs: 120000 },
  { id: 'e2', title: 'Recessão Global', description: 'O cinto apertou. Queda de 30% na produção nacional.', multiplier: 0.7, type: 'recession', durationMs: 180000 },
  { id: 'e3', title: 'Febre Tech!', description: 'Novos chips revolucionários! Ganho dobrado na produção.', multiplier: 2.0, type: 'sector_boost', durationMs: 60000 },
  { id: 'e4', title: 'Crise de Logística', description: 'Greve nos portos. Redução de 40% no faturamento.', multiplier: 0.6, type: 'recession', durationMs: 90000 },
];

export const useMarketStore = create<MarketStoreState>()(
  persist(
    (set, get) => ({
      activeEvent: null,
      lastEventAt: Date.now(),
      stocks: INITIAL_STOCKS,
      playerPortfolio: [],

      tickStocks: () => {
        const { stocks } = get();
        const updatedStocks = stocks.map(stock => {
          // Random Walk: P' = P * (1 + (volatility * (random - 0.5) * 2))
          const change = stock.volatility * (Math.random() - 0.48); // Slight upward bias
          let newPrice = stock.currentPrice * (1 + change);
          
          // Preço mínimo de 1 centavo
          if (newPrice < 0.01) newPrice = 1.0; 

          const newHistory = [...stock.history.slice(-19), newPrice];
          return { ...stock, currentPrice: newPrice, history: newHistory };
        });

        set({ stocks: updatedStocks });

        // Verifica expiração de evento
        const { activeEvent } = get();
        if (activeEvent && activeEvent.startedAt) {
           if (Date.now() > activeEvent.startedAt + activeEvent.durationMs) {
              set({ activeEvent: null });
           }
        }
      },

      randomizeEvent: () => {
        const { activeEvent } = get();
        if (activeEvent) return; // Não sorteia se já tem um ativo

        const randomIdx = Math.floor(Math.random() * POSSIBLE_EVENTS.length);
        const eventTemplate = POSSIBLE_EVENTS[randomIdx];
        
        set({
          activeEvent: {
            ...eventTemplate,
            startedAt: Date.now(),
          } as MarketEvent,
          lastEventAt: Date.now(),
        });
      },

      getOwnedShares: (stockId: string) => {
        const owned = get().playerPortfolio.find(p => p.stockId === stockId);
        return owned ? owned.shares : 0;
      },

      buyStock: (stockId: string, amount: number, currentPrice: number) => {
        const { playerPortfolio } = get();
        const existing = playerPortfolio.find(p => p.stockId === stockId);
        
        if (existing) {
          const newShares = existing.shares + amount;
          const newAvg = (existing.avgBuyPrice * existing.shares + currentPrice * amount) / newShares;
          set({
            playerPortfolio: playerPortfolio.map(p => 
              p.stockId === stockId ? { ...p, shares: newShares, avgBuyPrice: newAvg } : p
            )
          });
        } else {
          set({
            playerPortfolio: [...playerPortfolio, { stockId, shares: amount, avgBuyPrice: currentPrice }]
          });
        }
        return true;
      },

      sellStock: (stockId: string, amount: number) => {
        const { playerPortfolio } = get();
        const existing = playerPortfolio.find(p => p.stockId === stockId);
        
        if (!existing || existing.shares < amount) return false;

        const newShares = existing.shares - amount;
        if (newShares <= 0) {
          set({ playerPortfolio: playerPortfolio.filter(p => p.stockId !== stockId) });
        } else {
          set({
            playerPortfolio: playerPortfolio.map(p => 
              p.stockId === stockId ? { ...p, shares: newShares } : p
            )
          });
        }
        return true;
      },
    }),
    {
      name: 'tycoon-franchises-market',
    }
  )
);
