import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAdsStore } from '@/store/useAdsStore';
import Decimal from 'break_infinity.js';
import './AngelInvestor.css';

export function AngelInvestor() {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: '50%' });
  const [key, setKey] = useState(0); // para resetar a animacao
  const addMoney = useGameStore(state => state.addMoney);
  const getMoneyPerSecond = useGameStore(state => state.getMoneyPerSecond);
  const showRewardedAd = useAdsStore(state => state.showRewardedAd);

  useEffect(() => {
    // Para efeito de DEMO do MVP, ele spawna a cada 20 segundos! 
    // Num jogo final seria 3-5 minutos (180000ms a 300000ms).
    const interval = setInterval(() => {
      setIsVisible(true);
      setPosition({ top: `${15 + Math.random() * 70}%` });
      setKey(k => k + 1); // Força re-render da animação
      
      // Some após 10 segundos cruzando a tela se não clicado
      setTimeout(() => setIsVisible(false), 10000);
      
    }, 20000); 

    return () => clearInterval(interval);
  }, []);

  const handleClick = async () => {
    setIsVisible(false);
    const success = await showRewardedAd('angel_investor');
    if (success) {
      // Recompensa: Dinheiro equivalente a 5 minutos (300 segundos) de produção
      const mps = getMoneyPerSecond();
      
      // Evitar dar 0 se ele acabou de iniciar. Mínimo = dinheiro para comprar a primeira loja.
      const baseInject = mps.gt(1) ? mps.times(300) : new Decimal(100);
      
      alert(`Investidor Anjo aplicou fundos!\n+$${baseInject.toExponential(2)}`);
      addMoney(baseInject);
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      key={key}
      className="tf-angel-investor" 
      style={{ top: position.top }}
      onClick={handleClick}
      title="Aportes Adicionais (Clique!)"
    >
      <div className="tf-angel-icon">💼</div>
    </div>
  );
}
