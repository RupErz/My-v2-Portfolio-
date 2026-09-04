import { useEffect, useRef } from 'react';

/**
 * Portrait rendered as characters. Trims to the subject, crops to the upper body
 * (so it fills the frame instead of a skinny full-body strip), and packs a dense
 * grid. The cursor is a repel field: an invisible circle that pushes the
 * characters outward as it moves, leaving a gap that follows the pointer.
 */

const RAMP = ' .:-=+*#%@';
const CW = 6;
const CH = 7;
const R = 124;    // repel radius (wider = more characters move together, smoother blob)
const PUSH = 50;  // max displacement at the centre
const TOP_CROP = 0.42; // keep head -> ~chest (face-forward)
const INTRO_MS = 1600; // big-bang: characters burst from centre and settle into the face
const SPRING_K = 0.13; // jelly: stiffness, pull toward the repel target (softer = looser wobble)
const SPRING_D = 0.87; // jelly: velocity retained each frame (< 1); higher = more wobble/bounce

export default function AsciiPortrait({ src = '/portrait.png', fallback = '/portrait-placeholder.svg' }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
    let cols = 0;
    let rows = 0;
    let cells: { x: number; y: number; ch: string; a: number; d: number; jx: number; jy: number; ox: number; oy: number; vx: number; vy: number }[] = [];
    let base: HTMLCanvasElement | null = null;
    let img: HTMLImageElement | null = null;
    let raf = 0;
    let introStart = 0;
    let introCx = 0;
    let introCy = 0;

    function sample() {
      if (!img) return;
      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.max(1, Math.floor(W / CW));
      rows = Math.max(1, Math.floor(H / CH));
      introCx = W / 2;
      introCy = H / 2;

      // --- find the subject's bounding box (alpha) at low res ---
      const bw = 200;
      const bh = Math.max(1, Math.round((bw * img.height) / img.width));
      const bc = document.createElement('canvas');
      bc.width = bw; bc.height = bh;
      const bx = bc.getContext('2d')!;
      bx.drawImage(img, 0, 0, bw, bh);
      const bd = bx.getImageData(0, 0, bw, bh).data;
      let minX = bw, minY = bh, maxX = 0, maxY = 0, any = false;
      for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
        if (bd[(y * bw + x) * 4 + 3] > 40) { any = true; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
      }
      if (!any) { minX = 0; minY = 0; maxX = bw; maxY = bh; }
      // crop region in source pixels, cropped to the upper body
      const sx = (minX / bw) * img.width;
      const sy = (minY / bh) * img.height;
      const sw = ((maxX - minX) / bw) * img.width;
      const sh = ((maxY - minY) / bh) * img.height * TOP_CROP;

      // --- cover-fit that crop into the cols x rows grid ---
      const s = document.createElement('canvas');
      s.width = cols; s.height = rows;
      const sc = s.getContext('2d')!;
      // Fit by HEIGHT so the full face (top of the crop) is never sliced off;
      // center horizontally (letterbox, or symmetric side-crop if wider than the grid).
      const cropAspect = sw / sh;
      const dh = rows;
      const dw = rows * cropAspect;
      const dx = (cols - dw) / 2;
      const dy = 0;
      sc.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
      const data = sc.getImageData(0, 0, cols, rows).data;

      cells = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const o = (r * cols + c) * 4;
          if (data[o + 3] < 90) continue; // transparent -> empty
          const lum = (0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2]) / 255;
          cells.push({
            x: c * CW,
            y: r * CH + CH / 2,
            ch: RAMP[Math.round(lum * (RAMP.length - 1))],
            a: lum,
            d: Math.random() * 0.34,
            jx: (Math.random() - 0.5) * 46,
            jy: (Math.random() - 0.5) * 46,
            ox: 0, oy: 0, vx: 0, vy: 0,
          });
        }
      }

      base = document.createElement('canvas');
      base.width = W * dpr; base.height = H * dpr;
      const g = base.getContext('2d')!;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.font = "600 7px 'JetBrains Mono', ui-monospace, monospace";
      g.textBaseline = 'middle';
      for (const cell of cells) {
        g.fillStyle = `rgba(255,255,255,${(0.14 + cell.a * 0.62).toFixed(3)})`;
        g.fillText(cell.ch, cell.x, cell.y);
      }
    }

    function draw() {
      if (!base) return;
      const rect = canvas.getBoundingClientRect();

      // --- big-bang intro: burst from centre, scramble glyphs, settle into place ---
      const p = introStart && !reduce ? (performance.now() - introStart) / INTRO_MS : 1;
      if (p < 1) {
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.font = "600 7px 'JetBrains Mono', ui-monospace, monospace";
        ctx.textBaseline = 'middle';
        for (const cell of cells) {
          const lt = Math.max(0, Math.min(1, (p - cell.d) / (1 - cell.d)));
          if (lt <= 0) continue;
          const e = 1 - Math.pow(1 - lt, 3); // easeOutCubic
          const sx = introCx + cell.jx;
          const sy = introCy + cell.jy;
          const px = sx + (cell.x - sx) * e;
          const py = sy + (cell.y - sy) * e;
          const ch = lt < 0.82 ? RAMP[(Math.random() * RAMP.length) | 0] : cell.ch;
          ctx.fillStyle = `rgba(255,255,255,${((0.14 + cell.a * 0.62) * e).toFixed(3)})`;
          ctx.fillText(ch, px, py);
        }
        return;
      }

      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.drawImage(base, 0, 0, rect.width, rect.height);

      // pointer in canvas space (raw target; the per-cell spring does the smoothing)
      const has = mouse.tx > -9000;
      const lx = mouse.tx - rect.left;
      const ly = mouse.ty - rect.top;

      ctx.font = "600 7px 'JetBrains Mono', ui-monospace, monospace";
      ctx.textBaseline = 'middle';
      let anyActive = false;
      for (const cell of cells) {
        // where the cursor wants this character to be (repel target)
        let tx = 0;
        let ty = 0;
        if (has) {
          const dx = cell.x - lx;
          const dy = cell.y - ly;
          const dist = Math.hypot(dx, dy);
          if (dist < R) {
            const f = 1 - dist / R;
            const amt = f * f * PUSH;
            const ux = dist > 0.01 ? dx / dist : 0;
            const uy = dist > 0.01 ? dy / dist : -1;
            tx = ux * amt;
            ty = uy * amt;
          }
        }
        // jelly: spring the current offset toward the target (underdamped -> overshoot + wobble)
        cell.vx = (cell.vx + (tx - cell.ox) * SPRING_K) * SPRING_D;
        cell.vy = (cell.vy + (ty - cell.oy) * SPRING_K) * SPRING_D;
        cell.ox += cell.vx;
        cell.oy += cell.vy;

        const speed = Math.abs(cell.vx) + Math.abs(cell.vy);
        const disp = Math.abs(cell.ox) + Math.abs(cell.oy);
        if (disp < 0.18 && speed < 0.18) {
          // settled: let the prebaked base show it, snap to rest
          cell.ox = 0; cell.oy = 0; cell.vx = 0; cell.vy = 0;
          continue;
        }
        anyActive = true;
        // erase the resting copy from the base, redraw displaced (brighter while it moves)
        ctx.clearRect(cell.x - 1, cell.y - CH / 2 - 1, CW + 2, CH + 2);
        const glow = Math.min(0.34, speed * 0.05);
        ctx.fillStyle = `rgba(255,255,255,${Math.min(1, 0.16 + cell.a * 0.62 + glow).toFixed(3)})`;
        ctx.fillText(cell.ch, cell.x + cell.ox, cell.y + cell.oy);
      }
      void anyActive;
    }

    const loop = () => { if (!document.hidden) draw(); raf = requestAnimationFrame(loop); };
    function load(url: string, onFail?: () => void) {
      const im = new Image();
      im.onload = () => { img = im; sample(); if (!introStart) introStart = performance.now(); if (!raf) raf = requestAnimationFrame(loop); };
      im.onerror = () => onFail?.();
      im.src = url;
    }
    load(src, () => load(fallback));

    const onMove = (e: PointerEvent) => { mouse.tx = e.clientX; mouse.ty = e.clientY; };
    const onLeave = () => { mouse.tx = -9999; mouse.ty = -9999; };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerout', onLeave);
    let rt: number;
    const onResize = () => { window.clearTimeout(rt); rt = window.setTimeout(sample, 160); };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerout', onLeave);
      window.removeEventListener('resize', onResize);
      window.clearTimeout(rt);
    };
  }, [src, fallback]);

  return <canvas ref={ref} className="ascii-portrait" aria-label="Portrait rendered in ASCII" />;
}
