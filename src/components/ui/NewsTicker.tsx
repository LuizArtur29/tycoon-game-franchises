import { useMarketStore } from '@/store/useMarketStore';
import './NewsTicker.css';

/**
 * Componente de Ticker de Notícias (Breaking News)
 * Exibe o evento de mercado atual ou mensagens aleatórias de mercado.
 */
export function NewsTicker() {
  const activeEvent = useMarketStore(state => state.activeEvent);

  const getTickerContent = () => {
    if (activeEvent) {
      return (
        <div className={`tf-ticker-message active-${activeEvent.type}`}>
          <span className="tf-ticker-label">BREAKING NEWS:</span> {activeEvent.title} - {activeEvent.description}
        </div>
      );
    }
    return (
      <div className="tf-ticker-message">
        <span className="tf-ticker-label">WALL STREET ADVISORY:</span> Mercado operando em estabilidade... Diversifique sua franquia hoje!
      </div>
    );
  };

  return (
    <div className="tf-news-ticker">
      <div className="tf-ticker-track">
        {getTickerContent()}
        {getTickerContent()} {/* Duplicado para animação contínua */}
      </div>
    </div>
  );
}
