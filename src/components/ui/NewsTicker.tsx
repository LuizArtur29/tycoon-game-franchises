import { useMarketStore } from '@/store/useMarketStore';
import { useI18n } from '@/i18n/useI18n';
import './NewsTicker.css';

/**
 * Componente de Ticker de Notícias (Breaking News)
 * Exibe o evento de mercado atual ou mensagens aleatórias de mercado.
 */
export function NewsTicker() {
  const { t } = useI18n();
  const activeEvent = useMarketStore(state => state.activeEvent);

  const getTickerContent = () => {
    if (activeEvent) {
      return (
        <div className={`tf-ticker-message active-${activeEvent.type}`}>
          <span className="tf-ticker-label">{t('news.breaking')}</span>{' '}
          {t(`event.${activeEvent.id}.title`, undefined, activeEvent.title)} - {t(`event.${activeEvent.id}.description`, undefined, activeEvent.description)}
        </div>
      );
    }
    return (
      <div className="tf-ticker-message">
        <span className="tf-ticker-label">{t('news.defaultLabel')}</span> {t('news.defaultMessage')}
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
