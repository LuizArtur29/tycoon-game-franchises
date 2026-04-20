import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaffStore } from '@/store/useStaffStore';
import { useGameStore } from '@/store/useGameStore';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { BALANCE, RARITY_COLORS, RARITY_LABELS } from '@/data/balancing';
import { STORE_DEFINITIONS } from '@/data/stores';
import { useI18n } from '@/i18n/useI18n';
import type { Executive } from '@/types';
import './StaffHQ.css';

interface PurchasedStoreGroup {
  id: string;
  definitionId: string;
  level: number;
  name: string;
}

export function StaffHQ() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { executives, pityCounter, recruit, canSpin, assignToStore, unassignFromStore } = useStaffStore();
  const userStores = useGameStore(state => state.stores);
  const recalculateMoneyPerSecond = useGameStore(state => state.recalculateMoneyPerSecond);
  
  const [assigningExec, setAssigningExec] = useState<Executive | null>(null);

  const formatExecEffect = (exec: Executive) => {
    const percent = (exec.multiplier.value * 100).toFixed(0);
    if (exec.multiplier.type === 'profit') return t('staff.effect.profit', { percent });
    if (exec.multiplier.type === 'cost_reduction') return t('staff.effect.cost', { percent });
    if (exec.multiplier.type === 'click') return t('staff.effect.click', { percent });
    return t('staff.effect.global', { percent });
  };

  const getRarityLabel = (rarity: string) => {
    const key = `staff.rarity.${rarity}`;
    return t(key, undefined, RARITY_LABELS[rarity]);
  };

  const handleSpin = () => {
    const result = recruit();
    if (result) {
      alert(t('staff.recruitAlert', {
        name: result.executive.name,
        rarity: getRarityLabel(result.executive.rarity),
      }));
    } else {
      alert(t('staff.noSpin'));
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
  const uniquePurchasedStoreGroups = userStores.reduce<PurchasedStoreGroup[]>((acc, store) => {
    const def = STORE_DEFINITIONS.find(d => d.id === store.definitionId);
    if (!acc.some(s => s.definitionId === store.definitionId)) {
      acc.push({ ...store, name: def?.name || store.definitionId });
    }
    return acc;
  }, []);

  return (
    <div className="tf-staff-page">
      <header className="tf-staff-header">
        <Button variant="secondary" onClick={() => navigate('/')}>
          ⬅ {t('staff.back')}
        </Button>
        <h1>{t('staff.title')}</h1>
        <div></div>
      </header>

      <div className="tf-staff-content">
        
        {/* LADO ESQUERDO: GACHA / RECRUTAMENTO */}
        <section className="tf-gacha-section">
          <h2>{t('staff.recruitment')}</h2>
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
              {t('staff.freeSpin')}
            </Button>
            
            <Button variant="secondary" onClick={() => {
              alert(t('staff.extraSpinAlert'));
            }}>
              {t('staff.extraSpin')}
            </Button>

            <div className="tf-pity-container">
              <span className="tf-pity-label">{t('staff.pity')}</span>
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
          <h2>{t('staff.yourExecs', { count: executives.length })}</h2>

          {executives.length === 0 ? (
            <p className="tf-empty-staff">{t('staff.empty')}</p>
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
                    <span className="tf-staff-rarity">{getRarityLabel(exec.rarity)}</span>
                  </div>
                  <div className="tf-staff-card-body">
                    <span className="tf-staff-name">{exec.name}</span>
                    
                    <div className="tf-staff-effect">
                      {formatExecEffect(exec)}
                    </div>

                    <div className="tf-staff-assignment">
                       {exec.assignedStoreId 
                          ? t('staff.assigned', { id: exec.assignedStoreId.substring(0, 8) })
                          : t('staff.idle')}
                    </div>

                    {!exec.assignedStoreId ? (
                      <Button size="sm" variant="success" fullWidth onClick={() => setAssigningExec(exec)}>
                        {t('staff.assign')}
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" fullWidth onClick={() => handleUnassign(exec.id)}>
                        {t('staff.unassign')}
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
          title={t('staff.assignTitle', { name: assigningExec.name })}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
             <p>{t('staff.assignDescription', { effect: formatExecEffect(assigningExec) })}</p>

             {uniquePurchasedStoreGroups.length === 0 ? (
               <p style={{fontStyle: 'italic', color: '#7f8c8d'}}>{t('staff.noStores')}</p>
             ) : (
               uniquePurchasedStoreGroups.map(store => (
                 <Button 
                   key={store.id} 
                   variant="primary" 
                   onClick={() => handleAssign(store.id)}
                 >
                   → {t('staff.dispatch', { name: t(`store.${store.definitionId}.name`, undefined, store.name), level: store.level })}
                 </Button>
               ))
             )}
          </div>
        </Modal>
      )}
    </div>
  );
}
