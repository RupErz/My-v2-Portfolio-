import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { channels, IDENTITY, type Block } from '../content/channels';
import { Icon } from './Icon';
import { ProfileCard } from './ProfileCard';
import PixelScene from './PixelScene';
import './workspace.css';

type Phase = 'threshold' | 'entering' | 'workspace';

const ENTER_MS = 760;
const BEAT_MS = 400;
const ENTERED_KEY = 'nv_entered_v1';
const NAME_KEY = 'nv_name_v1';

/** Channel categories (Discord-style collapsible groups). */
const CATEGORIES: { id: string; label: string; slugs: string[] }[] = [
  { id: 'start', label: 'start here', slugs: ['welcome', 'intro'] },
  { id: 'work', label: 'the work', slugs: ['how-i-build', 'projects', 'experience'] },
  { id: 'reach', label: 'reach me', slugs: ['contact'] },
];

const LINKS = [
  { id: 'github', label: 'GitHub', icon: 'code', href: '#' },
  { id: 'linkedin', label: 'LinkedIn', icon: 'link', href: '#' },
  { id: 'email', label: IDENTITY.email, icon: 'mail', href: `mailto:${IDENTITY.email}` },
];

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

function channelFromHash(): string | null {
  if (typeof window === 'undefined') return null;
  const slug = window.location.hash.replace(/^#/, '');
  return channels.some((c) => c.slug === slug) ? slug : null;
}

function renderInline(md: string) {
  const parts = md.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? (
      <strong key={i}>{p.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

const CLOCK: Record<string, string> = {
  welcome: '09:41',
  intro: '09:41',
  'how-i-build': '09:42',
  projects: '09:43',
  experience: '09:44',
  contact: '09:45',
};

export default function Workspace() {
  const [phase, setPhase] = useState<Phase>('threshold');
  const [active, setActive] = useState<string>('welcome');
  const [visited, setVisited] = useState<Set<string>>(() => new Set());
  const [revealed, setRevealed] = useState<number>(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [profileOpen, setProfileOpen] = useState(false);
  const [composerHint, setComposerHint] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [guildMenuOpen, setGuildMenuOpen] = useState(false);
  const timers = useRef<number[]>([]);
  const feedRef = useRef<HTMLDivElement>(null);

  const reduce = () => prefersReducedMotion();

  const activeChannel = useMemo(
    () => channels.find((c) => c.slug === active) ?? channels[0],
    [active],
  );

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  useEffect(() => {
    const savedName = typeof window !== 'undefined' ? window.localStorage.getItem(NAME_KEY) : null;
    if (savedName) setVisitorName(savedName);

    // Force the entrance with ?invite or #join (dev / re-share); clears the "entered" flag.
    const forceInvite =
      typeof window !== 'undefined' &&
      (new URLSearchParams(window.location.search).has('invite') || window.location.hash === '#join');
    if (forceInvite) {
      try {
        window.localStorage.removeItem(ENTERED_KEY);
      } catch {
        /* private mode */
      }
      setReady(true);
      return clearTimers; // stay on the threshold
    }

    const hashSlug = channelFromHash();
    const hasEntered =
      typeof window !== 'undefined' && window.localStorage.getItem(ENTERED_KEY) === '1';
    if (hashSlug || hasEntered) {
      const start = hashSlug ?? 'welcome';
      setActive(start);
      setVisited(new Set([start]));
      setRevealed(channels.find((c) => c.slug === start)?.blocks.length ?? 0);
      setPhase('workspace');
    }
    setReady(true);
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playChannel = useCallback((slug: string, alreadyVisited: boolean) => {
    clearTimers();
    const chan = channels.find((c) => c.slug === slug);
    if (!chan) return;
    const total = chan.blocks.length;
    if (alreadyVisited || reduce()) {
      setRevealed(total);
      return;
    }
    setRevealed(0);
    for (let i = 1; i <= total; i++) {
      const t = window.setTimeout(() => setRevealed(i), BEAT_MS * i);
      timers.current.push(t);
    }
  }, []);

  const openChannel = useCallback(
    (slug: string) => {
      setDrawerOpen(false);
      setProfileOpen(false);
      if (slug === active && phase === 'workspace') {
        clearTimers();
        setRevealed(activeChannel.blocks.length);
        setVisited((v) => new Set(v).add(slug));
        return;
      }
      const was = visited.has(slug);
      setActive(slug);
      setVisited((v) => new Set(v).add(slug));
      if (window.location.hash.replace(/^#/, '') !== slug) {
        history.replaceState(null, '', `#${slug}`);
      }
      playChannel(slug, was);
      feedRef.current?.scrollTo({ top: 0 });
    },
    [active, phase, activeChannel, visited, playChannel],
  );

  const enter = useCallback(() => {
    if (phase !== 'threshold') return;
    try {
      window.localStorage.setItem(ENTERED_KEY, '1');
      const nm = visitorName.trim();
      if (nm) window.localStorage.setItem(NAME_KEY, nm);
    } catch {
      /* private mode */
    }
    if (reduce()) {
      setPhase('workspace');
      setVisited(new Set(['welcome']));
      setRevealed(channels[0].blocks.length);
      return;
    }
    setPhase('entering');
    const t1 = window.setTimeout(() => {
      setPhase('workspace');
      setVisited(new Set(['welcome']));
      playChannel('welcome', false);
    }, ENTER_MS);
    timers.current.push(t1);
  }, [phase, playChannel, visitorName]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        setProfileOpen(false);
        setGuildMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggleCategory = (id: string) =>
    setCollapsed((c) => {
      const n = new Set(c);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  /** Replay the invite entrance ("leave" the server). */
  const leaveServer = useCallback(() => {
    try {
      window.localStorage.removeItem(ENTERED_KEY);
    } catch {
      /* private mode */
    }
    clearTimers();
    setGuildMenuOpen(false);
    setDrawerOpen(false);
    setProfileOpen(false);
    setActive('welcome');
    setVisited(new Set());
    setRevealed(0);
    setPhase('threshold');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyInvite = () => {
    try {
      const url = `${window.location.origin}${window.location.pathname}?invite`;
      navigator.clipboard?.writeText(url);
    } catch {
      /* clipboard blocked */
    }
    setGuildMenuOpen(false);
  };

  const onComposerSubmit = (e: FormEvent) => {
    e.preventDefault();
    setComposerHint(true);
    window.setTimeout(() => setComposerHint(false), 3200);
    const form = e.target as HTMLFormElement;
    form.reset();
  };

  const showThreshold = phase === 'threshold' || phase === 'entering';
  const channelName = activeChannel.name.replace(/^#/, '');

  return (
    <div className={`app app--${phase} ${ready ? 'is-ready' : ''}`}>
      <div className="frame" aria-hidden={showThreshold ? true : undefined}>
        <button
          className={`scrim ${drawerOpen || profileOpen ? 'scrim--on' : ''}`}
          aria-label="Close"
          tabIndex={drawerOpen || profileOpen ? 0 : -1}
          onClick={() => {
            setDrawerOpen(false);
            setProfileOpen(false);
          }}
        />

        {/* ── Column 1: server rail ── */}
        <nav className="servers" aria-label="Servers">
          <button className="server server--home is-active" aria-label={IDENTITY.name} data-tip={IDENTITY.name}>
            <span className="server__pill" aria-hidden="true" />
            <span className="server__mark">{IDENTITY.monogram}</span>
          </button>
          <span className="servers__divider" aria-hidden="true" />
          {LINKS.map((l) => (
            <a
              key={l.id}
              className="server server--link"
              href={l.href}
              data-tip={l.label}
              aria-label={l.label}
              target={l.href.startsWith('http') ? '_blank' : undefined}
              rel="noreferrer"
            >
              <Icon name={l.icon} />
            </a>
          ))}
        </nav>

        {/* ── Column 2: channel sidebar ── */}
        <aside className={`sidebar ${drawerOpen ? 'sidebar--open' : ''}`}>
          <button
            className={`guild-header ${guildMenuOpen ? 'is-open' : ''}`}
            aria-label="Server menu"
            aria-expanded={guildMenuOpen}
            onClick={() => setGuildMenuOpen((o) => !o)}
          >
            <span className="guild-header__name">{IDENTITY.name}</span>
            <Icon name={guildMenuOpen ? 'close' : 'chevron'} className="guild-header__chevron" />
          </button>
          {guildMenuOpen && (
            <>
              <button className="guild-menu__scrim" aria-hidden="true" tabIndex={-1} onClick={() => setGuildMenuOpen(false)} />
              <div className="guild-menu" role="menu">
                <button role="menuitem" onClick={copyInvite}>
                  <Icon name="link" /> Copy invite link
                </button>
                <button role="menuitem" className="guild-menu__leave" onClick={leaveServer}>
                  <Icon name="leave" /> Leave server (replay intro)
                </button>
              </div>
            </>
          )}

          <div className="channels">
            {CATEGORIES.map((cat) => {
              const isCollapsed = collapsed.has(cat.id);
              return (
                <div className="category" key={cat.id}>
                  <button
                    className="category__header"
                    aria-expanded={!isCollapsed}
                    onClick={() => toggleCategory(cat.id)}
                  >
                    <Icon name="chevron" className={`category__chevron ${isCollapsed ? 'is-collapsed' : ''}`} />
                    <span>{cat.label}</span>
                  </button>
                  {!isCollapsed &&
                    cat.slugs.map((slug) => {
                      const c = channels.find((ch) => ch.slug === slug);
                      if (!c) return null;
                      const isActive = c.slug === active && phase === 'workspace';
                      return (
                        <button
                          key={c.slug}
                          className={`channel ${isActive ? 'channel--active' : ''}`}
                          aria-current={isActive ? 'true' : undefined}
                          onClick={() => openChannel(c.slug)}
                        >
                          <Icon name="hash" className="channel__hash" />
                          <span className="channel__label">{c.name.replace(/^#/, '')}</span>
                        </button>
                      );
                    })}
                </div>
              );
            })}
          </div>

          {/* user panel */}
          <div className="userbar">
            <button className="userbar__id" onClick={() => setProfileOpen((o) => !o)} aria-label="Open your profile">
              <span className="userbar__avatar">
                {IDENTITY.monogram}
                <span className="userbar__presence" aria-hidden="true" />
              </span>
              <span className="userbar__text">
                <span className="userbar__name">{IDENTITY.name}</span>
                <span className="userbar__status">open to new roles</span>
              </span>
            </button>
            <div className="userbar__controls">
              <button className="ctl" aria-label="Mute"><Icon name="mic" /></button>
              <button className="ctl" aria-label="Deafen"><Icon name="headphones" /></button>
              <button className="ctl" aria-label="Settings"><Icon name="gear" /></button>
            </div>
          </div>

          {profileOpen && (
            <div className="profile-pop" role="dialog" aria-label={`${IDENTITY.name} profile`}>
              <ProfileCard onNavigate={openChannel} />
            </div>
          )}
        </aside>

        {/* ── Column 3: main ── */}
        <section className="main" aria-label={activeChannel.name}>
          <header className="topbar">
            <button
              className="hamburger"
              aria-label="Open channels"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
            >
              <Icon name="menu" />
            </button>
            <Icon name="hash" className="topbar__hash" />
            <h2 className="topbar__title">{channelName}</h2>
            <span className="topbar__divider" aria-hidden="true" />
            <span className="topbar__topic">{activeChannel.topic}</span>
            <div className="topbar__actions">
              {['threads', 'bell', 'pin', 'members'].map((n) => (
                <button key={n} className="ctl" aria-label={n}><Icon name={n} /></button>
              ))}
              <span className="search" aria-hidden="true">
                <Icon name="search" />
                <span>Search</span>
              </span>
            </div>
          </header>

          <div className="feed" ref={feedRef}>
            <div className="feed__inner">
              <ChannelStart channel={activeChannel} />
              {activeChannel.blocks.map((b, i) => (
                <div
                  key={`${active}-${i}`}
                  className={`row ${i < revealed ? 'row--in' : 'row--pending'}`}
                >
                  <BlockView
                    block={b}
                    time={CLOCK[active] ?? '09:41'}
                    showMeta={i === 0 || activeChannel.blocks[i - 1].kind !== 'text' || b.kind !== 'text'}
                    onNavigate={openChannel}
                    you={visitorName.trim()}
                  />
                </div>
              ))}
              {phase === 'workspace' && revealed < activeChannel.blocks.length && (
                <div className="typing" aria-live="polite" aria-label={`${IDENTITY.name} is typing`}>
                  <span className="typing__avatar">{IDENTITY.monogram}</span>
                  <span className="typing__dots"><span /><span /><span /></span>
                </div>
              )}
            </div>
          </div>

          <form className="composer" onSubmit={onComposerSubmit}>
            <button type="button" className="composer__add" aria-label="Add"><Icon name="plus" /></button>
            <input
              className="composer__input"
              placeholder={`Message #${channelName}`}
              aria-label={`Message #${channelName}`}
            />
            <div className="composer__actions">
              <button type="button" className="ctl" aria-label="Gift"><Icon name="gift" /></button>
              <span className="composer__gif" aria-hidden="true">GIF</span>
              <button type="button" className="ctl" aria-label="Sticker"><Icon name="sticker" /></button>
              <button type="button" className="ctl" aria-label="Emoji"><Icon name="emoji" /></button>
            </div>
            {composerHint && (
              <div className="composer__hint" role="status">
                You can look around, but messages here go nowhere — reach me in{' '}
                <button type="button" onClick={() => openChannel('contact')}>#contact</button>.
              </div>
            )}
          </form>
        </section>
      </div>

      {/* Frame 1: the Accept-Invite screen over the pixel dusk scene */}
      {showThreshold && (
        <>
          <PixelScene leaving={phase === 'entering'} />
          <div className={`invite ${phase === 'entering' ? 'invite--leaving' : ''}`}>
            <form
              className="invite__card"
              onSubmit={(e) => {
                e.preventDefault();
                enter();
              }}
            >
              <span className="invite__avatar" aria-hidden="true">{IDENTITY.monogram}</span>
              <p className="invite__lead">You’ve been invited to join</p>
              <div className="invite__server">
                <span className="invite__server-icon" aria-hidden="true">{IDENTITY.monogram}</span>
                <span className="invite__server-name">{IDENTITY.name}</span>
              </div>
              <p className="invite__meta">
                <span className="invite__dot" aria-hidden="true" /> online now · say hi in #welcome
              </p>
              <label className="invite__label" htmlFor="display-name">Display name</label>
              <input
                id="display-name"
                className="invite__input"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="What should everyone call you?"
                autoComplete="off"
                maxLength={32}
                autoFocus
              />
              <p className="invite__note">A portfolio, laid out like a Discord server. Come in.</p>
              <button className="invite__accept" type="submit">Accept Invite</button>
              <button type="button" className="invite__skip" onClick={enter}>Already been here?</button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

function ChannelStart({ channel }: { channel: (typeof channels)[number] }) {
  const name = channel.name.replace(/^#/, '');
  return (
    <div className="channel-start">
      <span className="channel-start__icon" aria-hidden="true">
        <Icon name="hash" />
      </span>
      <h3 className="channel-start__title">Welcome to #{name}!</h3>
      <p className="channel-start__sub">
        This is the start of the <strong>#{name}</strong> channel. {channel.topic}.
      </p>
    </div>
  );
}

function BlockView({
  block,
  time,
  showMeta,
  onNavigate,
  you,
}: {
  block: Block;
  time: string;
  showMeta: boolean;
  onNavigate?: (slug: string) => void;
  you?: string;
}) {
  if (block.kind === 'profile') {
    return <ProfileCard className="pcard--intro" onNavigate={onNavigate} />;
  }

  if (block.kind === 'text') {
    const md = block.md.replace('{you}', you ? `, ${you}` : '');
    return (
      <div className={`msg ${showMeta ? '' : 'msg--cont'}`}>
        <div className="msg__avatar" aria-hidden="true">
          {showMeta ? IDENTITY.monogram : ''}
        </div>
        <div className="msg__body">
          {showMeta && (
            <div className="msg__meta">
              <span className="msg__author">{IDENTITY.name}</span>
              <span className="msg__time num">{time}</span>
            </div>
          )}
          <p className="msg__text">{renderInline(md)}</p>
        </div>
      </div>
    );
  }

  if (block.kind === 'principle') {
    return (
      <div className="principle">
        <span className="principle__index num">{block.index}</span>
        <div className="principle__content">
          <h4 className="principle__title">{block.title}</h4>
          <p className="principle__body">{block.body}</p>
          <p className="principle__decision">
            <span className="principle__tag">the decision</span>
            {block.decision}
          </p>
        </div>
      </div>
    );
  }

  if (block.kind === 'image') {
    return (
      <figure className="attach">
        {block.src ? (
          <img className="attach__img" src={block.src} alt={block.alt} style={{ aspectRatio: block.ratio ?? '16 / 10' }} loading="lazy" />
        ) : (
          <div className="attach__ph" style={{ aspectRatio: block.ratio ?? '16 / 10' }}>
            <Icon name="image" />
            <span>{block.alt}</span>
          </div>
        )}
        {block.caption && <figcaption className="attach__cap">{block.caption}</figcaption>}
      </figure>
    );
  }

  if (block.kind === 'links') {
    return (
      <div className="links">
        {block.items.map((it) => (
          <div key={it.label} className={`link-row ${it.placeholder ? 'is-placeholder' : ''}`}>
            <span className="link-row__label">{it.label}</span>
            {it.href ? (
              <a className="link-row__value" href={it.href}>
                {it.value}
              </a>
            ) : (
              <span className="link-row__value">{it.value}</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  const e = block.embed;
  return (
    <div className={`embed ${e.placeholder ? 'embed--placeholder' : ''}`}>
      {e.eyebrow && <div className="embed__eyebrow">{e.eyebrow}</div>}
      <div className="embed__title-row">
        {e.href ? (
          <a className="embed__title" href={e.href}>
            {e.title}
          </a>
        ) : (
          <h4 className="embed__title">{e.title}</h4>
        )}
      </div>
      {e.meta && (
        <div className="embed__pills">
          {e.meta.map((m) => (
            <span key={m} className="pill">
              {m}
            </span>
          ))}
        </div>
      )}
      {e.body && <p className="embed__body">{e.body}</p>}
      {e.fields && (
        <dl className="embed__fields">
          {e.fields.map((f) => (
            <div key={f.label} className="field">
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {e.footer && <p className="embed__footer">{e.footer}</p>}
    </div>
  );
}
