import { useEffect, useState } from 'react';
import { useAdsStore } from '@/store/useAdsStore';
import { useI18n } from '@/i18n/useI18n';
import { Button } from './Button';
import './AdModal.css';

export function AdModal() {
  const { t } = useI18n();
  const isAdPlaying = useAdsStore(state => state.isAdPlaying);
  const resolveAd = useAdsStore(state => state.resolveAd);
  const [timeLeft, setTimeLeft] = useState(5);

  const handleResolve = (success: boolean) => {
    setTimeLeft(5);
    resolveAd(success);
  };

  useEffect(() => {
    if (isAdPlaying) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isAdPlaying]);

  if (!isAdPlaying) return null;

  return (
    <div className="tf-ad-overlay">
      <div className="tf-ad-content">
        <div className="tf-ad-indicator">AD</div>
        <h2>{t('ad.title')}</h2>
        <p>{t('ad.wait')}</p>

        <div className="tf-ad-timer">
          {timeLeft > 0 ? `00:0${timeLeft}` : t('ad.ready')}
        </div>

        <div className="tf-ad-actions">
           <Button variant="danger" onClick={() => handleResolve(false)}>
             {t('ad.closeLose')}
           </Button>
           <Button 
             variant={timeLeft === 0 ? 'success' : 'secondary'} 
             disabled={timeLeft > 0}
              onClick={() => handleResolve(true)}
           >
             {t('ad.claim')}
           </Button>
        </div>
      </div>
    </div>
  );
}
