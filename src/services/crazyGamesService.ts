type CrazyAdType = 'midgame' | 'rewarded';

interface CrazyAdCallbacks {
  adFinished?: () => void;
  adError?: (error: unknown) => void;
  adStarted?: () => void;
}

interface CrazyGamesSDK {
  ad?: {
    requestAd?: (type: CrazyAdType, callbacks: CrazyAdCallbacks) => void;
  };
  game?: {
    gameplayStart?: () => void;
    gameplayStop?: () => void;
    happytime?: () => void;
  };
}

declare global {
  interface Window {
    CrazyGames?: {
      SDK?: CrazyGamesSDK;
    };
  }
}

function getSdk(): CrazyGamesSDK | null {
  if (typeof window === 'undefined') return null;
  return window.CrazyGames?.SDK ?? null;
}

export const crazyGamesService = {
  isAvailable(): boolean {
    return Boolean(getSdk());
  },

  requestRewardedAd(): Promise<boolean> | null {
    const sdk = getSdk();
    const requestAd = sdk?.ad?.requestAd;
    if (!requestAd) return null;

    return new Promise<boolean>((resolve) => {
      try {
        requestAd('rewarded', {
          adFinished: () => resolve(true),
          adError: () => resolve(false),
        });
      } catch {
        resolve(false);
      }
    });
  },

  gameplayStart(): void {
    getSdk()?.game?.gameplayStart?.();
  },

  gameplayStop(): void {
    getSdk()?.game?.gameplayStop?.();
  },

  happytime(): void {
    getSdk()?.game?.happytime?.();
  },
};