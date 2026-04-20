import Decimal from 'break_infinity.js';

export interface PlayerCloudSave {
  userId: string;
  money: string; // Serialized break_infinity
  totalMoneyEarned: string;
  goldenShares: number;
  lastTickTimestamp: number;
  // TODO: Add metrics for backend validation
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  totalCompanyValue: string;
}

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true';
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

/**
 * API Service handles communication with the Spring Boot Backend.
 * Toggles between mock data and real HTTP requests based on .env
 */
export const ApiService = {
  
  /**
   * Sincroniza o save ao banco PostgreSQL do backend.
   */
  async syncCloudSave(saveData: PlayerCloudSave): Promise<boolean> {
    if (USE_MOCK) {
      console.log('[API MOCK POST] /players/sync', saveData);
      return new Promise((resolve) => setTimeout(() => resolve(true), 500));
    }

    try {
      const response = await fetch(`${BASE_URL}/players/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData)
      });
      return response.ok;
    } catch (error) {
      console.error('Cloud save failed:', error);
      return false;
    }
  },

  /**
   * Puxa a classificação mundial
   */
  async fetchTopFranchises(): Promise<LeaderboardEntry[]> {
    if (USE_MOCK) {
       console.log('[API MOCK GET] /leaderboard/top');
       return new Promise((resolve) => {
         setTimeout(() => {
           resolve([
             { rank: 1, username: "MagnataDoSertao", totalCompanyValue: new Decimal('1e18').toString() },
             { rank: 2, username: "DonaMartaBurgers", totalCompanyValue: new Decimal('5e15').toString() },
             { rank: 3, username: "CoronelZe", totalCompanyValue: new Decimal('2e14').toString() },
             { rank: 4, username: "__player__", totalCompanyValue: "0" },
             { rank: 5, username: "StartupFariaLima", totalCompanyValue: new Decimal('9e9').toString() },
           ]);
         }, 1000);
       });
    }

    try {
      const response = await fetch(`${BASE_URL}/leaderboard/top`);
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error('Fetch leaderboard failed:', error);
      return [];
    }
  }
};

