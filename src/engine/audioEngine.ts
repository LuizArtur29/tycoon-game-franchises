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

  constructor() {
    // Definimos os sons principais. O usuário deve colocar os arquivos em /public/audio/
    this.sounds = {
      'click': new Howl({ src: ['/audio/click.mp3'], volume: 0.5, preload: false }),
      'purchase': new Howl({ src: ['/audio/purchase.mp3'], volume: 0.6, preload: false }),
      'unlock': new Howl({ src: ['/audio/unlock.mp3'], volume: 0.7, preload: false }),
      'gacha': new Howl({ src: ['/audio/gacha.mp3'], volume: 0.6, preload: false }),
      'prestige': new Howl({ src: ['/audio/prestige.mp3'], volume: 0.8, preload: false }),
    };

    // Música de fundo
    this.currentBGM = new Howl({
      src: ['/audio/bgm_main.mp3'],
      loop: true,
      volume: 0.3,
      autoplay: false,
    });
  }

  /**
   * Toca um efeito sonoro curto.
   * @param key Identificador do som
   * @param randomizePitch Se true, altera levemente a velocidade para não ficar repetitivo
   */
  public playSFX(key: string, randomizePitch: boolean = true) {
    if (this.muted) return;
    const sound = this.sounds[key];
    if (sound) {
      if (randomizePitch) {
        sound.rate(0.9 + Math.random() * 0.2); // Varia de 0.9x a 1.1x
      }
      sound.play();
    }
  }

  /**
   * Inicia a música de fundo.
   */
  public startBGM() {
    if (this.muted || !this.currentBGM) return;
    if (!this.currentBGM.playing()) {
      this.currentBGM.play();
    }
  }

  /**
   * Para a música de fundo.
   */
  public stopBGM() {
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
