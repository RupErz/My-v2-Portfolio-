import { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';

/**
 * Interactive background with two modes (toggle bottom-right):
 *   focus — zero-gravity skill tokens you drag and toss (calm, professional).
 *   play  — gravity on + a target ring; fling tokens through it to score (minigame).
 * Custom-drawn, monochrome. Reduced-motion: tokens start still (move only on drag).
 */

const TOKENS = ['React Native', 'TypeScript', 'Expo', 'LLM API', 'C#/.NET', 'Azure DevOps', 'MSSQL', 'React'];

export default function PhysicsField() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'focus' | 'play'>('focus');
  const [score, setScore] = useState(0);
  const api = useRef<{ setMode?: (m: 'focus' | 'play') => void }>({});

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint, Events } = Matter;

    const engine = Engine.create();
    engine.gravity.scale = 0;
    const world = engine.world;

    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const WALL = 260;
    let walls: Matter.Body[] = [];
    const buildWalls = () => {
      walls = [
        Bodies.rectangle(W / 2, -WALL / 2, W + WALL * 2, WALL, { isStatic: true, restitution: 0.9 }),
        Bodies.rectangle(W / 2, H + WALL / 2, W + WALL * 2, WALL, { isStatic: true, restitution: 0.9 }),
        Bodies.rectangle(-WALL / 2, H / 2, WALL, H + WALL * 2, { isStatic: true, restitution: 0.9 }),
        Bodies.rectangle(W + WALL / 2, H / 2, WALL, H + WALL * 2, { isStatic: true, restitution: 0.9 }),
      ];
      Composite.add(world, walls);
    };
    buildWalls();

    // Skill tokens (labeled pills)
    const labelOf = new Map<number, string>();
    const spots = [
      [0.16, 0.26], [0.83, 0.7], [0.24, 0.74], [0.88, 0.24],
      [0.1, 0.55], [0.74, 0.42], [0.5, 0.86], [0.6, 0.14],
    ];
    const tokens = TOKENS.map((t, i) => {
      const w = t.length * 8.6 + 30;
      const h = 34;
      const [sx, sy] = spots[i % spots.length];
      const b = Bodies.rectangle(sx * W, sy * H, w, h, {
        chamfer: { radius: 17 },
        frictionAir: 0.03,
        restitution: 0.7,
        density: 0.0018,
      });
      labelOf.set(b.id, t);
      if (!reduce) Body.setVelocity(b, { x: (Math.random() - 0.5) * 1.2, y: (Math.random() - 0.5) * 1.2 });
      return b;
    });
    Composite.add(world, tokens);

    // Target ring (only used in play mode)
    let target = Bodies.circle(W * 0.5, H * 0.24, 58, { isStatic: true, isSensor: true });

    const mouse = Mouse.create(canvas);
    const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.18, render: { visible: false } } });
    Composite.add(world, mc);
    canvas.removeEventListener('wheel', (mouse as any).mousewheel);

    let curMode: 'focus' | 'play' = 'focus';
    const scoredCooldown = new Set<number>();
    Events.on(engine, 'collisionStart', (e) => {
      if (curMode !== 'play') return;
      for (const pair of e.pairs) {
        const other = pair.bodyA === target ? pair.bodyB : pair.bodyB === target ? pair.bodyA : null;
        if (other && labelOf.has(other.id) && !scoredCooldown.has(other.id)) {
          scoredCooldown.add(other.id);
          setScore((s) => s + 1);
          Body.setPosition(other, { x: 40 + Math.random() * (W - 80), y: H - 60 });
          Body.setVelocity(other, { x: 0, y: 0 });
          setTimeout(() => scoredCooldown.delete(other.id), 400);
        }
      }
    });

    api.current.setMode = (m) => {
      curMode = m;
      if (m === 'play') {
        engine.gravity.scale = 0.0011;
        engine.gravity.y = 1;
        Composite.add(world, target);
        for (const b of tokens) Body.setVelocity(b, { x: (Math.random() - 0.5) * 4, y: -3 - Math.random() * 4 });
      } else {
        engine.gravity.scale = 0;
        Composite.remove(world, target);
      }
    };

    function roundedPath(b: Matter.Body) {
      const v = b.vertices;
      ctx.beginPath();
      ctx.moveTo(v[0].x, v[0].y);
      for (let i = 1; i < v.length; i++) ctx.lineTo(v[i].x, v[i].y);
      ctx.closePath();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      if (curMode === 'play') {
        // target ring
        ctx.beginPath();
        ctx.arc(target.position.x, target.position.y, 58, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.setLineDash([6, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.font = "500 11px 'JetBrains Mono', monospace";
        ctx.textAlign = 'center';
        ctx.fillText('fling in', target.position.x, target.position.y + 4);
      }
      for (const b of tokens) {
        const grabbed = mc.body === b;
        roundedPath(b);
        ctx.fillStyle = grabbed ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.04)';
        ctx.fill();
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = grabbed ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.26)';
        ctx.stroke();
        // label
        ctx.save();
        ctx.translate(b.position.x, b.position.y);
        ctx.rotate(b.angle);
        ctx.fillStyle = grabbed ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.62)';
        ctx.font = "500 12.5px 'JetBrains Mono', monospace";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelOf.get(b.id) || '', 0, 1);
        ctx.restore();
      }
    }

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(32, now - last);
      last = now;
      if (!document.hidden) {
        Engine.update(engine, dt);
        draw();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    let rt: number;
    const onResize = () => {
      window.clearTimeout(rt);
      rt = window.setTimeout(() => {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W;
        canvas.height = H;
        Composite.remove(world, walls);
        buildWalls();
        Body.setPosition(target, { x: W * 0.5, y: H * 0.24 });
      }, 160);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.clearTimeout(rt);
      Composite.clear(world, false);
      Engine.clear(engine);
      api.current.setMode = undefined;
    };
  }, []);

  // push mode changes into the engine
  useEffect(() => {
    api.current.setMode?.(mode);
  }, [mode]);

  return (
    <>
      <canvas ref={ref} className="physics-field" aria-label="Interactive background — drag the skill tokens" />
      <div className="phys-ui">
        {mode === 'play' && <span className="phys-score">score {score}</span>}
        <button
          className={`phys-toggle ${mode === 'play' ? 'on' : ''}`}
          onClick={() => { setScore(0); setMode((m) => (m === 'focus' ? 'play' : 'focus')); }}
          aria-pressed={mode === 'play'}
        >
          {mode === 'focus' ? 'play mode' : 'focus mode'}
        </button>
      </div>
    </>
  );
}
