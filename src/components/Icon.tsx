/* Line icons, one consistent stroke (24-grid, 2px, round). No emoji, no icon font. */
import type { ReactNode } from 'react';

const PATHS: Record<string, ReactNode> = {
  hash: <path d="M9 3.5 7.5 20.5M16.5 3.5 15 20.5M4.5 8.5h15M3.5 15.5h15" />,
  chevron: <path d="M6 9.5 12 15l6-5.5" />,
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  leave: (
    <>
      <path d="M15 4.5h3.5A1.5 1.5 0 0 1 20 6v12a1.5 1.5 0 0 1-1.5 1.5H15" />
      <path d="M4 12h11M9 7l-5 5 5 5" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </>
  ),
  headphones: (
    <>
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
      <rect x="3" y="13" width="4" height="6" rx="1.6" />
      <rect x="17" y="13" width="4" height="6" rx="1.6" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v2.6M12 18.9v2.6M4.2 6.5l1.8 1.9M18 15.6l1.8 1.9M2.5 12h2.6M18.9 12h2.6M4.2 17.5l1.8-1.9M18 8.4l1.8-1.9" />
    </>
  ),
  threads: (
    <>
      <rect x="3" y="4.5" width="18" height="12.5" rx="3" />
      <path d="M7 9h10M7 12.5h6M9 20l3-3" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9.5a6 6 0 0 1 12 0c0 4.5 1.6 5.5 1.6 5.5H4.4S6 14 6 9.5Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </>
  ),
  pin: (
    <>
      <path d="M14 3.5 20.5 10l-2.4 1 .3 3.7L14.4 12l-5.1 5.1M9.3 8.3 15 13" />
    </>
  ),
  members: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.9M20.5 19a5.5 5.5 0 0 0-4-5.3" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.6-3.6" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  gift: (
    <>
      <rect x="3.5" y="9.5" width="17" height="11" rx="1.6" />
      <path d="M3.5 13.5h17M12 9.5v11" />
      <path d="M12 9.5C11 7 9.6 6 8.3 6a2 2 0 0 0 0 3.5H12ZM12 9.5C13 7 14.4 6 15.7 6a2 2 0 0 1 0 3.5H12Z" />
    </>
  ),
  sticker: (
    <>
      <path d="M4.5 4.5h15v9l-6 6h-9Z" />
      <path d="M13.5 19.5v-6h6" />
    </>
  ),
  emoji: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 14s1.4 2 3.5 2 3.5-2 3.5-2" />
      <path d="M9 9.5h.01M15 9.5h.01" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2.2" />
      <path d="M3.5 7.5 12 13l8.5-5.5" />
    </>
  ),
  code: <path d="M8.5 8 4.5 12l4 4M15.5 8l4 4-4 4M13.5 5.5l-3 13" />,
  image: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2.2" />
      <circle cx="8.5" cy="9.5" r="1.6" />
      <path d="M4 17.5l5-4.5 4 3.5 3-2.5 4 3.5" />
    </>
  ),
  link: (
    <>
      <path d="M10.5 13.5a3.5 3.5 0 0 0 5.2.4l2.6-2.6a3.5 3.5 0 0 0-4.9-5l-1.3 1.3" />
      <path d="M13.5 10.5a3.5 3.5 0 0 0-5.2-.4l-2.6 2.6a3.5 3.5 0 0 0 4.9 5l1.3-1.3" />
    </>
  ),
};

export function Icon({ name, className }: { name: string; className?: string }) {
  const p = PATHS[name];
  if (!p) return null;
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {p}
    </svg>
  );
}
