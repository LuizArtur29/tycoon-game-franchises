import { useNavigate } from 'react-router-dom';
import { REGIONS } from '@/data/regions';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/i18n/useI18n';
import './RegionView.css';

export function RegionView() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const onlyRegion = REGIONS[0];

  return (
    <div className="tf-region-page">
      <header className="tf-region-header">
        <Button variant="secondary" onClick={() => navigate('/')}>⬅ {t('region.back')}</Button>
        <h1>{t('region.title')}</h1>
        <div className="tf-region-money">🌐 {t('region.singleMode')}</div>
      </header>

      <div className="tf-region-content">
        <p className="tf-region-subtitle">{t('region.subtitle')}</p>

        <div className="tf-region-grid">
          <div className="tf-region-card current">
            <div className="tf-region-icon">🏙️</div>
            <h2 className="tf-region-name">{onlyRegion?.name ?? 'Megalopolis'}</h2>
            <div className="tf-region-bonus">{t('region.urbanLevel', { tier: (onlyRegion?.tier ?? 'national').toUpperCase() })}</div>
            <div className="tf-region-action">
              <span className="tf-region-active-badge">{t('region.active')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
