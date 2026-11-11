import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './journal.css';
import { ArrowDown, ArrowUpRight, ChevronLeft, ChevronRight, Images, X } from 'lucide-react';

type Photo = { src: string; alt: string; caption: string; responsive?: boolean };
type Story = {
  id: string; title: string; caption: string; photos: Photo[]; project?: boolean;
  period?: string; dateTime?: string; link?: { label: string; href: string };
};
const photo = (name: string, alt: string, caption: string): Photo => ({
  src: `/journal/${name}-1600.webp`, alt, caption, responsive: true,
});

const STORIES: Story[] = [
  { id: 'research', title: 'A different kind of debugging', period: 'Present',
    caption: 'The robot I’m working with for my Graduate Assistant research.',
    photos: [photo('robot', 'The research robot in the lab', 'My research companion.')] },
  { id: 'nest', title: 'Nest', period: 'In progress', caption: 'A peek at my upcoming project', project: true,
    photos: [{ src: '/shots/nest-01-capture-tab.png', alt: 'Nest finance app Capture screen', caption: 'A peek at my upcoming project' }] },
  { id: 'hackmit', title: 'Hackathon at MIT', period: '2025', dateTime: '2025', caption: 'HackMIT. My first hackathon :)',
    link: { label: 'Explore Fovea', href: 'https://plume.hackmit.org/project/qzfjw-rbmam-osybf-wwsqc' },
    photos: [
      photo('hackmit-team', 'Our group around a table at HackMIT', 'My first hackathon.'),
      photo('hackmit-selfie', 'A group selfie at HackMIT', 'A selfie from HackMIT.'),
      photo('mit-campus', 'The MIT campus entrance', 'A little look around MIT.'),
    ] },
  { id: 'pennapps', title: 'Hackathon at the University of Pennsylvania', period: 'Sep 2025', dateTime: '2025-09', caption: 'PennApps. A weekend building FoodPrint, and somehow I forgot the team photo.',
    link: { label: 'Explore FoodPrint', href: 'https://devpost.com/software/foodprint-msad2x' },
    photos: [photo('pennapps', 'My PennApps hacker badge', 'My PennApps badge.')] },
  { id: 'hackharvard', title: 'Hackathon at Harvard', period: 'Oct 2025', dateTime: '2025-10', caption: 'HackHarvard. A weekend building LinguaLens with this crew.',
    link: { label: 'Explore LinguaLens', href: 'https://devpost.com/software/word-quest-7q543n' },
    photos: [
      photo('hackharvard-team', 'Our group in front of the HackHarvard sign', 'The HackHarvard crew.'),
      photo('hackharvard-friends', 'A group photo at HackHarvard', 'One more from the weekend.'),
    ] },
  { id: 'nucor', title: 'My summer at Nucor', period: 'May to Aug 2024', dateTime: '2024', caption: 'A few faces from my software engineering internship.',
    photos: [
      photo('nucor-team', 'Our group posing together at Nucor', 'The Nucor crew.'),
      photo('nucor-selfie', 'My first selfie at my Nucor desk', 'First desk selfie at Nucor.'),
    ] },
  { id: 'travel', title: 'Touching grass', caption: 'Travel, little breaks, and life away from the keyboard.',
    photos: [
      photo('travel-day', 'A colorful character and me on a day out', 'Out and about.'),
      photo('travel-selfie', 'A selfie together on a day out', 'Touching grass again.'),
      { src: '/about-me.jpeg', alt: 'Me visiting Bà Nà Hills in Vietnam', caption: 'Bà Nà Hills, Vietnam.' },
    ] },
  { id: 'family', title: 'The people who got me here', caption: 'Bà Nà Hills with my mom. Always good to be together.',
    photos: [
      photo('ba-na-hills', 'My mom and me at Bà Nà Hills', 'Bà Nà Hills with my mom.'),
      { src: '/about-family.jpeg', alt: 'A photo with my family', caption: 'My family.' },
      { src: '/about-grad.jpeg', alt: 'My graduation photo', caption: 'A milestone worth keeping.' },
    ] },
];

const TIMELINE = ['research', 'nest', 'hackharvard', 'pennapps', 'hackmit', 'nucor']
  .map((id) => STORIES.find((story) => story.id === id)!);

export default function PhotoJournal({ onOpenNest }: { onOpenNest: () => void }) {
  const [gallery, setGallery] = useState<Story | null>(null);
  const timeline = useRef<HTMLOListElement>(null);
  const progress = useRef<HTMLSpanElement>(null);

  // Only the quiet date rail moves. Scrolling and photographs stay native.
  useEffect(() => {
    const root = timeline.current?.closest<HTMLElement>('.screen__scroll');
    if (!root || !timeline.current) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const update = () => {
      frame = 0;
      if (preference.matches || !timeline.current || !progress.current) return;
      const bounds = timeline.current.getBoundingClientRect();
      const readingLine = root.getBoundingClientRect().top + root.clientHeight * 0.55;
      const fraction = Math.max(0, Math.min(1, (readingLine - bounds.top) / bounds.height));
      progress.current.style.transform = `scaleY(${fraction})`;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    root.addEventListener('scroll', schedule, { passive: true });
    preference.addEventListener('change', schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    observer.observe(timeline.current);
    schedule();
    return () => {
      root.removeEventListener('scroll', schedule);
      preference.removeEventListener('change', schedule);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="journal">
      <div className="journal__intro">
        <p className="journal__lede">A little work, a little life.</p>
        <p>CS master’s student and Graduate Assistant at Arkansas State.
          A few moments from what I’ve been up to.</p>
      </div>
      <div className="journal__direction">Latest to earliest <ArrowDown size={14} aria-hidden="true" /></div>
      <div className="journal__timeline-wrap">
        <span className="journal__track" aria-hidden="true"><span ref={progress} className="journal__track-progress" /></span>
        <ol className="journal__timeline" ref={timeline} aria-label="Work and hackathons, latest to earliest">
        {TIMELINE.map((story) => (
          <li className="journal__entry" key={story.id}>
            <div className="journal__date">
              {story.dateTime ? <time dateTime={story.dateTime}>{story.period}</time> : <span>{story.period}</span>}
            </div>
            <JournalStory story={story} onOpen={() => setGallery(story)} onOpenNest={onOpenNest} />
          </li>
        ))}
        </ol>
      </div>
      <section className="journal__personal" aria-labelledby="personal-title">
        <h2 id="personal-title">Life outside code</h2>
        <div className="journal__stories">
          {STORIES.filter((story) => !story.period).map((story) => (
            <JournalStory key={story.id} story={story} personal onOpen={() => setGallery(story)} onOpenNest={onOpenNest} />
          ))}
        </div>
      </section>
      <p className="journal__end">More moments to come.</p>
      {gallery && createPortal(<PhotoGallery story={gallery} onClose={() => setGallery(null)} />, document.body)}
    </div>
  );
}

function JournalStory({ story, personal, onOpen, onOpenNest }: {
  story: Story; personal?: boolean; onOpen: () => void; onOpenNest: () => void;
}) {
  const lead = story.photos[0];
  const Heading = personal ? 'h3' : 'h2';
  return (
    <figure className={`journal-story journal-story--${story.id}`}>
      <button type="button" className="journal-story__photo" onClick={onOpen}
        aria-label={`Open ${story.title} gallery, ${story.photos.length} ${story.photos.length === 1 ? 'photo' : 'photos'}`}>
        <img src={lead.src} srcSet={lead.responsive ? `${lead.src.replace('-1600', '-720')} 720w, ${lead.src} 1600w` : undefined}
          sizes="(max-width: 640px) calc(100vw - 78px), (max-width: 1000px) 65vw, 520px"
          alt={lead.alt} loading="lazy" decoding="async" />
        <span className="journal-story__open"><Images size={15} aria-hidden="true" />
          {story.photos.length > 1 ? `${story.photos.length} photos` : 'View photo'}</span>
      </button>
      <figcaption>
        <Heading>{story.title}</Heading>
        {story.project ? <a className="journal-story__link" href="#/work/nest" onClick={(e) => { e.preventDefault(); onOpenNest(); }}>{story.caption}<ArrowUpRight size={16} aria-hidden="true" /></a>
          : <p>{story.caption}</p>}
        {story.link && <a className="journal-story__link" href={story.link.href} target="_blank" rel="noreferrer">{story.link.label}<ArrowUpRight size={16} aria-hidden="true" /></a>}
      </figcaption>
    </figure>
  );
}

function PhotoGallery({ story, onClose }: { story: Story; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const touchX = useRef<number | null>(null);
  const current = story.photos[index];
  const many = story.photos.length > 1;
  const step = (delta: number) => setIndex((i) => (i + delta + story.photos.length) % story.photos.length);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const scroll = document.querySelector<HTMLElement>('.screen__scroll');
    const overflow = scroll?.style.overflowY ?? '';
    if (scroll) scroll.style.overflowY = 'hidden';
    dialog.current?.showModal();
    return () => {
      if (scroll) scroll.style.overflowY = overflow;
      opener?.focus();
    };
  }, []);

  return (
    <dialog ref={dialog} className="lightbox journal-gallery" aria-label={`${story.title} photo gallery`}
      onClose={onClose} onClick={(e) => { if (e.target === e.currentTarget) dialog.current?.close(); }}
      onKeyDown={(e) => {
        if (e.key === 'Tab') {
          const controls = dialog.current?.querySelectorAll<HTMLButtonElement>('button');
          if (controls?.length) {
            const first = controls[0];
            const last = controls[controls.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
          }
        }
        if (many && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
          e.preventDefault(); e.stopPropagation(); step(e.key === 'ArrowRight' ? 1 : -1);
        }
      }}>
      <div className="journal-gallery__bar">
        <span>{story.title}</span>
        <button type="button" className="round-btn" aria-label="Close photo gallery" autoFocus onClick={() => dialog.current?.close()}><X size={20} aria-hidden="true" /></button>
      </div>
      <figure className="journal-gallery__figure"
        onPointerDown={(e) => { if (e.pointerType === 'touch') touchX.current = e.clientX; }}
        onPointerUp={(e) => {
          if (many && touchX.current !== null && Math.abs(e.clientX - touchX.current) > 50) step(e.clientX < touchX.current ? 1 : -1);
          touchX.current = null;
        }} onPointerCancel={() => { touchX.current = null; }}>
        <img src={current.src} alt={current.alt} />
        <figcaption aria-live="polite">{current.caption}</figcaption>
      </figure>
      <div className="journal-gallery__nav">
        {many && <button type="button" className="round-btn" aria-label="Previous photo" onClick={() => step(-1)}><ChevronLeft size={20} aria-hidden="true" /></button>}
        <span aria-live="polite">{index + 1} / {story.photos.length}</span>
        {many && <button type="button" className="round-btn" aria-label="Next photo" onClick={() => step(1)}><ChevronRight size={20} aria-hidden="true" /></button>}
      </div>
    </dialog>
  );
}
