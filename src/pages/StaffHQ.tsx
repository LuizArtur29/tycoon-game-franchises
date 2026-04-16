import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaffStore } from '@/store/useStaffStore';
import { useGameStore } from '@/store/useGameStore';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { BALANCE, RARITY_COLORS, RARITY_LABELS } from '@/data/balancing';
import { STORE_DEFINITIONS } from '@/data/stores';
import type { Executive } from '@/types';
import './StaffHQ.css';

export function StaffHQ() {
  const navigate = useNavigate();
  const { executives, pityCounter, recruit, canSpin, assignToStore, unassignFromStore } = useStaffStore();
  const userStores = useGameStore(state => state.stores);
  const recalculateMoneyPerSecond = useGameStore(state => state.recalculateMoneyPerSecond);
  
  const [assigningExec, setAssigningExec] = useState<Executive | null>(null);
  
  const handleSpin = () => {
    const result = recruit();
    if (result) {
      // Futuramente: Adicionar animação modal mostrando quem tirou
      alert(`Você recrutou: ${result.executive.name} (${RARITY_LABELS[result.executive.rarity]})`);
    } else {
      alert("Volte amanhã para mais spins (ou assista um ad!)");
    }
  };

  const handleAssign = (storeId: string) => {
    if (assigningExec) {
      assignToStore(assigningExec.id, storeId);
      recalculateMoneyPerSecond();
      setAssigningExec(null);
    }
  };

  const handleUnassign = (execId: string) => {
    unassignFromStore(execId);
    recalculateMoneyPerSecond();
  };

  const pityProgress = (pityCounter / BALANCE.GACHA_PITY_THRESHOLD) * 100;

  // Lojas compradas disponiveis para designação com os nomes do definition
  const uniquePurchasedStoreGroups = userStores.reduce((acc, store) => {
    const def = STORE_DEFINITIONS.find(d => d.id === store.definitionId);
    if (!acc.some(s => s.definitionId === store.definitionId)) {
      acc.push({ ...store, name: def?.name || store.definitionId });
    }
    return acc;
  }, [] as any[]);

  return (
    <div className="tf-staff-page">
      <header className="tf-staff-header">
        <Button variant="secondary" onClick={() => navigate('/')}>
          ⬅ VOLTAR AO MAPA
        </Button>
        <h1>Sede Geral (RH)</h1>
        <div></div>
      </header>

      <div className="tf-staff-content">
        
        {/* LADO ESQUERDO: GACHA / RECRUTAMENTO */}
        <section className="tf-gacha-section">
          <h2>Recrutamento</h2>
          <div className="tf-gacha-machine">
            <div className="tf-gacha-display">
              🎰
            </div>
            
            <Button 
              variant="primary" 
              size="lg" 
              onClick={handleSpin}
              disabled={!canSpin()}
            >
              GIRO DIÁRIO GRÁTIS
            </Button>
            
            <Button variant="secondary" onClick={() => {
              // Simulador de AD para tiro extra da nossa Store
              alert("Integração SDK Ads: Assistir vídeo para giro extra");
            }}>
              GIRO EXTRA (AD 📺)
            </Button>

            <div className="tf-pity-container">
              <span className="tf-pity-label">Garantia de Diretor+ em:</span>
              <ProgressBar 
                progress={pityProgress} 
                height={16} 
                color="#8e44ad" 
                label={`${pityCounter} / ${BALANCE.GACHA_PITY_THRESHOLD}`} 
              />
            </div>
          </div>
        </section>

        {/* LADO DIREITO: LISTA DE CONTRATADOS */}
        <section className="tf-staff-list-section">
          <h2>Seus Executivos ({executives.length})</h2>
          
          {executives.length === 0 ? (
            <p className="tf-empty-staff">Você ainda não recrutou ninguém. Faça o seu primeiro giro!</p>
          ) : (
            <div className="tf-staff-grid">
              {executives.map(exec => (
                <div 
                  key={exec.id} 
                  className="tf-staff-card"
                  style={{ borderColor: RARITY_COLORS[exec.rarity] }}
                >
                  <div className="tf-staff-card-header" style={{ backgroundColor: RARITY_COLORS[exec.rarity] }}>
                    <span className="tf-staff-portrait">{exec.portrait}</span>
                    <span className="tf-staff-rarity">{RARITY_LABELS[exec.rarity]}</span>
                  </div>
                  <div className="tf-staff-card-body">
                    <span className="tf-staff-name">{exec.name}</span>
                    
                    <div className="tf-staff-effect">
                      {exec.multiplier.type === 'profit' && `+${exec.multiplier.value * 100}% Lucro`}
                      {exec.multiplier.type === 'cost_reduction' && `-${exec.multiplier.value * 100}% Custos`}
                      {exec.multiplier.type === 'click' && `+${exec.multiplier.value * 100}% Clique`}
                      {exec.multiplier.type === 'global' && `+${exec.multiplier.value * 100}% Global`}
                    </div>

                    <div className="tf-staff-assignment">
                       {exec.assignedStoreId 
                          ? `Atuando na id: ${exec.assignedStoreId.substring(0,8)}...` 
                          : 'Na Sede (Ocioso)'}
                    </div>

                    {!exec.assignedStoreId ? (
                      <Button size="sm" variant="success" fullWidth onClick={() => setAssigningExec(exec)}>
                        Designar Loja
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" fullWidth onClick={() => handleUnassign(exec.id)}>
                        Desvincular
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      {assigningExec && (
        <Modal 
          isOpen={true} 
          onClose={() => setAssigningExec(null)}
          title={`Designar ${assigningExec.name}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
             <p>Escolha uma franquia para atribuir o efeito de <b>
               {assigningExec.multiplier.type === 'profit' && `+${assigningExec.multiplier.value * 100}% Lucro`}
               {assigningExec.multiplier.type === 'cost_reduction' && `-${assigningExec.multiplier.value * 100}% Custos`}
             </b>.</p>
             
             {uniquePurchasedStoreGroups.length === 0 ? (
               <p style={{fontStyle: 'italic', color: '#7f8c8d'}}>Você não tem nenhuma rede de loja aberta ainda.</p>
             ) : (
               uniquePurchasedStoreGroups.map(store => (
                 <Button 
                   key={store.id} 
                   variant="primary" 
                   onClick={() => handleAssign(store.id)}
                 >
                   → Despachar para: {store.name} (Lvl {store.level})
                 </Button>
               ))
             )}
          </div>
        </Modal>
      )}
    </div>
  );
}
