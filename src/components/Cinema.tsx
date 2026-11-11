import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from 'framer-motion';
import { ArrowRight, ArrowLeft, ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, Mail, FileText, Maximize2, X } from 'lucide-react';
import AsciiPortrait from './AsciiPortrait';
import GameMode from './GameMode';
import PhotoJournal from './PhotoJournal';
import './cinema.css';

type ScreenId = 'home' | 'about' | 'work' | 'experience' | 'contact';

const ORDER: ScreenId[] = ['home', 'work', 'about', 'experience', 'contact'];

const DEST: { id: ScreenId; no: string; title: string; sub: string }[] = [
  { id: 'work', no: '01', title: 'Work', sub: 'what I’ve shipped' },
  { id: 'about', no: '02', title: 'About', sub: 'who I am' },
  { id: 'experience', no: '03', title: 'Experience', sub: 'where I’ve been' },
  { id: 'contact', no: '04', title: 'Contact', sub: 'get in touch' },
];

const PROJECTS: {
  title: string; tag: string; year: string; desc: string; tagline: string;
  lede: string; contribution: string; context: string; pills: string[]; links: { label: string; href: string }[];
  features: { title: string; body: string; key?: boolean }[];
  device: 'phone' | 'browser' | 'flat'; accent: string;
  cover?: string; status?: string;
  shots: { src: string; cap: string }[];
}[] = [
  {
    title: 'Nest',
    status: 'Ongoing',
    tag: 'Mobile app',
    year: '2026',
    device: 'phone',
    accent: '#5FD3A0',
    cover: '/covers/nest.png',
    desc: 'The app does the math, the AI just explains it.',
    tagline: "Know where your money goes.",
    lede: "Track expenses, sort spending, and see how your month is shaping up. An AI coach explains the numbers in plain language.",
    contribution: "Solo developer · Mobile app and AI integration",
    context: "Building since Feb 2026 · In development",
    pills: ["React Native", "TypeScript", "Gemini API", "Jest"],
    links: [],
    features: [
      { title: "Keep the money math in code", key: true, body: "Every figure is computed by the app. Gemini reads that data to explain it, with a reminder to check the numbers." },
      { title: "Forecast against a spending range", body: "Pulse projects month-end spending against minimum and standard bands. The math layer is covered by 49 Jest unit tests." },
      { title: "Make categorization a swipe", body: "Sort expenses into Wasted, Nice, or Must with a swipe deck, making routine categorization easier to keep up with." },
    ],
    shots: [
      { src: '/shots/nest-01-capture-tab.png', cap: 'Capture · quick entry with a logging streak and a sort deadline' },
      { src: '/shots/nest-02-triage-swipe.png', cap: 'Triage · swipe each expense into Wasted / Nice / Must' },
      { src: '/shots/nest-03-coach.png', cap: 'Coach · reads computed Nest data, answers in plain language' },
      { src: '/shots/nest-04-pulse.png', cap: 'Pulse · spend pace against the band, with a projected month-end total' },
    ],
  },
  {
    title: 'Resumize',
    tag: 'Web app',
    year: '2025',
    device: 'browser',
    accent: '#6EA8FF',
    cover: '/covers/resumize.png',
    desc: 'ATS resume scoring with a LaTeX compiled rewrite.',
    tagline: "A clearer resume for your next application.",
    lede: "Compare a PDF or DOCX resume with a job description, identify skills gaps, and download a rewritten PDF.",
    contribution: "Team lead · AI integration and UI design",
    context: "Senior capstone · 100+ active users",
    pills: ["Next.js 15", "FastAPI", "PostgreSQL", "Docker", "Gemini"],
    links: [{ label: 'live demo', href: 'https://resume-analyzer-seven-omega.vercel.app/' }],
    features: [
      { title: "Compile a real PDF", key: true, body: "A dedicated LaTeX service builds the rewritten document. Suggestions reframe existing experience without inventing new claims." },
      { title: "Match the actual job description", body: "Skills are marked strong, listed but undemonstrated, or missing. Targeted rewrites connect the resume to the specific posting." },
      { title: "Separate document processing", body: "Two FastAPI services handle document analysis and PDF compilation, alongside Postgres in Docker Compose. MarkItDown extracts PDF text and mammoth handles DOCX." },
    ],
    shots: [
      { src: '/shots/resumize-03-analysis-report.png', cap: 'Analysis · ATS score, skills match, and targeted rewrites against a real posting' },
      { src: '/shots/resumize-01-resume-preview.png', cap: 'Preview · LaTeX compiled output, reviewable before download' },
      { src: '/shots/resumize-02-dashboard.png', cap: 'Dashboard · saved analyses, editable again' },
    ],
  },
  {
    title: 'FoodPrint',
    tag: 'Mobile · PennApps',
    year: '2025',
    device: 'phone',
    accent: '#9BD64A',
    cover: '/covers/foodprint.png',
    desc: 'Live food detection with a carbon footprint.',
    tagline: "See the footprint of your food.",
    lede: "Scan food with your camera to see estimated carbon emissions, water usage, and a sustainability score. Compare your results on a shared leaderboard.",
    contribution: "React Native frontend · Backend integration",
    context: "Team of four · Built at PennApps",
    pills: ["React Native", "Flask", "YOLO", "OpenCV", "Cerebras"],
    links: [{ label: 'Devpost', href: 'https://devpost.com/software/foodprint-msad2x' }],
    features: [
      { title: "Connect live detection to the camera view", key: true, body: "Render bounding boxes and carbon labels in React Native while detection runs in the Python backend. This was our first computer vision project." },
      { title: "Make model output predictable", body: "Use pretrained detection models and require strict JSON from the LLM, so the app can read emissions data consistently." },
      { title: "Test on real phones", body: "Hackathon wifi blocked device debugging. Personal hotspots let us connect the app to the backend and test on our phones." },
    ],
    shots: [
      { src: '/shots/foodprint-01-live-detection.webp', cap: 'Live detection · bounding box and inline CO₂ per kg label' },
      { src: '/shots/foodprint-02-scan-results.png', cap: 'Results · CO₂ footprint, water usage, sustainability score' },
    ],
  },
  {
    title: 'LinguaLens',
    tag: 'Vision Pro · HackHarvard',
    year: '2025',
    device: 'flat',
    accent: '#B98CFF',
    cover: '/covers/lingualens.png',
    desc: 'Language practice from what is around you.',
    tagline: "Practice a language with what’s around you.",
    lede: "Turn a photo of your surroundings into a speaking exercise on Apple Vision Pro, with generated prompts and feedback on your answers.",
    contribution: "Built with a team · First VisionOS and Swift project",
    context: "Weekend prototype · Built at HackHarvard",
    pills: ["VisionOS", "SwiftUI", "FastAPI", "Gemini"],
    links: [{ label: 'Devpost', href: 'https://devpost.com/software/word-quest-7q543n' }],
    features: [
      { title: "Complete the practice loop", key: true, body: "Detect an object, generate a sentence with a blank, listen to the spoken answer, and give feedback. FastAPI connects the headset with Gemini." },
      { title: "Build around still photos", body: "Use still images when live passthrough camera access is unavailable. Detected objects become the basis for each speaking prompt." },
      { title: "Protect the core experience", body: "Cut eye tracking and live view to focus on the speaking loop, working within the headset’s constraints, a tight token budget, and a weekend deadline." },
    ],
    shots: [
      { src: '/shots/lingualens-03-speaking-prompt.webp', cap: 'Speaking prompt · fill in the blank, live mic, transcribed answer' },
      { src: '/shots/lingualens-04-object-prompt.webp', cap: 'Prompt generated from a detected object in the scene' },
      { src: '/shots/lingualens-02-language-setup.webp', cap: 'Setup · native and target language, plus difficulty' },
      { src: '/shots/lingualens-01-entry.webp', cap: 'Entry screen' },
    ],
  },
  {
    title: 'PrepBot',
    tag: 'Web app',
    year: '2025',
    device: 'browser',
    accent: '#F4B24C',
    cover: '/covers/prepbot.png',
    desc: 'Voice interview practice, scored.',
    tagline: "Interview practice, out loud.",
    lede: "Practice a role-specific interview with a voice agent, then review your transcript and scored feedback before trying again.",
    contribution: "Solo developer · Auth, voice sessions and feedback",
    context: "First end to end LLM project",
    pills: ["Next.js 14", "TypeScript", "Firebase", "Vapi", "Gemini"],
    links: [
      { label: 'visit site', href: 'https://prep-bot-navy.vercel.app/' },
      { label: 'GitHub', href: 'https://github.com/RupErz/PrepBot' },
    ],
    features: [
      { title: "Keep the voice session in sync", key: true, body: "Manage Vapi call state, voice activity, and streaming transcripts together so the interface follows the conversation." },
      { title: "Make practice reviewable", body: "Generate interviews by role, stack, and difficulty with Gemini. Save interviews and scored feedback in Firestore so users can revisit their practice." },
      { title: "Protect access on the server", body: "Use server-side authentication with httpOnly session cookies and protected routes, rather than relying on client-side Firebase checks." },
    ],
    shots: [
      { src: '/shots/prepbot-01-interview-generation.png', cap: 'Generation · voice agent and candidate, call ready to start' },
      { src: '/shots/prepbot-02-interview-dashboard.png', cap: 'Dashboard · interviews by role and type, each scored out of 100' },
    ],
  },
];

const EXPERIENCE: {
  tab: string; company: string; role: string; meta: string; dates: string;
  bullets: string[]; stack: string[]; summary?: string; description?: string[];
}[] = [
  {
    tab: 'Research',
    company: 'Arkansas State University',
    role: 'Research Assistant',
    meta: 'Autonomous robotics',
    dates: 'Sep 2026 to Present',
    summary: 'Developing SLAM mapping for an autonomous delivery robot that combines real-time object detection with lidar, under a professor specializing in machine learning and security.',
    description: [
      'I work on a Hiwonder JetAcker robot running on an NVIDIA Jetson Orin Nano, as part of a research project focused on the security and reliability of autonomous delivery robots. My current work is developing a feature that enables SLAM mapping by combining two very different sensors: a YOLOv5s object detection model, accelerated with TensorRT, reading from an Astra Pro Plus depth camera, and a SLAMTEC lidar that measures where things are in space.',
      'I build and adapt Python ROS 2 Humble nodes that bring this data together, using slam_toolbox for mapping, Nav2 for navigation, and RViz to visualize what the robot sees. All development happens remotely on the robot over SSH, tracked in Git. Alongside the mapping work, I’m helping investigate security weaknesses in the robot’s perception models, the part of the system that decides what’s in front of it.',
      'It’s the most hands-on engineering I’ve done. Code that looks right on screen still has to work on real hardware, in a real room.',
    ],
    bullets: [
      'Developing a SLAM mapping feature that combines TensorRT YOLOv5s detection with lidar data.',
      'Building and adapting Python ROS 2 nodes on an NVIDIA Jetson Orin Nano.',
      'Mapping and navigation with slam_toolbox, Nav2, and RViz.',
      'Investigating security weaknesses in the robot’s perception models.',
    ],
    stack: ['Python', 'ROS 2 Humble', 'rclpy', 'YOLOv5s', 'TensorRT', 'NVIDIA Jetson Orin Nano', 'SLAMTEC Lidar', 'Astra Pro Plus', 'slam_toolbox', 'Nav2', 'RViz', 'Linux', 'SSH', 'Git'],
  },
  {
    tab: 'Arkansas State',
    company: 'Arkansas State University',
    role: 'Graduate Assistant',
    meta: 'Computer Science',
    dates: 'Jan 2026 to Present',
    bullets: [
      'Support 100+ students across Object Oriented Programming and Data Structures and Algorithms in C++.',
      'Lead weekly lab sessions and hold office hours, debugging student code and working through algorithmic concepts one on one.',
      'Grade assignments and give written feedback on code quality and correctness.',
    ],
    stack: ['C++'],
  },
  {
    tab: 'Nucor',
    company: 'Nucor Corporation',
    role: 'Software Development Engineering Intern',
    meta: 'Blytheville, AR',
    dates: 'May 2024 to Aug 2024',
    bullets: [
      'Resolved 12+ production support tickets for internal applications at North America’s largest steel producer.',
      'Root caused data integrity defects in form submissions across application logic and the SQL Server layer.',
      'Investigated a stale data defect traced to a SQL Server synonym resolving to an external source.',
      'Shipped fixes in an enterprise C#/.NET codebase through Azure DevOps with PR review and gated release.',
    ],
    stack: ['C#', '.NET', 'Microsoft SQL Server', 'T-SQL', 'Azure DevOps'],
  },
];

/* ---------- URL state: #/work, #/work/nest ---------- */
const slugOf = (title: string) => title.toLowerCase();

function parseHash(): { screen: ScreenId; project: number | null } {
  const [s, p] = window.location.hash.replace(/^#\/?/, '').split('/');
  const screen = ORDER.includes(s as ScreenId) ? (s as ScreenId) : 'home';
  const idx = screen === 'work' && p ? PROJECTS.findIndex((x) => slugOf(x.title) === p) : -1;
  return { screen, project: idx >= 0 ? idx : null };
}

function toHash(screen: ScreenId, project: number | null) {
  if (screen === 'home') return '';
  if (screen === 'work' && project !== null) return `#/work/${slugOf(PROJECTS[project].title)}`;
  return `#/${screen}`;
}

export default function Cinema() {
  const [screen, setScreen] = useState<ScreenId>('home');
  const [project, setProject] = useState<number | null>(null);
  const reduce = useReducedMotion();
  const dur = reduce ? 0 : 0.6;
  const baseTitle = useRef('');

  const [game, setGame] = useState(false);
  const active = DEST.find((d) => d.id === screen);

  const navigate = (id: ScreenId, p: number | null = null) => {
    setScreen(id);
    setProject(p);
    const h = toHash(id, p);
    if (h !== window.location.hash) {
      window.history.pushState(null, '', h || window.location.pathname + window.location.search);
    }
  };
  const go = (id: ScreenId) => navigate(id, null);
  const openProject = (p: number | null) => navigate('work', p);

  // restore from the URL on load, and follow Back / Forward
  useEffect(() => {
    const apply = () => {
      const s = parseHash();
      setScreen(s.screen);
      setProject(s.project);
    };
    apply();
    window.addEventListener('popstate', apply);
    return () => window.removeEventListener('popstate', apply);
  }, []);

  // one title per view, so tabs and history entries are distinguishable
  useEffect(() => {
    baseTitle.current ||= document.title;
    const parts: string[] = [];
    if (project !== null) parts.push(PROJECTS[project].title);
    if (screen !== 'home' && active) parts.push(active.title);
    document.title = parts.length ? `${parts.join(', ')} | Nghia Vu` : baseTitle.current;
  }, [screen, project, active]);

  useEffect(() => {
    if (game) return; // in game mode the arrows drive the bot
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.querySelector('.lightbox')) return; // the lightbox owns the keys while open
      const idx = ORDER.indexOf(screen);
      if (e.key === 'ArrowRight' && idx < ORDER.length - 1) { e.preventDefault(); go(ORDER[idx + 1]); }
      else if (e.key === 'ArrowLeft' && idx > 0) { e.preventDefault(); go(ORDER[idx - 1]); }
      else if (e.key === 'Escape' && project !== null) { e.preventDefault(); openProject(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, project, game]);

  return (
    <div className={`cinema ${screen === 'home' ? 'is-home' : 'is-inner'}${screen === 'about' ? ' cinema--journal' : ''}${game ? ' game-on' : ''}`}>
      {!reduce && <CustomCursor />}
      <SideNav screen={screen} go={go} />
      <Backdrop />
      <header className="topbar">
        <button className="topbar__brand-mono" onClick={() => go('home')}>nghia vu</button>
        <div className="topbar__right">
          <nav className="topnav" aria-label="Sections">
            {DEST.map((d) => (
              <button key={d.id} onClick={() => go(d.id)} aria-current={screen === d.id ? 'page' : undefined}>{d.title.toLowerCase()}</button>
            ))}
          </nav>
          <button className="gamebtn" onClick={() => setGame(true)} aria-label="Enter game mode">
            <span className="gamebtn__dot" /> game mode
          </button>
        </div>
      </header>

      {game && (
        <GameMode
          screen={screen}
          order={ORDER}
          go={(id) => go(id as ScreenId)}
          onExit={() => setGame(false)}
        />
      )}

      <AnimatePresence mode="wait">
        {screen === 'home' ? (
          <motion.main
            key="home"
            className="screen screen--home"
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.03, filter: 'blur(6px)' }}
            transition={{ duration: dur, ease: [0.16, 1, 0.3, 1] }}
          >
            <HomeCenter go={go} />
          </motion.main>
        ) : (
          <motion.main
            key={screen}
            className="screen"
            initial={{ opacity: 0, y: reduce ? 0 : 44, filter: reduce ? 'none' : 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: reduce ? 0 : 30, filter: reduce ? 'none' : 'blur(6px)' }}
            transition={{ duration: dur, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="screen__scroll">
              <div className={`stage${screen === 'about' ? ' stage--about' : ''}`}>
                {screen !== 'work' && (
                  <div className="screen__head">
                    <h1 className="screen__title">{active?.title}</h1>
                  </div>
                )}
                {screen === 'about' && <PhotoJournal onOpenNest={() => openProject(0)} />}
                {screen === 'work' && <Work reduce={!!reduce} project={project} setProject={openProject} />}
                {screen === 'experience' && <Experience />}
                {screen === 'contact' && <Contact />}
              </div>
            </div>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}

function SideNav({ screen, go }: { screen: ScreenId; go: (id: ScreenId) => void }) {
  const idx = ORDER.indexOf(screen);
  const prev = idx > 0 ? ORDER[idx - 1] : null;
  const next = idx < ORDER.length - 1 ? ORDER[idx + 1] : null;
  const label = (id: ScreenId) => (id === 'home' ? 'home' : DEST.find((d) => d.id === id)?.title.toLowerCase() ?? id);
  return (
    <>
      {prev && (
        <button className="sidenav sidenav--prev" onClick={() => go(prev)} aria-label={`Previous section: ${label(prev)}`}>
          <span className="sidenav__ring"><ChevronLeft size={19} aria-hidden="true" /></span>
          <span className="sidenav__label">{label(prev)}</span>
        </button>
      )}
      {next && (
        <button className="sidenav sidenav--next" onClick={() => go(next)} aria-label={`Next section: ${label(next)}`}>
          <span className="sidenav__label">{label(next)}</span>
          <span className="sidenav__ring"><ChevronRight size={19} aria-hidden="true" /></span>
        </button>
      )}
    </>
  );
}

function CustomCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const rx = useSpring(x, { stiffness: 350, damping: 30, mass: 0.4 });
  const ry = useSpring(y, { stiffness: 350, damping: 30, mass: 0.4 });
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const root = document.documentElement;
    root.classList.add('has-cursor');
    const move = (e: PointerEvent) => { x.set(e.clientX); y.set(e.clientY); setVisible(true); };
    const over = (e: PointerEvent) => {
      const t = e.target as Element | null;
      setActive(!!(t && t.closest && t.closest('a,button,[role="button"],input,textarea,select,label,summary')));
    };
    const hide = () => setVisible(false);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerover', over, { passive: true });
    document.addEventListener('mouseleave', hide);
    window.addEventListener('blur', hide);
    return () => {
      root.classList.remove('has-cursor');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerover', over);
      document.removeEventListener('mouseleave', hide);
      window.removeEventListener('blur', hide);
    };
  }, [x, y]);

  return (
    <>
      <motion.div
        className={`cursor-ring${active ? ' is-active' : ''}`}
        aria-hidden="true"
        style={{ x: rx, y: ry, opacity: visible ? 1 : 0 }}
        animate={{ scale: active ? 1.59 : 1 }}
        transition={{ scale: { duration: 0.22 } }}
      />
      <motion.div className="cursor-dot" aria-hidden="true" style={{ x, y, opacity: visible ? 1 : 0 }} />
    </>
  );
}

function Backdrop() {
  return (
    <div className="backdrop">
      <div className="backdrop__grain" aria-hidden="true" />
      <div className="backdrop__vignette" aria-hidden="true" />
    </div>
  );
}

function HomeCenter({ go }: { go: (id: ScreenId) => void }) {
  // the intro is CSS, so the hero is already visible in the server HTML
  return (
    <div className="home-split">
      <div className="home-split__portrait rise" style={{ ['--i' as string]: 0 } as React.CSSProperties}>
        <AsciiPortrait />
      </div>
      <div className="home-split__intro">
        <p className="home-split__kicker rise" style={{ ['--i' as string]: 1 } as React.CSSProperties}>AI and mobile engineer</p>
        <h1 className="home-split__hi rise" style={{ ['--i' as string]: 2 } as React.CSSProperties}>
          hi, I’m <span className="accent">Nghia</span>.<span className="home-split__caret" aria-hidden="true">|</span>
        </h1>
        <p className="home-split__bio rise" style={{ ['--i' as string]: 3 } as React.CSSProperties}>
          I’m a rising new grad, into finance and AI. Right now I’m building Nest, a fintech
          mobile app headed to the App Store, with a whole lot of love :) Resumize already has
          100+ active users.
        </p>
        <div className="home-split__cta rise" style={{ ['--i' as string]: 4 } as React.CSSProperties}>
          <button className="say-hi" onClick={() => go('work')}>
            see the work <ArrowRight size={16} />
          </button>
          <a className="ghost-link" href="/NghiaVu_Resume.pdf" target="_blank" rel="noreferrer"><FileText size={16} /> résumé</a>
          <a className="ghost-link" href="mailto:nghiavu144@gmail.com"><Mail size={16} /> say hi</a>
        </div>
      </div>
    </div>
  );
}

/* ---------- Work: hover list + detail ---------- */
function Work({ reduce, project, setProject }: { reduce: boolean; project: number | null; setProject: (p: number | null) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 260, damping: 30 });
  const y = useSpring(my, { stiffness: 260, damping: 30 });
  const hp = hover !== null ? PROJECTS[hover] : null;

  // the cursor-following preview only makes sense with a real hovering pointer
  const [canHover, setCanHover] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(hover: hover) and (pointer: fine)');
    const sync = () => setCanHover(m.matches);
    sync();
    m.addEventListener('change', sync);
    return () => m.removeEventListener('change', sync);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {project === null ? (
        <motion.div
          key="list"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.35 }}
          onMouseMove={(e) => { mx.set(e.clientX + 26); my.set(e.clientY - 90); }}
        >
          <div className="screen__head">
            <h1 className="screen__title">Work</h1>
          </div>
          <div className="work__list">
            {PROJECTS.map((p, i) => (
              <button
                key={i}
                className="work__row"
                style={{ ['--accent' as string]: p.accent }}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover((h) => (h === i ? null : h))}
                onClick={() => setProject(i)}
              >
                <div>
                  <div className="work__row-main">
                    <span className="work__row-title">{p.title}</span>
                    <span className="work__row-tag">{p.tag}</span>
                    {p.status && <span className="work__status">{p.status}</span>}
                  </div>
                  <div className="work__row-desc">{p.desc}</div>
                </div>
                <span className="work__row-year">{p.year}</span>
              </button>
            ))}
          </div>
          {!reduce && canHover && (
            <motion.div
              className="work__preview"
              style={{ x, y, top: 0, left: 0, opacity: hp ? 1 : 0, scale: hp ? 1 : 0.9 }}
              transition={{ opacity: { duration: 0.22 }, scale: { duration: 0.22 } }}
              aria-hidden="true"
            >
              {hp && (
                <div
                  className={`work__preview-card work__preview-card--${hp.device}`}
                  style={{ ['--accent' as string]: hp.accent }}
                >
                  <img src={hp.cover ?? hp.shots[0].src} alt="" />
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      ) : (
        <motion.div
          key="detail"
          initial={{ opacity: 0, y: reduce ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduce ? 0 : 16 }}
          transition={{ duration: reduce ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <button className="back-btn work__back" onClick={() => setProject(null)}>
            <ArrowLeft /> Back to work
          </button>
          <Detail p={PROJECTS[project]} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Detail({ p }: { p: (typeof PROJECTS)[number] }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [open, setOpen] = useState<Set<number>>(
    () => new Set(p.features.map((f, k) => (f.key ? k : -1)).filter((k) => k >= 0)),
  );
  const toggle = (k: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  const shots = p.shots;
  const cur = shots[i] ?? null;
  const src = cur?.src ?? null;
  const img = src
    ? <img src={src} alt={`${p.title} · ${cur?.cap ?? 'screenshot'}`} />
    : <div className="frame__ph">[[ {p.title} screenshot ]]</div>;

  const closeRef = useRef<HTMLButtonElement>(null);

  // lightbox: own the keys, step through shots, trap focus, give focus back on close
  useEffect(() => {
    if (!zoom) return;
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const many = shots.length > 1;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); setZoom(false); }
      else if (e.key === 'ArrowRight' && many) { e.preventDefault(); setI((v) => (v + 1) % shots.length); }
      else if (e.key === 'ArrowLeft' && many) { e.preventDefault(); setI((v) => (v - 1 + shots.length) % shots.length); }
      else if (e.key === 'Tab') {
        const f = Array.from(document.querySelectorAll<HTMLElement>('.lightbox button'));
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      opener?.focus?.();
    };
  }, [zoom, shots.length]);

  return (
    <div className="detail" style={{ ['--accent' as string]: p.accent }}>
      <div className="detail__body">
        <div className="detail__head">
          <h1 className="detail__name">{p.title}</h1>
          <span className="detail__meta">{p.tag} · {p.year}</span>
        </div>
        <p className="detail__tagline">{p.tagline}</p>
        <p className="detail__lede">{p.lede}</p>
        <dl className="detail__contribution">
          <div><dt>My part</dt><dd>{p.contribution}</dd></div>
          <div><dt>Context</dt><dd>{p.context}</dd></div>
        </dl>
        <div className="feat">
          <h2 className="detail__section-title">Key decisions</h2>
          {p.features.map((f, k) => {
            const isOpen = open.has(k);
            return (
              <div className={`feat__row${f.key ? ' feat__row--key' : ''}${isOpen ? ' is-open' : ''}`} key={k}>
                <button className="feat__head" onClick={() => toggle(k)} aria-expanded={isOpen} aria-controls={`${slugOf(p.title)}-decision-${k}`}>
                  <span className="feat__title">
                    {f.key && <i className="feat__mark" aria-hidden="true" />}
                    {f.title}
                  </span>
                  <ChevronDown className="feat__chev" size={18} aria-hidden="true" />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      className="feat__reveal"
                      id={`${slugOf(p.title)}-decision-${k}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <p className="feat__body">{f.body}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
        <div className="detail__tools">
          <h2 className="detail__section-title">Built with</h2>
          <div className="detail__pills">
            {p.pills.map((t) => <span className="pill" key={t}>{t}</span>)}
          </div>
          {p.links.length > 0 && <div className="detail__links">
            {p.links.map((l) => <a href={l.href} key={l.href} target="_blank" rel="noreferrer">{l.label}<ArrowUpRight size={16} aria-hidden="true" /></a>)}
          </div>}
        </div>
      </div>
      <div className="detail__device">
        <button
          type="button"
          className={`shotframe shotframe--${p.device}`}
          onClick={() => src && setZoom(true)}
          aria-label={src ? `Enlarge ${p.title} screenshot` : undefined}
        >
          {p.device === 'browser' ? (
            <div className="browser">
              <div className="browser__bar">
                <i /><i /><i />
                <span className="browser__addr">{p.links[0]?.href ? new URL(p.links[0].href).host : 'localhost:3000'}</span>
              </div>
              <div className="browser__view">{img}</div>
            </div>
          ) : p.device === 'flat' ? (
            <div className="flat">{img}</div>
          ) : (
            <div className="phone">{img}</div>
          )}
          {src && <span className="shotframe__zoom"><Maximize2 size={13} /> tap to enlarge</span>}
        </button>
        {cur && <p className="shotcap">{cur.cap}</p>}
        {shots.length > 1 && (
          <div className="shotthumbs">
            {shots.map((s, k) => (
              <button
                key={s.src}
                className={k === i ? 'on' : ''}
                onClick={() => setI(k)}
                aria-label={`View ${s.cap}`}
              >
                <img src={s.src} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>

      {typeof document !== 'undefined' && createPortal(
      <AnimatePresence>
        {zoom && cur && (
          <motion.div
            className="lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={`${p.title} screenshot`}
            style={{ ['--accent' as string]: p.accent }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => setZoom(false)}
          >
            <motion.figure
              className={`lightbox__stage lightbox__stage--${p.device}`}
              initial={{ scale: 0.94, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 8 }}
              transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <img src={cur.src} alt={`${p.title} · ${cur.cap}`} />
              <figcaption>{cur.cap}</figcaption>
            </motion.figure>
            {shots.length > 1 && (
              <>
                <button className="lightbox__nav lightbox__nav--prev" onClick={(e) => { e.stopPropagation(); setI((v) => (v - 1 + shots.length) % shots.length); }} aria-label="Previous screenshot">
                  <ChevronLeft size={20} aria-hidden="true" />
                </button>
                <button className="lightbox__nav lightbox__nav--next" onClick={(e) => { e.stopPropagation(); setI((v) => (v + 1) % shots.length); }} aria-label="Next screenshot">
                  <ChevronRight size={20} aria-hidden="true" />
                </button>
              </>
            )}
            <button ref={closeRef} className="lightbox__close" onClick={() => setZoom(false)} aria-label="Close">
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body,
      )}
    </div>
  );
}

function Experience() {
  return (
    <ol className="xp" aria-label="Experience, latest start date first">
      {EXPERIENCE.map((e) => (
        <li className="xp__row" key={`${e.company}-${e.role}`}>
          <div className="xp__when">
            <span className="xp__dates">{e.dates}</span>
            <span className="xp__place">{e.meta}</span>
          </div>
          <div className="xp__body">
            <h2 className="xp__role">{e.role}</h2>
            <p className="xp__co">{e.company}</p>
            {e.summary && <p className="xp__summary">{e.summary}</p>}
            <ul className="xp__bullets">
              {e.bullets.map((b, k) => <li key={k}>{b}</li>)}
            </ul>
            {e.description && (
              <details className="xp__details">
                <summary>More about the research<ChevronDown size={16} aria-hidden="true" /></summary>
                <div className="xp__description">
                  {e.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
              </details>
            )}
            <div className="xp__stack">
              {e.stack.map((t) => <span className="pill" key={t}>{t}</span>)}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.51 11.51 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}
function LinkedinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function Contact() {
  const rows = [
    { label: 'GitHub', hint: 'github.com/RupErz', href: 'https://github.com/RupErz', icon: <GithubIcon /> },
    { label: 'LinkedIn', hint: 'linkedin.com/in/minhnghia-vu', href: 'https://www.linkedin.com/in/minhnghia-vu-784678242/', icon: <LinkedinIcon /> },
    { label: 'Résumé', hint: 'PDF', href: '/NghiaVu_Resume.pdf', icon: <FileText size={18} /> },
  ];
  return (
    <div className="contact">
      <p className="contact-big">Let’s talk about <span className="contact-serif">what you’re building.</span></p>
      <a className="contact-mail" href="mailto:nghiavu144@gmail.com">
        nghiavu144@gmail.com <ArrowUpRight aria-hidden="true" />
      </a>
      <ul className="contact-list">
        {rows.map((r) => (
          <li key={r.label}>
            <a className="contact-link" href={r.href} target="_blank" rel="noreferrer">
              <span className="contact-link__label">{r.icon}{r.label}</span>
              <span className="contact-link__hint">{r.hint}</span>
              <ArrowUpRight className="contact-link__go" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
