import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '@/services/apiService';
import type { LeaderboardEntry } from '@/services/apiService';
import { useGameStore } from '@/store/useGameStore';
import { Button } from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { useI18n } from '@/i18n/useI18n';
import Decimal from 'break_infinity.js';
import './Leaderboard.css';

export function LeaderboardPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const playerTotalEarned = useGameStore(state => state.totalMoneyEarned);
  
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const isPlayerEntry = (username: string) => username === '__player__' || username === 'Você' || username === 'You';

  useEffect(() => {
    // Fetch do Spring Boot Fake Layer
    ApiService.fetchTopFranchises().then(data => {
      // Injeta p/ comparação
      
      const hydratedBoard = data.map(entry => {
        if (isPlayerEntry(entry.username)) {
           return { ...entry, username: '__player__', totalCompanyValue: playerTotalEarned };
        }
        return entry;
      });

      // Ordenação pura p/ demonstração
      hydratedBoard.sort((a, b) => new Decimal(b.totalCompanyValue).cmp(new Decimal(a.totalCompanyValue)));
      
      hydratedBoard.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      setBoard(hydratedBoard);
      setLoading(false);
    });
  }, [playerTotalEarned]);

  return (
    <div className="tf-leaderboard-page">
      <header className="tf-leaderboard-header">
        <Button variant="secondary" onClick={() => navigate('/')}>⬅ {t('leaderboard.back')}</Button>
        <h1>{t('leaderboard.title')}</h1>
        <div></div>
      </header>

      <div className="tf-leaderboard-content">
         <div className="tf-leaderboard-panel">
            <h2>{t('leaderboard.heading')}</h2>

            {loading ? (
              <p>{t('leaderboard.loading')}</p>
            ) : (
              <table className="tf-leaderboard-table">
                 <thead>
                   <tr>
                     <th>{t('leaderboard.rank')}</th>
                     <th>{t('leaderboard.corp')}</th>
                     <th>{t('leaderboard.valuation')}</th>
                   </tr>
                 </thead>
                 <tbody>
                    {board.map(entry => (
                       <tr key={entry.username} className={isPlayerEntry(entry.username) ? 'player-row' : ''}>
                         <td>#{entry.rank}</td>
                         <td>{isPlayerEntry(entry.username) ? t('leaderboard.you') : entry.username}</td>
                         <td><CurrencyDisplay value={new Decimal(entry.totalCompanyValue)} size="sm" /></td>
                       </tr>
                    ))}
                 </tbody>
              </table>
            )}
         </div>
      </div>
    </div>
  );
}
