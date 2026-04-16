
import { useGameStore } from '@/store/useGameStore';
import { STORE_DEFINITIONS } from '@/data/stores';
import { StoreCard } from './StoreCard';

export function StoreList() {
  const currentRegion = useGameStore(state => state.currentRegion);

  // Filter stores available for the current region
  // For MVP we might just show all unlocked region stores, but let's stick to current Region
  const visibleStoreDefs = STORE_DEFINITIONS.filter(d => d.region === currentRegion);

  return (
    <div className="tf-store-list">
      {visibleStoreDefs.map(def => (
        <StoreCard key={def.id} definitionId={def.id} />
      ))}
    </div>
  );
}
