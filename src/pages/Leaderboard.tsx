import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '@/services/apiService';
import type { LeaderboardEntry } from '@/services/apiService';
import { useGameStore } from '@/store/useGameStore';
import { Button } from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import Decimal from 'break_infinity.js';
import './Leaderboard.css';

export function LeaderboardPage() {
  const navigate = useNavigate();
  const playerTotalEarned = useGameStore(state => state.totalMoneyEarned);
  
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch do Spring Boot Fake Layer
    ApiService.fetchTopFranchises().then(data => {
      // Injeta p/ comparação
      
      const hydratedBoard = data.map(entry => {
        if (entry.username === "Você") {
           return { ...entry, totalCompanyValue: playerTotalEarned };
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
        <Button variant="secondary" onClick={() => navigate('/')}>⬅ VOLTAR</Button>
        <h1>Mercado Global de Ações</h1>
        <div></div>
      </header>

      <div className="tf-leaderboard-content">
         <div className="tf-leaderboard-panel">
            <h2>As Maiores Franquias do País</h2>
            
            {loading ? (
              <p>Conectando à Bolsa de Valores (Spring Boot)...</p>
            ) : (
              <table className="tf-leaderboard-table">
                 <thead>
                   <tr>
                     <th>Rank</th>
                     <th>Corporação</th>
                     <th>Valuation ($)</th>
                   </tr>
                 </thead>
                 <tbody>
                    {board.map(entry => (
                       <tr key={entry.username} className={entry.username === 'Você' ? 'player-row' : ''}>
                         <td>#{entry.rank}</td>
                         <td>{entry.username}</td>
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
