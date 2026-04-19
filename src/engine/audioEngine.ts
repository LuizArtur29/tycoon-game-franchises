import { Howl } from 'howler';

/**
 * Singleton Audio Engine for Tycoon Franchises.
 * Allows playing sound effects (SFX) and background music (BGM).
 * High-quality audio implementation for high-retention web games.
 */
class AudioEngine {
  private sounds: Record<string, Howl> = {};
  private currentBGM: Howl | null = null;
  private muted: boolean = false;
  private failedSoundKeys = new Set<string>();
  private bgmFailed = false;
  private audioContext: AudioContext | null = null;
  private fallbackBgmTimer: number | null = null;

  constructor() {
    // Definimos os sons principais. O usuário deve colocar os arquivos em /public/audio/
    this.sounds = {
      click: this.createSound('click', '/audio/click.mp3', 0.5),
      purchase: this.createSound('purchase', '/audio/purchase.mp3', 0.6),
      unlock: this.createSound('unlock', '/audio/unlock.mp3', 0.7),
      gacha: this.createSound('gacha', '/audio/gacha.mp3', 0.6),
      prestige: this.createSound('prestige', '/audio/prestige.mp3', 0.8),
    };

    // Música de fundo
    this.currentBGM = new Howl({
      src: ['/audio/bgm_main.mp3'],
      loop: true,
      volume: 0.3,
      autoplay: false,
      preload: true,
      onloaderror: () => {
        this.bgmFailed = true;
      },
      onplayerror: () => {
        this.bgmFailed = true;
      },
    });
  }

  private createSound(key: string, src: string, volume: number): Howl {
    return new Howl({
      src: [src],
      volume,
      preload: true,
      onloaderror: () => {
        this.failedSoundKeys.add(key);
      },
      onplayerror: () => {
        this.failedSoundKeys.add(key);
      },
    });
  }

  private ensureAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.audioContext = new AudioCtx();
    }

    const context = this.audioContext;
    if (!context) return null;

    if (context.state === 'suspended') {
      context.resume().catch(() => undefined);
    }
    return context;
  }

  private playTone(freq: number, durationMs: number, type: OscillatorType = 'sine', volume = 0.03) {
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  }

  private playFallbackSFX(key: string) {
    if (key === 'click') this.playTone(640, 60, 'square', 0.025);
    else if (key === 'purchase') {
      this.playTone(520, 80, 'triangle', 0.028);
      window.setTimeout(() => this.playTone(780, 120, 'triangle', 0.028), 70);
    } else if (key === 'unlock') {
      this.playTone(440, 90, 'triangle', 0.03);
      window.setTimeout(() => this.playTone(660, 90, 'triangle', 0.03), 80);
      window.setTimeout(() => this.playTone(880, 130, 'triangle', 0.03), 160);
    } else if (key === 'gacha') {
      this.playTone(360, 90, 'sawtooth', 0.026);
      window.setTimeout(() => this.playTone(900, 150, 'triangle', 0.03), 120);
    } else if (key === 'prestige') {
      this.playTone(330, 120, 'triangle', 0.03);
      window.setTimeout(() => this.playTone(494, 120, 'triangle', 0.03), 120);
      window.setTimeout(() => this.playTone(659, 200, 'triangle', 0.03), 240);
    }
  }

  private startFallbackBGM() {
    if (this.fallbackBgmTimer !== null) return;
    this.playTone(220, 900, 'sine', 0.012);
    this.fallbackBgmTimer = window.setInterval(() => {
      if (this.muted) return;
      this.playTone(220, 900, 'sine', 0.012);
      window.setTimeout(() => this.playTone(277, 750, 'sine', 0.01), 320);
      window.setTimeout(() => this.playTone(330, 650, 'sine', 0.008), 620);
    }, 1800);
  }

  private stopFallbackBGM() {
    if (this.fallbackBgmTimer !== null) {
      window.clearInterval(this.fallbackBgmTimer);
      this.fallbackBgmTimer = null;
    }
  }

  /**
   * Toca um efeito sonoro curto.
   * @param key Identificador do som
   * @param randomizePitch Se true, altera levemente a velocidade para não ficar repetitivo
   */
  public playSFX(key: string, randomizePitch: boolean = true) {
    if (this.muted) return;
    const sound = this.sounds[key];
    if (sound && !this.failedSoundKeys.has(key)) {
      if (randomizePitch) {
        sound.rate(0.9 + Math.random() * 0.2); // Varia de 0.9x a 1.1x
      }
      sound.play();
      return;
    }
    this.playFallbackSFX(key);
  }

  /**
   * Inicia a música de fundo.
   */
  public startBGM() {
    if (this.muted) return;
    if (!this.currentBGM || this.bgmFailed) {
      this.startFallbackBGM();
      return;
    }
    if (!this.currentBGM.playing()) {
      this.currentBGM.play();
    }
  }

  /**
   * Para a música de fundo.
   */
  public stopBGM() {
    this.stopFallbackBGM();
    if (this.currentBGM) {
      this.currentBGM.stop();
    }
  }

  /**
   * Alterna entre mudo e ativo.
   */
  public toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopFallbackBGM();
      Object.values(this.sounds).forEach(s => s.mute(true));
      if (this.currentBGM) this.currentBGM.mute(true);
    } else {
      Object.values(this.sounds).forEach(s => s.mute(false));
      if (this.currentBGM) this.currentBGM.mute(false);
    }
    return this.muted;
  }

  public isMuted() {
    return this.muted;
  }
}

// Exportamos uma instância única para uso em todo o app
export const audioEngine = new AudioEngine();
