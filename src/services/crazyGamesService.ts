type CrazyAdType = 'midgame' | 'rewarded';

interface CrazyAdCallbacks {
  adFinished?: () => void;
  adError?: (error: unknown) => void;
  adStarted?: () => void;
}

interface CrazyGamesSDK {
  init?: () => Promise<void> | void;
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
  try {
    return window.CrazyGames?.SDK ?? null;
  } catch (error) {
    console.warn('[CrazyGames] SDK access skipped:', error);
    return null;
  }
}

function safeSdkCall<T>(fn: () => T): T | null {
  try {
    return fn();
  } catch (error) {
    // In local/dev the SDK script can exist but not be initialized.
    console.warn('[CrazyGames] SDK call skipped:', error);
    return null;
  }
}

const isCrazyGamesHost =
  typeof window !== 'undefined' &&
  /(^|\.)crazygames\.com$/i.test(window.location.hostname);
const shouldUseCrazyGamesSdk =
  import.meta.env.PROD &&
  (isCrazyGamesHost || import.meta.env.VITE_FORCE_CRAZYGAMES_SDK === 'true');
let sdkReady = false;
let sdkInitPromise: Promise<boolean> | null = null;

function ensureSdkInitialized(): Promise<boolean> {
  if (!shouldUseCrazyGamesSdk) return Promise.resolve(false);
  if (sdkReady) return Promise.resolve(true);
  if (sdkInitPromise) return sdkInitPromise;

  const sdk = getSdk();
  if (!sdk) return Promise.resolve(false);

  if (!sdk.init) {
    sdkReady = true;
    return Promise.resolve(true);
  }

  sdkInitPromise = new Promise<boolean>((resolve) => {
    const initResult = safeSdkCall(() => sdk.init?.());
    if (initResult === null) {
      resolve(false);
      return;
    }

    if (initResult instanceof Promise) {
      initResult
        .then(() => {
          sdkReady = true;
          resolve(true);
        })
        .catch((error) => {
          console.warn('[CrazyGames] SDK init failed:', error);
          resolve(false);
        });
      return;
    }

    sdkReady = true;
    resolve(true);
  });

  return sdkInitPromise;
}

export const crazyGamesService = {
  isAvailable(): boolean {
    return shouldUseCrazyGamesSdk && Boolean(getSdk());
  },

  requestRewardedAd(): Promise<boolean> | null {
    if (!shouldUseCrazyGamesSdk) return null;
    const sdk = getSdk();
    const requestAd = sdk?.ad?.requestAd;
    if (!requestAd) return null;

    return new Promise<boolean>((resolve) => {
      ensureSdkInitialized().then((ready) => {
        if (!ready) {
          resolve(false);
          return;
        }

        const result = safeSdkCall(() => {
          requestAd('rewarded', {
            adFinished: () => resolve(true),
            adError: () => resolve(false),
          });
        });

        if (result === null) {
          resolve(false);
        }
      });
    });
  },

  gameplayStart(): void {
    if (!shouldUseCrazyGamesSdk) return;
    ensureSdkInitialized().then((ready) => {
      if (!ready) return;
      safeSdkCall(() => getSdk()?.game?.gameplayStart?.());
    });
  },

  gameplayStop(): void {
    if (!shouldUseCrazyGamesSdk) return;
    ensureSdkInitialized().then((ready) => {
      if (!ready) return;
      safeSdkCall(() => getSdk()?.game?.gameplayStop?.());
    });
  },

  happytime(): void {
    if (!shouldUseCrazyGamesSdk) return;
    ensureSdkInitialized().then((ready) => {
      if (!ready) return;
      safeSdkCall(() => getSdk()?.game?.happytime?.());
    });
  },
};