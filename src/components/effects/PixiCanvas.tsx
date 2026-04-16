import { useEffect, useRef } from 'react';
import { Application, Sprite, Texture, Graphics } from 'pixi.js';

export function PixiCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let app: Application;
    let isDestroyed = false;
    let fallbackTexture: Texture;

    const initPixi = async () => {
      app = new Application();
      // Inicialização do PixiJS v8
      await app.init({ backgroundAlpha: 0, resizeTo: window });
      
      if (isDestroyed) {
        app.destroy(true);
        return;
      }
      
      if (containerRef.current && app.canvas) {
        containerRef.current.appendChild(app.canvas as HTMLCanvasElement);
      }

      // Criação de uma textura simples de moeda caso não tenhamos assets (.png)
      const g = new Graphics();
      g.circle(0, 0, 15);
      g.fill({ color: 0xf1c40f }); // Amarelo
      g.circle(0, 0, 10);
      g.stroke({ color: 0xf39c12, width: 2 });
      
      // Converte o gráfico vetorial numa textura rápida para instanciar milhares de vezes
      fallbackTexture = app.renderer.generateTexture(g);

      // Estado interno do canvas
      const coinParticles: { sprite: Sprite; vx: number; vy: number; alphaDrop: number }[] = [];
      const confettiParticles: { graphics: Graphics; vx: number; vy: number; vr: number; alphaDrop: number }[] = [];

      const confettiColors = [0xff4d4d, 0x4dff4d, 0x4d4dff, 0xffff4d, 0xff4dff, 0x4dffff];

      // Game Ticker
      app.ticker.add((time) => {
        const delta = time.deltaTime;
        
        // Moedas
        for (let i = coinParticles.length - 1; i >= 0; i--) {
          const p = coinParticles[i];
          p.vy += 0.5 * delta;
          p.sprite.x += p.vx * delta;
          p.sprite.y += p.vy * delta;
          p.sprite.alpha -= p.alphaDrop * delta;
          
          if (p.sprite.alpha <= 0 || p.sprite.y > window.innerHeight + 50) {
            app.stage.removeChild(p.sprite);
            p.sprite.destroy();
            coinParticles.splice(i, 1);
          }
        }

        // Confetes
        for (let i = confettiParticles.length - 1; i >= 0; i--) {
          const p = confettiParticles[i];
          p.vy += 0.2 * delta; 
          p.graphics.x += p.vx * delta;
          p.graphics.y += p.vy * delta;
          p.graphics.rotation += p.vr * delta;
          p.graphics.alpha -= p.alphaDrop * delta;
          
          if (p.graphics.alpha <= 0 || p.graphics.y > window.innerHeight + 50) {
            app.stage.removeChild(p.graphics);
            p.graphics.destroy();
            confettiParticles.splice(i, 1);
          }
        }
      });

      // Ouvinte Moeda
      const handleSpawnCoin = ((e: CustomEvent) => {
         const { x, y, amount } = e.detail;
         const count = Math.min(amount, 15);
         
         for(let i=0; i<count; i++) {
            const sprite = new Sprite(fallbackTexture);
            sprite.x = x;
            sprite.y = y;
            sprite.anchor.set(0.5);
            const vx = (Math.random() - 0.5) * 12;
            const vy = (Math.random() * -12) - 6;
            const alphaDrop = 0.004 + (Math.random() * 0.008);
            coinParticles.push({ sprite, vx, vy, alphaDrop });
            app.stage.addChild(sprite);
         }
      }) as EventListener;

      // Ouvinte Confete
      const handleSpawnConfetti = (() => {
        const x = window.innerWidth / 2;
        const y = window.innerHeight / 2;
        const count = 100;

        for (let i = 0; i < count; i++) {
          const g = new Graphics();
          const size = 5 + Math.random() * 10;
          const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
          
          g.rect(-size/2, -size/2, size, size);
          g.fill({ color });
          
          g.x = x;
          g.y = y;
          
          const angle = Math.random() * Math.PI * 2;
          const speed = 5 + Math.random() * 15;
          const vx = Math.cos(angle) * speed;
          const vy = Math.sin(angle) * speed - 5;
          const vr = (Math.random() - 0.5) * 0.2;
          const alphaDrop = 0.002 + Math.random() * 0.005;
          
          confettiParticles.push({ graphics: g, vx, vy, vr, alphaDrop });
          app.stage.addChild(g);
        }
      }) as EventListener;

      window.addEventListener('spawn_coin', handleSpawnCoin);
      window.addEventListener('spawn_confetti', handleSpawnConfetti);
      
      return () => {
        window.removeEventListener('spawn_coin', handleSpawnCoin);
        window.removeEventListener('spawn_confetti', handleSpawnConfetti);
      };
    };

    const cleanupPromise = initPixi();

    return () => {
      isDestroyed = true;
      cleanupPromise.then(cleanupFn => {
        if (cleanupFn) cleanupFn();
        if (app) app.destroy({ removeView: true }, { children: true, texture: true });
        if (fallbackTexture) fallbackTexture.destroy();
      });
    };
  }, []);

  return <div ref={containerRef} style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', width: '100%', height: '100%', zIndex: 9999 }} />;
}
