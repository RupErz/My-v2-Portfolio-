import { useEffect, useRef } from 'react';

/**
 * Procedural pixel-art dusk: warm-graphite dithered sky, twinkling stars, a pale
 * moon, three drifting parallax hill layers, and rising pine fireflies.
 * Rendered at low internal resolution and CSS-upscaled with pixelation for crisp
 * pixels. Static buffers keep the per-frame cost tiny (drawImage blits + a few
 * hundred 1px marks). Freezes to a single frame under reduced-motion.
 */

const PX = 4; // css pixels per art pixel
const SKY = ['#0f0c09', '#17110b', '#241a11', '#362615', '#4a331c']; // top -> warm horizon
const HILLS = ['#463320', '#2d2015', '#18110a']; // far (hazy) -> near (dark)
const MOON = '#e4d3a6';
const MOON_SHADE = '#c9b585';
const STAR = '#ece3cf';
const PINE = '#8ecba6';
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

function makeSky(W: number, H: number) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(W, H);
  const rgb = SKY.map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
  for (let y = 0; y < H; y++) {
    const t = y / (H - 1);
    const v = t * (SKY.length - 1);
    const base = Math.floor(v);
    const frac = v - base;
    for (let x = 0; x < W; x++) {
      const thr = BAYER[(y % 4) * 4 + (x % 4)] / 16;
      const idx = Math.min(SKY.length - 1, base + (frac > thr ? 1 : 0));
      const o = (y * W + x) * 4;
      img.data[o] = rgb[idx][0];
      img.data[o + 1] = rgb[idx][1];
      img.data[o + 2] = rgb[idx][2];
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  // moon (upper-left, clear of the invite card)
  const mx = Math.round(W * 0.2);
  const my = Math.round(H * 0.16);
  const r = Math.max(4, Math.round(H * 0.07));
  ctx.fillStyle = MOON;
  for (let y = -r; y <= r; y++)
    for (let x = -r; x <= r; x++)
      if (x * x + y * y <= r * r) ctx.fillRect(mx + x, my + y, 1, 1);
  ctx.fillStyle = MOON_SHADE;
  ctx.fillRect(mx - r + 2, my - 1, 2, 2);
  ctx.fillRect(mx + 1, my + 2, 3, 2);
  ctx.fillRect(mx - 2, my - 3, 2, 2);
  return c;
}

function makeHill(W: number, H: number, layer: number) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  const topBase = [0.6, 0.7, 0.8][layer] * H;
  const amp = [0.09, 0.06, 0.045][layer] * H;
  // tileable value noise = sum of sines with integer periods over W
  const waves = [
    { f: 1, a: 0.55, p: layer * 1.3 },
    { f: 2, a: 0.28, p: layer * 2.1 + 1 },
    { f: 4, a: 0.13, p: layer * 0.7 + 2 },
    { f: 7, a: 0.06, p: layer * 3.3 },
  ];
  ctx.fillStyle = HILLS[layer];
  for (let x = 0; x < W; x++) {
    let n = 0;
    for (const w of waves) n += w.a * Math.sin((2 * Math.PI * w.f * x) / W + w.p);
    const top = Math.round(topBase - amp * n);
    ctx.fillRect(x, top, 1, H - top);
  }
  return c;
}

export default function PixelScene({ leaving }: { leaving?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false })!;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let W = 0;
    let H = 0;
    let sky: HTMLCanvasElement;
    let hills: HTMLCanvasElement[] = [];
    let stars: { x: number; y: number; ph: number; pine: boolean }[] = [];
    let flies: { x: number; y: number; vy: number; ph: number }[] = [];
    let raf = 0;

    function build() {
      const cssW = window.innerWidth;
      const cssH = window.innerHeight;
      W = Math.min(560, Math.ceil(cssW / PX));
      H = Math.ceil((W * cssH) / cssW);
      canvas.width = W;
      canvas.height = H;
      canvas.style.width = cssW + 'px';
      canvas.style.height = cssH + 'px';
      sky = makeSky(W, H);
      hills = [0, 1, 2].map((i) => makeHill(W, H, i));
      const starCount = Math.round((W * H) / 850);
      stars = Array.from({ length: starCount }, () => ({
        x: Math.floor(Math.random() * W),
        y: Math.floor(Math.random() * H * 0.55),
        ph: Math.random() * Math.PI * 2,
        pine: Math.random() < 0.12,
      }));
      const flyCount = Math.round(W / 10);
      flies = Array.from({ length: flyCount }, () => ({
        x: Math.random() * W,
        y: H * 0.5 + Math.random() * H * 0.5,
        vy: 0.05 + Math.random() * 0.12,
        ph: Math.random() * Math.PI * 2,
      }));
    }

    function frame(t: number) {
      ctx.drawImage(sky, 0, 0);
      // stars
      for (const s of stars) {
        ctx.globalAlpha = 0.35 + 0.55 * Math.abs(Math.sin(t * 0.002 + s.ph));
        ctx.fillStyle = s.pine ? PINE : STAR;
        ctx.fillRect(s.x, s.y, 1, 1);
      }
      ctx.globalAlpha = 1;
      // hills, far to near
      const speeds = [0.004, 0.009, 0.017];
      for (let i = 0; i < 3; i++) {
        const off = Math.floor((t * speeds[i]) % W);
        ctx.drawImage(hills[i], -off, 0);
        ctx.drawImage(hills[i], W - off, 0);
      }
      // fireflies
      for (const f of flies) {
        f.y -= f.vy;
        if (f.y < H * 0.42) {
          f.y = H;
          f.x = Math.random() * W;
        }
        const a = 0.25 + 0.6 * Math.abs(Math.sin(t * 0.004 + f.ph));
        ctx.globalAlpha = a;
        ctx.fillStyle = PINE;
        ctx.fillRect(Math.floor(f.x), Math.floor(f.y), 1, 1);
      }
      ctx.globalAlpha = 1;
    }

    build();
    if (reduce) {
      frame(0);
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
        build();
        if (reduce) frame(0);
      }, 150);
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.clearTimeout(rt);
    };
  }, []);

  return <canvas ref={ref} className={`pixel-scene ${leaving ? 'pixel-scene--leaving' : ''}`} aria-hidden="true" />;
}
