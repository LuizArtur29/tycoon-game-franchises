import { useNavigate } from 'react-router-dom';
import { useMarketStore } from '@/store/useMarketStore';
import { useGameStore } from '@/store/useGameStore';
import { Button } from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { audioEngine } from '@/engine/audioEngine';
import { useI18n } from '@/i18n/useI18n';
import Decimal from 'break_infinity.js';
import './StockMarket.css';

export function StockMarket() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { stocks, buyStock, sellStock, getOwnedShares, playerPortfolio } = useMarketStore();
  const { money, addMoney } = useGameStore();
  const currentMoney = new Decimal(money);

  const handleBuy = (stockId: string, price: number) => {
    const amount = 1; // Simplificando para 1 por clique inicialmente
    const cost = new Decimal(price).times(amount);

    if (currentMoney.gte(cost)) {
      addMoney(cost.negated());
      buyStock(stockId, amount, price);
      audioEngine.playSFX('click');
    }
  };

  const handleSell = (stockId: string, price: number) => {
    const owned = getOwnedShares(stockId);
    if (owned > 0) {
      const profit = new Decimal(price).times(1);
      addMoney(profit);
      sellStock(stockId, 1);
      audioEngine.playSFX('purchase');
    }
  };

  return (
    <div className="tf-stock-page">
      <header className="tf-stock-header">
        <Button variant="secondary" onClick={() => navigate('/')}>⬅ {t('stocks.back')}</Button>
        <h1>{t('stocks.title')}</h1>
        <div className="tf-stock-money">
          {t('stocks.balance')} <CurrencyDisplay value={currentMoney} size="md" />
        </div>
      </header>

      <div className="tf-stock-content">
        <div className="tf-stock-grid">
          {stocks.map(stock => {
            const owned = getOwnedShares(stock.id);
            const prevPrice = stock.history[stock.history.length - 2] || stock.currentPrice;
            const trend = ((stock.currentPrice - prevPrice) / prevPrice) * 100;
            const isUp = trend >= 0;

            const portfolioItem = playerPortfolio.find(p => p.stockId === stock.id);
            const profitLoss = portfolioItem ? (stock.currentPrice - portfolioItem.avgBuyPrice) * owned : 0;

            return (
              <div key={stock.id} className="tf-stock-card">
                <div className="tf-stock-main-info">
                  <div className="tf-stock-symbol">{stock.symbol}</div>
                  <div className="tf-stock-name">{stock.companyName}</div>
                </div>

                <div className="tf-stock-price-section">
                  <div className="tf-stock-price">${stock.currentPrice.toFixed(2)}</div>
                  <div className={`tf-stock-trend ${isUp ? 'up' : 'down'}`}>
                    {isUp ? '▲' : '▼'} {Math.abs(trend).toFixed(2)}%
                  </div>
                </div>

                <div className="tf-stock-portfolio">
                  <span>{t('stocks.yourShares')} <strong>{owned}</strong></span>
                  {owned > 0 && (
                    <span className={profitLoss >= 0 ? 'success-text' : 'danger-text'}>
                      {t('stocks.pl')} ${profitLoss.toFixed(2)}
                    </span>
                  )}
                </div>

                <div className="tf-stock-actions">
                  <Button 
                    variant={currentMoney.gte(stock.currentPrice) ? 'primary' : 'secondary'} 
                    size="sm" 
                    disabled={currentMoney.lt(stock.currentPrice)}
                    onClick={() => handleBuy(stock.id, stock.currentPrice)}
                  >
                    {t('stocks.buy')}
                  </Button>
                  <Button 
                    variant="danger" 
                    size="sm" 
                    disabled={owned <= 0}
                    onClick={() => handleSell(stock.id, stock.currentPrice)}
                  >
                    {t('stocks.sell')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="tf-stock-disclaimer">
        ⚠️ {t('stocks.disclaimer')}
      </div>
    </div>
  );
}
