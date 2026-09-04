import { useEffect, useRef } from 'react';

/**
 * A quiet monochrome field of 0s and 1s. Faint at rest; the cursor is a lens that
 * brightens the characters it passes over. Clicking drops a ripple: an expanding
 * ring that brightens and pushes the characters like a rock in water, then eases
 * back. Rapid clicks on the same spot stack into a bigger splash. Static base is
 * pre-rendered; per frame we relight only the cursor region and the ripple rings.
 */

const GLYPHS = '01010101{}/<>;=+'.split(''); // mostly binary, a little code texture
const CW = 15; // cell width
const CH = 19; // cell height
const SPEED = 340;     // ripple expansion px/s
const RING_W = 22;     // ripple ring thickness (px)
const LIFE = 2.4;      // seconds for a ripple to fade back to rest
const MAX_RIPPLES = 44;

export default function AsciiField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    let W = 0;
    let H = 0;
    let cols = 0;
    let rows = 0;
    let chars: string[] = [];
    let base: HTMLCanvasElement;
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
    const ripples: { x: number; y: number; start: number; mag: number }[] = [];

    function buildBase() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = Math.ceil(W / CW) + 1;
      rows = Math.ceil(H / CH) + 1;
      chars = new Array(cols * rows);
      for (let i = 0; i < chars.length; i++) chars[i] = GLYPHS[(Math.random() * GLYPHS.length) | 0];

      base = document.createElement('canvas');
      base.width = W * dpr;
      base.height = H * dpr;
      const b = base.getContext('2d')!;
      b.setTransform(dpr, 0, 0, dpr, 0, 0);
      b.font = "500 13px 'JetBrains Mono', ui-monospace, monospace";
      b.textBaseline = 'middle';
      b.fillStyle = 'rgba(255,255,255,0.05)';
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) b.fillText(chars[r * cols + c], c * CW, r * CH + CH / 2);
    }

    function draw(t: number) {
      const breathe = reduce ? 1 : 0.85 + 0.15 * Math.sin(t * 0.0006);
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = breathe;
      ctx.drawImage(base, 0, 0, W, H);
      ctx.globalAlpha = 1;
      ctx.font = "500 13px 'JetBrains Mono', ui-monospace, monospace";
      ctx.textBaseline = 'middle';

      // cursor lens
      mouse.x += (mouse.tx - mouse.x) * 0.18;
      mouse.y += (mouse.ty - mouse.y) * 0.18;
      if (mouse.tx > -9000) {
        const R = 150;
        const c0 = Math.max(0, Math.floor((mouse.x - R) / CW));
        const c1 = Math.min(cols - 1, Math.ceil((mouse.x + R) / CW));
        const r0 = Math.max(0, Math.floor((mouse.y - R) / CH));
        const r1 = Math.min(rows - 1, Math.ceil((mouse.y + R) / CH));
        for (let r = r0; r <= r1; r++) {
          for (let c = c0; c <= c1; c++) {
            const x = c * CW;
            const y = r * CH + CH / 2;
            const d = Math.hypot(x - mouse.x, y - mouse.y);
            if (d > R) continue;
            const f = 1 - d / R;
            ctx.fillStyle = `rgba(255,255,255,${(0.05 + f * f * 0.62).toFixed(3)})`;
            ctx.fillText(chars[r * cols + c], x, y);
          }
        }
      }

      // ripples — expanding rings that displace + brighten, then ease back
      const now = performance.now();
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        const dt = (now - rp.start) / 1000;
        if (dt > LIFE) { ripples.splice(i, 1); continue; }
        if (dt < 0) continue;
        const radius = SPEED * dt;
        const decay = 1 - dt / LIFE;
        const amp = rp.mag * decay * decay; // amplitude eases out
        const rout = radius + RING_W * 2.2;
        const rin = radius - RING_W * 2.2;
        const rr0 = Math.max(0, Math.floor((rp.y - rout) / CH));
        const rr1 = Math.min(rows - 1, Math.ceil((rp.y + rout) / CH));
        for (let r = rr0; r <= rr1; r++) {
          const y = r * CH + CH / 2;
          const dy = y - rp.y;
          if (Math.abs(dy) > rout) continue;
          const xOuter = Math.sqrt(Math.max(0, rout * rout - dy * dy));
          const hasInner = Math.abs(dy) < rin;
          const xInner = hasInner ? Math.sqrt(rin * rin - dy * dy) : 0;
          const bands: [number, number][] = hasInner
            ? [[rp.x - xOuter, rp.x - xInner], [rp.x + xInner, rp.x + xOuter]]
            : [[rp.x - xOuter, rp.x + xOuter]];
          for (const [xa, xb] of bands) {
            const ca = Math.max(0, Math.floor(xa / CW));
            const cb = Math.min(cols - 1, Math.ceil(xb / CW));
            for (let c = ca; c <= cb; c++) {
              const x = c * CW;
              const dx = x - rp.x;
              const dist = Math.hypot(dx, dy);
              const diff = dist - radius;
              const ring = Math.exp(-(diff * diff) / (2 * RING_W * RING_W));
              const inten = ring * amp;
              if (inten < 0.05) continue;
              const ux = dist > 0.01 ? dx / dist : 0;
              const uy = dist > 0.01 ? dy / dist : 0;
              const push = inten * 8;
              ctx.fillStyle = `rgba(255,255,255,${Math.min(0.95, 0.05 + inten * 0.85).toFixed(3)})`;
              ctx.fillText(chars[r * cols + c], x + ux * push, y + uy * push);
            }
          }
        }
      }
    }

    let raf = 0;
    const loop = (t: number) => {
      if (!document.hidden) draw(t);
      raf = requestAnimationFrame(loop);
    };
    buildBase();
    raf = requestAnimationFrame(loop);

    const onMove = (e: PointerEvent) => { mouse.tx = e.clientX; mouse.ty = e.clientY; };
    const onLeave = () => { mouse.tx = -9999; mouse.ty = -9999; };
    const onDown = (e: PointerEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      const now = performance.now();
      let mag = 1;
      for (const rp of ripples) {
        if (now - rp.start < 900 && Math.hypot(rp.x - x, rp.y - y) < 40) mag = Math.min(3.4, rp.mag + 0.7);
      }
      ripples.push({ x, y, start: now, mag });
      if (ripples.length > MAX_RIPPLES) ripples.shift();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerout', onLeave);
    window.addEventListener('pointerdown', onDown);

    let rt: number;
    const onResize = () => {
      window.clearTimeout(rt);
      rt = window.setTimeout(buildBase, 160);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerout', onLeave);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('resize', onResize);
      window.clearTimeout(rt);
    };
  }, []);

  return <canvas ref={ref} className="ascii-field" aria-hidden="true" />;
}
