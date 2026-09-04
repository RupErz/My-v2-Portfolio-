# Nghia Vu — portfolio

A portfolio you *arrive in*, laid out like a chat workspace. Built with Astro + a React
island. Dark warm-graphite world; content lives in one file so sections are cheap to update.

## Develop

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in ./dist
```

Deploy the `dist/` output free on Cloudflare Pages, Vercel, or Netlify.

## Editing content

All copy lives in [`src/content/channels.ts`](src/content/channels.ts) — one entry per
channel (`#welcome`, `#intro`, `#how-i-build`, `#projects`, `#experience`, `#contact`).
The **Nest** entry is isolated in `#projects` so it's a fast update near ship (~Sept 2026).

## ⚠️ Replacement list — real facts to fill in (do NOT invent these)

Everything wrapped in `[[ ... ]]` in `channels.ts`, plus every embed marked
`placeholder: true`, is a real fact that wasn't confirmed at build time. Fill each from the
source of truth:

- **#intro / #experience / #education:** degree field + institution.
- **#projects → Nest:** real features, screens, and any metrics — pull from the Nest repo at ship.
- **#projects → Project 2 & 3:** titles and one-paragraph descriptions of the other real projects.
- **#experience → role:** the industrial company's name and the start–end dates.
- **#experience → research:** publication title, venue, and URL.
- **#contact:** GitHub URL, LinkedIn URL, and the résumé PDF (drop it in `public/` and link it).

The email (`nghiavu144@gmail.com`) is wired in and real.

## Design system

See [`DESIGN.md`](DESIGN.md) (written at finish from the built world) and the direction
contract in [`src/layouts/BaseLayout.astro`](src/layouts/BaseLayout.astro).
