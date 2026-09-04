import { useEffect, useRef, useState } from 'react';

/**
 * Game mode as a click-through overlay whose terrain IS the content. Each frame we
 * measure a curated set of real page elements (headings, project rows, cards,
 * device frames, buttons) and turn their top edges into platforms, so the cat
 * walks and jumps along the actual content and it stays right beside you. The page
 * still scrolls and clicks; the cat rides the scroll so it stays on its element.
 * Each main section holds one crystal; collect them all for a hidden reveal.
 */

type ScreenId = string;
type Plat = { x: number; y: number; w: number; content: boolean; floor?: boolean };
type Frac = { xf: number; yf: number; wf: number };

const ACCENT = '#6ff2c0';
const GRAV = 0.72;
const ACCEL = 0.95;
const FRICTION = 0.82;
const MAXV = 4.6;
const JUMP = -12.8;
const PX = 3;

// which real elements become platforms (curated so the cat perches on meaningful content, not every line)
const PLAT_SEL = [
  '.screen__title', '.home-split__hi', '.home-split__bio',
  '.detail__name', '.detail__tagline', '.detail__lede', '.detail__device',
  '.work__row', '.feat__row', '.principle',
  '.about__frame', '.about__yap',
  '.say-hi', '.ghost-link', '.back-btn',
].join(',');

const CAT = [
  '....D......D....', '...DD......DD...', '...DDD....DDD...', '..DDDDDDDDDDDD..',
  '..DCCCCCCCCCCD..', '..DCCCCCCCCCCD..', '..DCBBCCCCBBCD..', '..DCBKCCCCBKCD..',
  '..DCCCCKKCCCCD..', '..DCPCCKKCCPCD..', '..DCCCCCCCCCCD..', '...DCCCCCCCCD...',
  '....WWWWWWWW....', '...WWWGGGGWWW...', '...CWWWWWWWWC...', '...CCWWWWWWCC...',
];
const CAT_COLORS: Record<string, string> = { D: '#5b4f47', C: '#cabfa9', W: '#f1eee7', B: '#8fbfe6', K: '#1e1a18', P: '#e0989e', G: '#d3ab48' };

let actx: AudioContext | null = null;
function audio(): AudioContext | null {
  try {
    if (!actx) actx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
  } catch { return null; }
  return actx;
}
function tone(freq: number, dur: number, type: OscillatorType, vol: number, freqEnd?: number) {
  const ac = audio(); if (!ac) return;
  const o = ac.createOscillator(); const g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, ac.currentTime);
  if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, ac.currentTime + dur);
  g.gain.setValueAtTime(vol, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
  o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + dur + 0.02);
}
const sfxJump = () => tone(300, 0.14, 'square', 0.05, 640);
const sfxCollect = () => { tone(660, 0.09, 'triangle', 0.07); setTimeout(() => tone(988, 0.13, 'triangle', 0.07), 80); };
const sfxDoor = () => [523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, 0.15, 'sine', 0.06), i * 90));

export default function GameMode({
  screen,
  order,
  go,
  onExit,
}: {
  screen: ScreenId;
  order: ScreenId[];
  go: (id: ScreenId) => void;
  onExit: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const input = useRef({ left: false, right: false, jump: false, enter: false, down: false });
  const bot = useRef({ x: 200, y: -70, vx: 0, vy: 0, onGround: false, face: 1, walk: 0, jumps: 2, squash: 0 });
  const ledges = useRef<Frac[]>([]);
  const meta = useRef({ id: String(screen), hasTreasure: false, hasDoor: true, tPos: { xf: 0.4, yf: 0.35 } });
  const collected = useRef<Set<string>>(new Set());
  const screenRef = useRef(screen);
  const goRef = useRef(go);
  const exitRef = useRef(onExit);
  const orderRef = useRef(order);
  screenRef.current = screen; goRef.current = go; exitRef.current = onExit; orderRef.current = order;

  const [count, setCount] = useState(0);
  const [hint, setHint] = useState<'door' | 'treasure' | null>(null);
  const [reveal, setReveal] = useState(false);
  const [sound, setSound] = useState(true);
  const soundRef = useRef(true);
  soundRef.current = sound;
  const total = order.length - 1;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W = 0, H = 0;
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    const scroller = () => document.querySelector('.screen__scroll') as HTMLElement | null;
    function pageKey(): string {
      const d = document.querySelector('.detail__name');
      const name = d && d.textContent ? d.textContent.trim() : '';
      return name ? 'proj:' + name : screenRef.current;
    }
    function contentPlats(): Plat[] {
      const out: Plat[] = [];
      document.querySelectorAll(PLAT_SEL).forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width < 50 || r.bottom < 28 || r.top > H - 14) return;
        out.push({ x: r.left + 3, y: Math.round(r.top), w: r.width - 6, content: true });
      });
      return out;
    }
    let graceUntil = 0;
    function dropCat() {
      const b = bot.current;
      b.x = W * (0.55 + Math.random() * 0.2); b.y = -70; b.vx = 0; b.vy = 0; b.jumps = 2; b.squash = 0;
      graceUntil = performance.now() + 600; // don't auto-grab the crystal while falling in
    }
    function rebuild(key: string) {
      const isSection = orderRef.current.includes(key);
      const R = Math.random;
      // crystal spawns in a fresh random spot every time (flappy jump reaches anything)
      const tPos = { xf: 0.16 + R() * 0.64, yf: 0.24 + R() * 0.4 };
      meta.current = { id: key, hasTreasure: isSection && key !== 'home', hasDoor: isSection, tPos };
      // random floating ledges, kept well apart from one another
      const out: Frac[] = [];
      const apart = (a: Frac, b: Frac) => Math.abs(a.xf - b.xf) > 0.22 || Math.abs(a.yf - b.yf) > 0.18;
      const targetN = 3 + Math.floor(R() * 2);
      for (let i = 0; i < targetN; i++) {
        for (let t = 0; t < 40; t++) {
          const wf = 0.06 + R() * 0.06;
          const cand = { xf: 0.06 + R() * (0.88 - wf), yf: 0.22 + R() * 0.54, wf };
          if (out.every((p) => apart(cand, p))) { out.push(cand); break; }
        }
      }
      ledges.current = out;
      dropCat();
    }
    rebuild(pageKey());

    let prevJump = false, latch = false, pop = 0, popXY = { x: 0, y: 0 }, dropUntil = 0;
    let lastScroll = scroller()?.scrollTop ?? 0;
    let onContentLast = false;

    function frame() {
      if (document.hidden) { raf = requestAnimationFrame(frame); return; }
      const key = pageKey();
      if (key !== meta.current.id) { rebuild(key); lastScroll = scroller()?.scrollTop ?? 0; }
      const m = meta.current;
      const b = bot.current;
      const k = input.current;

      // ride the page scroll so the cat stays on its content element
      const st = scroller()?.scrollTop ?? 0;
      const dScroll = st - lastScroll; lastScroll = st;
      if (onContentLast && dScroll !== 0) b.y -= dScroll;

      const ax = (k.right ? 1 : 0) - (k.left ? 1 : 0);
      b.vx = clamp((b.vx + ax * ACCEL) * FRICTION, -MAXV, MAXV);
      if (Math.abs(b.vx) > 0.15) b.face = b.vx > 0 ? 1 : -1;
      if (k.jump && !prevJump) { b.vy = JUMP; b.onGround = false; b.squash = 1; if (soundRef.current) sfxJump(); } // unlimited flap
      prevJump = k.jump;
      if (k.down && b.onGround) dropUntil = performance.now() + 220; // press down to fall through a platform
      b.vy += GRAV;
      const oldY = b.y;
      b.x = clamp(b.x + b.vx, 12, W - 12);
      b.y += b.vy;

      const ground: Plat = { x: 0, y: H - 8, w: W, content: false, floor: true };
      const rand: Plat[] = ledges.current.map((f) => ({ x: f.xf * W, y: f.yf * H, w: f.wf * W, content: false }));
      const plats = [ground, ...contentPlats(), ...rand];
      const dropping = performance.now() < dropUntil;
      b.onGround = false; let landedContent = false;
      for (const p of plats) {
        if (dropping && !p.floor) continue; // down held: pass through everything but the floor
        if (b.x > p.x - 9 && b.x < p.x + p.w + 9 && oldY <= p.y + 4 && b.y >= p.y && b.vy >= 0) {
          b.y = p.y; b.vy = 0; b.onGround = true; if (p.content) landedContent = true;
        }
      }
      onContentLast = landedContent;
      if (b.y > H + 220) { dropCat(); }
      b.walk += Math.abs(b.vx) * 0.28;
      if (b.squash > 0) b.squash = Math.max(0, b.squash - 0.08);
      if (pop > 0) pop -= 0.05;

      let curHint: 'door' | 'treasure' | null = null;
      // crystal sits in its shuffled spot for this visit
      let tx = 0, ty = 0, showT = false;
      if (m.hasTreasure && !collected.current.has(m.id)) {
        tx = m.tPos.xf * W;
        ty = m.tPos.yf * H;
        showT = true;
        const dist = Math.hypot(b.x - tx, b.y - 18 - ty);
        if (dist < 30 && performance.now() > graceUntil) {
          collected.current.add(m.id); pop = 1; popXY = { x: tx, y: ty }; setCount(collected.current.size);
          if (soundRef.current) sfxCollect();
          if (collected.current.size >= total) { setReveal(true); setTimeout(() => setReveal(false), 4600); }
          showT = false;
        } else if (dist < 96) curHint = 'treasure';
      }
      // door sits on the ground at the right, always reachable
      const dx = W - 64, dy = H - 8;
      const atDoor = m.hasDoor && Math.abs(b.x - dx) < 42 && Math.abs(b.y - dy) < 60 && b.onGround;
      if (atDoor) curHint = 'door';
      setHint((v) => (v === curHint ? v : curHint));
      if (atDoor && k.enter && !latch) {
        latch = true;
        if (soundRef.current) sfxDoor();
        const idx = orderRef.current.indexOf(m.id);
        goRef.current(orderRef.current[(idx + 1) % orderRef.current.length]);
      }
      if (!k.enter) latch = false;

      // ---- draw ----
      ctx.clearRect(0, 0, W, H);
      for (const p of plats) {
        if (p.content) continue; // content is walkable but invisible (no drawn line) — the cat just stands on the text
        if (p.floor) {
          ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(0, p.y, W, 1.5);
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(p.x, p.y, p.w, 6);
          ctx.fillStyle = 'rgba(255,255,255,0.42)'; ctx.fillRect(p.x, p.y, p.w, 2);
        }
      }
      if (m.hasDoor) drawDoor(ctx, dx, dy, atDoor);
      if (showT) drawTreasure(ctx, tx, ty);
      if (pop > 0) {
        ctx.save(); ctx.globalAlpha = pop; ctx.strokeStyle = ACCENT; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(popXY.x, popXY.y - 18, 30 * (1 - pop) + 8, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
      drawCat(ctx, b);
      raf = requestAnimationFrame(frame);
    }
    let raf = requestAnimationFrame(frame);

    const setKey = (e: KeyboardEvent, down: boolean) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      const k = input.current;
      switch (e.key) {
        case 'ArrowLeft': case 'a': k.left = down; e.preventDefault(); break;
        case 'ArrowRight': case 'd': k.right = down; e.preventDefault(); break;
        case ' ': k.jump = down; e.preventDefault(); break;
        case 'ArrowDown': case 's': k.down = down; e.preventDefault(); break;
        case 'ArrowUp': case 'w': case 'Enter': k.enter = down; e.preventDefault(); break;
        case 'Escape': if (down) exitRef.current(); break;
      }
    };
    const kd = (e: KeyboardEvent) => setKey(e, true);
    const ku = (e: KeyboardEvent) => setKey(e, false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      window.removeEventListener('resize', resize);
    };
  }, [total]);

  const hold = (key: 'left' | 'right' | 'jump' | 'enter') => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); input.current[key] = true; },
    onPointerUp: (e: React.PointerEvent) => { e.preventDefault(); input.current[key] = false; },
    onPointerLeave: () => { input.current[key] = false; },
  });

  return (
    <div className="game">
      <canvas ref={canvasRef} className="game__canvas" />
      <div className="game__bar">
        <span className="game__score"><i className="game__dot" />◈ {count} / {total}</span>
        <button className="game__sound" onClick={() => setSound((s) => !s)} aria-label={sound ? 'Mute sound' : 'Unmute sound'}>{sound ? '♪' : '♪̶'}</button>
        <button className="game__exit" onClick={onExit}>exit ✕</button>
      </div>
      <p className="game__help">
        <b>← →</b> move &nbsp;·&nbsp; <b>space</b> flap &nbsp;·&nbsp; <b>↓</b> drop &nbsp;·&nbsp; <b>↑</b> {hint === 'door' ? 'enter the door' : hint === 'treasure' ? 'grab it' : 'find the door'} &nbsp;·&nbsp; page still scrolls &amp; clicks
      </p>
      {reveal && (
        <div className="game__reveal">
          <div className="game__reveal-card">
            <span className="game__reveal-mark">✦</span>
            <h3>You found everything.</h3>
            <p>Thanks for exploring. Now go hire this guy.</p>
          </div>
        </div>
      )}
      <div className="game__pad" aria-hidden="true">
        <div className="game__dpad">
          <button className="gk" {...hold('left')}>←</button>
          <button className="gk" {...hold('right')}>→</button>
        </div>
        <div className="game__acts">
          <button className="gk" {...hold('jump')}>jump</button>
          <button className={`gk gk--go${hint ? ' on' : ''}`} {...hold('enter')}>{hint === 'door' ? 'enter' : hint === 'treasure' ? 'grab' : '↑'}</button>
        </div>
      </div>
    </div>
  );
}

function drawCat(ctx: CanvasRenderingContext2D, b: { x: number; y: number; face: number; vx: number; onGround: boolean; walk: number; squash: number }) {
  const w = 16 * PX, h = 16 * PX;
  const walking = b.onGround && Math.abs(b.vx) > 0.3;
  const t = Date.now() * 0.005;
  const walkBob = walking ? Math.abs(Math.sin(b.walk)) * 2 : 0;
  const idle = b.onGround && !walking ? Math.sin(t) * 0.5 + 0.5 : 0;
  const bob = walkBob + idle * 2.2;
  const sq = b.squash * 3 + idle * 1.2;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(b.x, b.y + 2, 18, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.translate(b.x, b.y - bob);
  ctx.scale(b.face, 1);
  const ox = -w / 2, oy = -h + sq;
  for (let r = 0; r < CAT.length; r++) {
    for (let c = 0; c < CAT[r].length; c++) {
      const ch = CAT[r][c];
      if (ch === '.') continue;
      ctx.fillStyle = CAT_COLORS[ch] || '#fff';
      ctx.fillRect(ox + c * PX, oy + r * PX, PX + 0.5, PX + 0.5);
    }
  }
  ctx.restore();
}

function drawTreasure(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const fy = y - 18 + Math.sin(Date.now() * 0.004) * 4;
  ctx.save();
  ctx.translate(x, fy); ctx.rotate(Math.PI / 4);
  ctx.shadowColor = ACCENT; ctx.shadowBlur = 16;
  ctx.fillStyle = ACCENT; ctx.fillRect(-7, -7, 14, 14);
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(-7, -7, 6, 6);
  ctx.restore();
}

function drawDoor(ctx: CanvasRenderingContext2D, x: number, y: number, active: boolean) {
  ctx.save();
  ctx.strokeStyle = active ? ACCENT : 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2.5;
  if (active) { ctx.shadowColor = ACCENT; ctx.shadowBlur = 18; }
  roundRect(ctx, x - 17, y - 52, 34, 52, 8); ctx.stroke();
  ctx.fillStyle = active ? 'rgba(111,242,192,0.14)' : 'rgba(255,255,255,0.04)'; ctx.fill();
  ctx.fillStyle = active ? ACCENT : 'rgba(255,255,255,0.6)';
  ctx.beginPath(); ctx.arc(x + 8, y - 26, 2.4, 0, Math.PI * 2); ctx.fill();
  if (active) {
    ctx.fillStyle = ACCENT; ctx.font = "600 11px 'JetBrains Mono', ui-monospace, monospace"; ctx.textAlign = 'center';
    ctx.fillText('↑', x, y - 64);
  }
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
