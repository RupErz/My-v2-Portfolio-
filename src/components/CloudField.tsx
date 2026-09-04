import { useEffect, useRef } from 'react';

/**
 * Generative cinematic atmosphere: two tileable value-noise "cloud" layers
 * drifting at different speeds over a warm-dark base. Pre-rendered once, then
 * scrolled with cheap drawImage blits (no per-frame noise). A single static
 * frame under reduced-motion. Built to be swapped for a real image/video later.
 */

const TILE = 512;

function noiseTile(seed: number, warm: [number, number, number]) {
  // Tileable fractal value noise -> alpha mask, painted in one warm hue.
  const val = new Float32Array(TILE * TILE);
  let amp = 1;
  let total = 0;
  let rng = seed * 9301 + 49297;
  const rand = () => {
    rng = (rng * 9301 + 49297) % 233280;
    return rng / 233280;
  };
  for (let oct = 0; oct < 4; oct++) {
    const cells = 4 * Math.pow(2, oct);
    const grid = new Float32Array(cells * cells);
    for (let i = 0; i < grid.length; i++) grid[i] = rand();
    const smooth = (t: number) => t * t * (3 - 2 * t);
    for (let y = 0; y < TILE; y++) {
      const gy = (y / TILE) * cells;
      const y0 = Math.floor(gy) % cells;
      const y1 = (y0 + 1) % cells;
      const fy = smooth(gy - Math.floor(gy));
      for (let x = 0; x < TILE; x++) {
        const gx = (x / TILE) * cells;
        const x0 = Math.floor(gx) % cells;
        const x1 = (x0 + 1) % cells;
        const fx = smooth(gx - Math.floor(gx));
        const a = grid[y0 * cells + x0] * (1 - fx) + grid[y0 * cells + x1] * fx;
        const b = grid[y1 * cells + x0] * (1 - fx) + grid[y1 * cells + x1] * fx;
        val[y * TILE + x] += (a * (1 - fy) + b * fy) * amp;
      }
    }
    total += amp;
    amp *= 0.5;
  }
  const c = document.createElement('canvas');
  c.width = c.height = TILE;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(TILE, TILE);
  for (let i = 0; i < val.length; i++) {
    let v = val[i] / total; // 0..1
    v = Math.max(0, (v - 0.42) / 0.58); // lift threshold -> soft cloud masses
    v = v * v;
    const o = i * 4;
    img.data[o] = warm[0];
    img.data[o + 1] = warm[1];
    img.data[o + 2] = warm[2];
    img.data[o + 3] = Math.min(255, v * 235);
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

export default function CloudField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false })!;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const layerA = noiseTile(7, [214, 150, 86]); // warm amber
    const layerB = noiseTile(41, [150, 120, 170]); // dusty violet, subtler
    let w = 0;
    let h = 0;
    let raf = 0;

    function resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.width = Math.floor(window.innerWidth * dpr);
      h = canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
    }

    function tileLayer(layer: HTMLCanvasElement, off: number, oy: number, alpha: number, scale: number) {
      const s = TILE * scale;
      ctx.globalAlpha = alpha;
      const startX = -((off % s) + s);
      const startY = -((oy % s) + s);
      for (let x = startX; x < w + s; x += s)
        for (let y = startY; y < h + s; y += s) ctx.drawImage(layer, x, y, s, s);
    }

    function frame(t: number) {
      // warm-dark base
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#0b0a08');
      g.addColorStop(0.6, '#161009');
      g.addColorStop(1, '#0a0806');
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = 'lighter';
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      tileLayer(layerB, t * 0.006 * dpr, t * 0.001 * dpr, 0.5, 2.4);
      tileLayer(layerA, t * 0.013 * dpr, -t * 0.0016 * dpr, 0.6, 1.7);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }

    resize();
    if (reduce) {
      frame(6000);
    } else {
      const loop = (t: number) => {
        if (!document.hidden) frame(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }
    let rt: number;
    const onResize = () => {
      window.clearTimeout(rt);
      rt = window.setTimeout(() => {
        resize();
        if (reduce) frame(6000);
      }, 150);
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.clearTimeout(rt);
    };
  }, []);

  return <canvas ref={ref} className="cloudfield" aria-hidden="true" />;
}
