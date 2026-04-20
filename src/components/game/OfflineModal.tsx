import { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { CurrencyDisplay } from '../ui/CurrencyDisplay';
import { useAdsStore } from '@/store/useAdsStore';
import { formatTime } from '@/engine/utils';
import { useI18n } from '@/i18n/useI18n';
import type { OfflineEarnings } from '@/types';
import './OfflineModal.css';

interface OfflineModalProps {
  earnings: OfflineEarnings;
  onClose: () => void;
}

export function OfflineModal({ earnings, onClose }: OfflineModalProps) {
  const { t } = useI18n();
  const addMoney = useGameStore(state => state.addMoney);
  const showRewardedAd = useAdsStore(state => state.showRewardedAd);
  const [isProcessingAd, setIsProcessingAd] = useState(false);

  const handleClaimNormal = () => {
    addMoney(earnings.normalEarnings);
    onClose();
  };

  const handleClaimDouble = async () => {
    setIsProcessingAd(true);
    const success = await showRewardedAd('offline_double');
    setIsProcessingAd(false);

    if (success) {
      addMoney(earnings.doubleEarnings);
      onClose();
    } else {
      alert(t('offline.adError'));
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={handleClaimNormal} // Se fechar, só ganha normal
      title={t('offline.title')}
      disableBackdropClick
    >
      <div className="tf-offline-content">
        <div className="tf-offline-icon">😴</div>
        
        <p className="tf-offline-text">
          {t('offline.message', { time: formatTime(earnings.secondsAway) })}
        </p>
        
        {earnings.cappedAtMax && (
          <div className="tf-offline-warning">
            {t('offline.capWarning')}
          </div>
        )}

        <div className="tf-offline-earnings">
          <CurrencyDisplay value={earnings.normalEarnings} size="lg" icon="💸" />
        </div>

        <div className="tf-offline-actions">
          <Button 
            variant="success" 
            size="lg" 
            fullWidth 
            onClick={handleClaimDouble}
            disabled={isProcessingAd}
          >
            {isProcessingAd ? t('offline.loading') : t('offline.double')}
            <br/>
            <span style={{fontSize: '0.8rem'}}>{t('offline.total', { amount: earnings.doubleEarnings.toExponential(2) })}</span>
          </Button>

          <Button 
            variant="secondary" 
            fullWidth 
            onClick={handleClaimNormal}
            disabled={isProcessingAd}
            className="tf-offline-normal-btn"
          >
            {t('offline.normal')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
