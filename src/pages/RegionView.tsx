import { useNavigate } from 'react-router-dom';
import { REGIONS } from '@/data/regions';
import { Button } from '@/components/ui/Button';
import './RegionView.css';

export function RegionView() {
  const navigate = useNavigate();
  const onlyRegion = REGIONS[0];

  return (
    <div className="tf-region-page">
      <header className="tf-region-header">
        <Button variant="secondary" onClick={() => navigate('/')}>⬅ VOLTAR</Button>
        <h1>Mapa Atual</h1>
        <div className="tf-region-money">🌐 Modo de mapa único</div>
      </header>

      <div className="tf-region-content">
        <p className="tf-region-subtitle">No momento, toda a progressão acontece em um único mapa. Novas regiões chegarão em futuras expansões.</p>

        <div className="tf-region-grid">
          <div className="tf-region-card current">
            <div className="tf-region-icon">🏙️</div>
            <h2 className="tf-region-name">{onlyRegion?.name ?? 'Megalopolis'}</h2>
            <div className="tf-region-bonus">Nível Urbano: {(onlyRegion?.tier ?? 'national').toUpperCase()}</div>
            <div className="tf-region-action">
              <span className="tf-region-active-badge">MAPA ÚNICO ATIVO</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
