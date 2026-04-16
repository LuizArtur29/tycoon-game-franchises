import { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { CurrencyDisplay } from '../ui/CurrencyDisplay';
import { useAdsStore } from '@/store/useAdsStore';
import { formatTime } from '@/engine/utils';
import type { OfflineEarnings } from '@/types';
import './OfflineModal.css';

interface OfflineModalProps {
  earnings: OfflineEarnings;
  onClose: () => void;
}

export function OfflineModal({ earnings, onClose }: OfflineModalProps) {
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
      // Falhou ad, avisa e não fecha
      alert('Não foi possível carregar o anúncio. Tente novamente mais tarde.');
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={handleClaimNormal} // Se fechar, só ganha normal
      title="Você voltou!"
      disableBackdropClick
    >
      <div className="tf-offline-content">
        <div className="tf-offline-icon">😴</div>
        
        <p className="tf-offline-text">
          Enquanto você esteve fora por <strong>{formatTime(earnings.secondsAway)}</strong>, 
          suas franquias continuaram trabalhando...
        </p>
        
        {earnings.cappedAtMax && (
          <div className="tf-offline-warning">
            Seus gerentes ficaram cansados e pararam de produzir! O tempo máximo offline é de 24 horas.
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
            {isProcessingAd ? 'CARREGANDO...' : 'ASSISTIR AD PARA DOBRAR! 📺'}
            <br/>
            <span style={{fontSize: '0.8rem'}}>Total: {earnings.doubleEarnings.toExponential(2)}</span>
          </Button>

          <Button 
            variant="secondary" 
            fullWidth 
            onClick={handleClaimNormal}
            disabled={isProcessingAd}
            className="tf-offline-normal-btn"
          >
            Coletar Normal
          </Button>
        </div>
      </div>
    </Modal>
  );
}
