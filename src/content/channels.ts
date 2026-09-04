/*
  Channel content for the workspace.
  Single source of truth; edit here to update any section.
  `#projects` (Nest) is deliberately isolated so it's a cheap update near ship (~Sept 2026).

  PLACEHOLDER convention: anything set `placeholder: true` or wrapped in [[ ... ]]
  is a real fact that isn't confirmed yet and MUST NOT be invented. These render
  visibly marked and are collected on the replacement list in the README.
*/

export type Field = { label: string; value: string };

export type Embed = {
  eyebrow?: string;
  title: string;
  href?: string;
  meta?: string[];
  body?: string;
  fields?: Field[];
  footer?: string;
  placeholder?: boolean;
};

export type Block =
  | { kind: 'text'; md: string }
  | { kind: 'embed'; embed: Embed }
  | { kind: 'principle'; index: string; title: string; body: string; decision: string }
  | { kind: 'links'; items: { label: string; value: string; href?: string; placeholder?: boolean }[] }
  | { kind: 'profile' }
  | { kind: 'image'; src?: string; alt: string; caption?: string; ratio?: string };

export type Channel = {
  slug: string;
  name: string;
  topic: string;
  blocks: Block[];
};

export const IDENTITY = {
  name: 'Nghia Vu',
  handle: 'nghia',
  role: 'AI & mobile engineer',
  monogram: 'nv',
  tagline: 'I ship AI and mobile software that survives production.',
  email: 'nghiavu144@gmail.com',
};

export const channels: Channel[] = [
  {
    slug: 'welcome',
    name: '#welcome',
    topic: 'start here',
    blocks: [
      { kind: 'text', md: "You're in{you}. Thanks for the sixty seconds; I know how many tabs you've got open." },
      {
        kind: 'text',
        md: 'This is my portfolio, laid out like a workspace. Channels on the left, one per topic. Start anywhere; nothing here scrolls forever.',
      },
      {
        kind: 'text',
        md: 'On the clock? **#projects** has Nest, the thing I’m proudest of. Want the short version of me first? Try **#intro**.',
      },
    ],
  },
  {
    slug: 'intro',
    name: '#intro',
    topic: 'who I am, in a paragraph',
    blocks: [
      { kind: 'text', md: 'Here’s me, as a card:' },
      { kind: 'profile' },
      {
        kind: 'image',
        alt: 'A photo of Nghia',
        caption: '[[a photo of you: drop /public/me.jpg and set src]]',
        ratio: '4 / 3',
      },
      {
        kind: 'text',
        md: 'The short version: most of what I know I learned by shipping. A fintech app built end to end, production code at an industrial company, and published research to stay honest about what these systems really do.',
      },
    ],
  },
  {
    slug: 'how-i-build',
    name: '#how-i-build',
    topic: 'principles, each tied to a real decision',
    blocks: [
      { kind: 'text', md: 'A few rules I actually work by. Each one comes from a decision I made on real code, not a slide.' },
      {
        kind: 'principle',
        index: '01',
        title: 'The model never owns a number.',
        body: 'LLMs are great narrators and unreliable accountants. So I don’t let them do the math that matters.',
        decision: 'In Nest, every financial figure is computed in code. The LLM receives finished numbers and only phrases them. It can’t invent a balance.',
      },
      {
        kind: 'principle',
        index: '02',
        title: 'Production is the real test.',
        body: 'Anything works in a demo. What counts is the version that survives real users, real data, and a deploy pipeline.',
        decision: 'Wrote and shipped C#/.NET at an industrial company, through Azure DevOps CI/CD against MSSQL. Not a sandbox.',
      },
      {
        kind: 'principle',
        index: '03',
        title: 'Own it end to end.',
        body: 'I’d rather understand the whole path than be handed a slice of it.',
        decision: 'Built and still maintain Nest from data model to UI to release, the boring maintenance included.',
      },
      {
        kind: 'principle',
        index: '04',
        title: 'Be precise about what AI does.',
        body: 'Overclaiming is how AI features lose trust. I’d rather scope the model tightly and say exactly what it touches.',
        decision: 'Nest’s AI is a narration layer over deterministic logic, documented as such, so nobody mistakes phrasing for computation.',
      },
    ],
  },
  {
    slug: 'projects',
    name: '#projects',
    topic: 'Nest leads; more below',
    blocks: [
      { kind: 'text', md: 'The one to look at first:' },
      {
        kind: 'embed',
        embed: {
          eyebrow: 'PROJECT · LEAD',
          title: 'Nest',
          href: '#',
          meta: ['React Native', 'Expo', 'TypeScript', 'LLM API', 'ships ~Sept 2026'],
          body: 'A fintech app where the code computes the numbers and the LLM only narrates them. The financial logic is deterministic and testable; the model turns finished figures into plain-language guidance, never the other way around.',
          fields: [
            { label: 'My role', value: 'Built and maintained end to end' },
            { label: 'AI boundary', value: 'Narration over computed values; the model owns no figures' },
            { label: 'Details', value: '[[features, screens, metrics · from the Nest repo at ship]]' },
          ],
          footer: 'Ships in about a month. This card is written to update fast when it does.',
        },
      },
      {
        kind: 'image',
        alt: 'Nest, a screen from the app',
        caption: '[[a Nest screenshot: drop /public/nest.png and set src]]',
        ratio: '16 / 10',
      },
      { kind: 'text', md: 'A few others, in short:' },
      {
        kind: 'embed',
        embed: {
          eyebrow: 'PROJECT',
          title: '[[Project 2 · title to add]]',
          body: '[[One paragraph: what it is, your role, what shipped. To be filled from the real project.]]',
          placeholder: true,
        },
      },
      {
        kind: 'embed',
        embed: {
          eyebrow: 'PROJECT',
          title: '[[Project 3 · title to add]]',
          body: '[[One paragraph: what it is, your role, what shipped. To be filled from the real project.]]',
          placeholder: true,
        },
      },
    ],
  },
  {
    slug: 'experience',
    name: '#experience',
    topic: 'roles, education, research',
    blocks: [
      {
        kind: 'embed',
        embed: {
          eyebrow: 'ROLE',
          title: '[[Industrial company · name to confirm]]',
          meta: ['C#/.NET', 'Azure DevOps', 'MSSQL'],
          body: 'Production software at an industrial company: application code in C#/.NET, shipped through Azure DevOps pipelines against MSSQL databases. Real systems with real uptime, not coursework.',
          fields: [{ label: 'Dates', value: '[[start to end · to confirm]]' }],
        },
      },
      {
        kind: 'embed',
        embed: {
          eyebrow: 'RESEARCH',
          title: '[[Publication title · to add]]',
          body: 'Published research: how I keep my understanding of these systems grounded rather than hype-driven.',
          fields: [
            { label: 'Venue', value: '[[venue · to confirm]]' },
            { label: 'Link', value: '[[URL · to add]]' },
          ],
          placeholder: true,
        },
      },
      {
        kind: 'embed',
        embed: {
          eyebrow: 'EDUCATION',
          title: 'B.S. · M.S.',
          fields: [
            { label: 'B.S.', value: 'December 2025' },
            { label: 'M.S.', value: 'expected May 2027' },
            { label: 'Field / school', value: '[[to confirm]]' },
          ],
        },
      },
    ],
  },
  {
    slug: 'contact',
    name: '#contact',
    topic: 'the ways in',
    blocks: [
      { kind: 'text', md: 'If any of this is worth a conversation, here’s how to reach me:' },
      {
        kind: 'links',
        items: [
          { label: 'Email', value: IDENTITY.email, href: `mailto:${IDENTITY.email}` },
          { label: 'GitHub', value: '[[github.com/… · to add]]', placeholder: true },
          { label: 'LinkedIn', value: '[[linkedin.com/in/… · to add]]', placeholder: true },
          { label: 'Résumé', value: '[[resume.pdf · to add]]', placeholder: true },
        ],
      },
      { kind: 'text', md: 'Thanks for coming in.' },
    ],
  },
];
