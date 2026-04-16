import { useEffect, useState } from 'react';
import { useAdsStore } from '@/store/useAdsStore';
import { Button } from './Button';
import './AdModal.css';

export function AdModal() {
  const isAdPlaying = useAdsStore(state => state.isAdPlaying);
  const resolveAd = useAdsStore(state => state.resolveAd);
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    if (isAdPlaying) {
      setTimeLeft(5);
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
        <h2>Patrocinador da Corporação</h2>
        <p>Aguarde o encerramento do bloco comercial para receber sua recompensa...</p>
        
        <div className="tf-ad-timer">
          {timeLeft > 0 ? `00:0${timeLeft}` : 'Pronto!'}
        </div>

        <div className="tf-ad-actions">
           <Button variant="danger" onClick={() => resolveAd(false)}>
             Fechar & Perder Recompensa
           </Button>
           <Button 
             variant={timeLeft === 0 ? 'success' : 'secondary'} 
             disabled={timeLeft > 0}
             onClick={() => resolveAd(true)}
           >
             Resgatar Recompensa
           </Button>
        </div>
      </div>
    </div>
  );
}
