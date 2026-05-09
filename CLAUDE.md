@AGENTS.md

# Mediakit

Personal news aggregator for technology and cybersecurity, ranked by source
reputation, recency, and editorial depth. Built for an owner who does not
write code — every change should ship end-to-end (build → push → deploy)
without asking the owner to touch the codebase.

## Owner & accounts

- **Owner**: theebh@icloud.com
- **GitHub**: [theebh76/mediakit-website](https://github.com/theebh76/mediakit-website)
- **Vercel project**: `theebh-6436s-projects/mediakit-website`
- **GitHub ↔ Vercel** is *not* yet auto-connected (the GitHub App needs a
  one-time install). Until then, deploys happen via the local Vercel CLI:
  `vercel deploy --prod --yes`.

## How the owner likes to work

- Owner does not code and does not want to learn. Implement requests in
  full; don't ask "should I do X" — make a reasonable call and ship.
- Ask for permission only when the action is irreversible or needs a
  credential the owner has to fetch (API keys, OAuth flows, account-level
  changes).
- Default to building the thing, deploying it, and reporting the live URL
  plus a short explanation of the choices made.
- Match scope to the request. Don't pile in extra features.

## Tech stack

- **Framework**: Next.js 16 (App Router, Turbopack), TypeScript, React 19.
- **Styling**: Tailwind CSS v4 (CSS-first config in `globals.css` via
  `@theme inline`). No PostCSS shim needed beyond the Tailwind plugin.
- **Reader extraction**: `@mozilla/readability` + `linkedom` (linkedom
  replaced jsdom — see "Lessons learned" below).
- **RSS parsing**: `fast-xml-parser`.
- **Hosting**: Vercel (Fluid Compute, Node.js default runtime).
- **Node**: 24.x locally; Vercel uses its current default.
- **Package manager**: npm.

## Folder structure

```
mediakit/
├── AGENTS.md                       # Next.js agent rules (don't trust training data)
├── CLAUDE.md                       # this file (imports AGENTS.md via @AGENTS.md)
├── package.json
├── tsconfig.json
├── next.config.ts                  # default Next config
├── postcss.config.mjs              # Tailwind v4 plugin
├── eslint.config.mjs
├── public/                         # static assets (icons etc.)
├── src/
│   ├── app/
│   │   ├── layout.tsx              # root HTML shell, metadata, <base target="_blank">
│   │   ├── globals.css             # design tokens + reader typography
│   │   ├── page.tsx                # homepage (server component, ISR every 10 min)
│   │   ├── favicon.ico
│   │   └── read/
│   │       ├── page.tsx            # reader view: /read?u=<article-url>
│   │       └── error.tsx           # styled fallback for unhandled reader errors
│   ├── components/                 # all client components
│   │   ├── ArticleCard.tsx         # universal card (lead/big/small variants)
│   │   ├── ReadControls.tsx        # "Reset N read" button in masthead
│   │   ├── MarkReadOnLoad.tsx      # invisible — marks article read when /read mounts
│   │   └── useReadTracker.ts       # localStorage hook for read state
│   └── lib/
│       ├── sources.ts              # SOURCES list + AI keyword patterns
│       ├── feed.ts                 # RSS fetch, parse, score, dedupe, AI ranking
│       └── extract.ts              # reader-view fetch + Readability + sanitiser
└── .vercel/                        # local Vercel link (gitignored)
```

## File-by-file

### `src/lib/sources.ts`
The canonical list of feeds. Each `Source` has:
- `id`, `name`, `url`, `feed` (RSS/Atom URL),
- `category`: `"security" | "tech" | "ai"`,
- `reputation`: 1–10 (editorial reputation, used as a ranking weight).

Also exports `AI_KEYWORDS` — regex patterns with weights used to *promote*
AI-relevant articles from non-AI feeds into the Applied AI section. Keywords
cover applied AI for business and engineering: client/market research,
value proposition, operational efficiency, and AI-assisted ("vibe") coding.

### `src/lib/feed.ts`
- `fetchFeed(source)`: tolerant RSS/Atom/RDF parser using `fast-xml-parser`.
  Pulls title, link, summary, publish date. Defensive about feed shape.
- `getArticles()`: fetches every source in parallel, dedupes by canonical
  link, scores, and sorts. Each article also gets an `aiScore` for the
  Applied AI section.
- `scoreArticle(a)`: composite score for the main feed.
  - `recency * 0.55` — half-life ~36 hours
  - `reputation/10 * 0.3`
  - `depth * 0.1` (length of summary)
  - `kw` keyword bonus/penalty (zero-day, advisory; "rumor"/"leak" penalty)
- `aiRelevance(a)`: sums weighted matches against `AI_KEYWORDS`. Native AI
  sources get a +1.5 baseline so they always qualify.
- `rankAiArticles(articles)`: filters to `aiScore ≥ 0.6`, then ranks by
  `aiScore * 0.5 + rep * 0.3 + recency * 0.2`. Slower 96-hour half-life
  because strategy/engineering essays age more gracefully than incidents.
- `timeAgo(ts)`: humanised relative time.

### `src/lib/extract.ts`
The reader-view extractor.
- `extractArticle(url)`: fetches the source HTML with a desktop UA,
  injects a `<base href>` so relative URLs resolve, parses with
  `linkedom`, and runs `@mozilla/readability` to pull out the article
  body.
- `sanitizeContentHtml(html)`: allowlist-based HTML sanitiser. Strips
  scripts/styles, drops disallowed tags (keeps inner text), filters
  attributes, forces external `<a>` to `target="_blank" rel="noopener"`,
  and lazy-loads `<img>`.
- Returns a discriminated union: `{ ok: true, … }` on success or
  `{ ok: false, reason }` on any failure mode (HTTP error, no readable
  content, parser exception). The route always renders a styled page
  in either case.

### `src/app/layout.tsx`
- Defines page metadata and viewport.
- Critical: includes `<base target="_blank">` in `<head>` so any link on
  the site opens in a new tab by default. In-page hash anchors (`#tech`,
  etc.) are individually overridden with `target="_self"`. Internal links
  to `/read` are also `target="_self"` so the reader view replaces the
  current tab.

### `src/app/globals.css`
The design system, in one file. Design tokens defined in `:root`, exposed
to Tailwind via `@theme inline`.

| Token             | Purpose                                |
|-------------------|----------------------------------------|
| `--paper`         | Salmon-pink page background `#fff1e5`  |
| `--paper-soft`    | Subtle card/highlight `#fceadb`        |
| `--ink`           | Headline & body ink `#14110f`          |
| `--ink-soft`      | Meta / secondary text `#4a4540`        |
| `--rule`          | Hairline rules / borders `#e6d3bf`     |
| `--accent`        | Deep red for emphasis & links `#990f3d`|
| `--link`          | Reader-body inline links `#0d7680`     |
| `--font-serif`    | Georgia → Times New Roman → serif      |
| `--font-sans`     | System sans stack                       |

Utility classes (`.headline`, `.kicker`, `.meta`, `.summary`,
`.masthead-title`) are reused everywhere to keep typography consistent.
The `.reader-body` block at the bottom controls reader-view typography:
18px Georgia, 1.7 line-height, 64ch max width, blockquote with accent
left border, themed code/blockquote/image/table styles.

### `src/app/page.tsx` (homepage)
Server component, ISR `revalidate = 600` (10 minutes).

Sections, in order:
1. **Header masthead** — date line, "Mediakit" wordmark, italic subtitle,
   horizontal nav (`Top Stories`, `Cybersecurity`, `Technology`,
   `Applied AI`, `Latest`).
2. **Top Stories** — lead article (variant `lead`) + 2 large cards (`big`)
   in a 2-column block, plus a 3-card "The Briefing" sidebar.
3. **Cybersecurity** — top 8 articles where `source.category === "security"`,
   2 columns.
4. **Technology** — top 8 where `category === "tech"`, 2 columns.
5. **Applied AI** — top 9 from `rankAiArticles(...)`, 3 columns. Includes a
   short curatorial sub-headline.
6. **More to read** — articles 5–30 from the global ranking, 3 columns.
7. **Footer** — about blurb, list of all sources, copyright, "Updated every
   10 minutes" note.

`ReadControls` lives in the top header line and only appears once the
visitor has at least one article marked as read.

### `src/app/read/page.tsx` (reader view)
Dynamic route at `/read?u=<original-article-url>`.

Behaviour:
1. Calls `extractArticle(u)`.
2. On success: renders the article with Mediakit chrome — masthead, source
   name, date, byline, big serif headline, lead paragraph, then the cleaned
   article HTML inside `.reader-body`. Two prominent **"↗ Read original
   on \[Source]"** buttons (one above the body, one below).
3. On failure: same chrome + a "Reader view unavailable" message with the
   reason and an "Open original" link.
4. Mounts `<MarkReadOnLoad link={u} />` so the article is marked read in
   the visitor's localStorage as soon as the reader page loads.
5. `originLabel(url)` resolves the hostname back to the friendly source
   name from `SOURCES` when possible; otherwise falls back to the bare
   hostname.

### `src/app/read/error.tsx`
Per-route error boundary. If anything in the `/read` server pipeline
throws unexpectedly, the visitor sees a styled "Something went wrong"
page with a "Try again" button — never a raw 500.

### `src/components/ArticleCard.tsx`
The universal article card. Three variants:
- `lead`: 5xl headline + summary paragraph + "Reputation X/10".
- `big`: 3xl headline + 3-line summary clamp.
- `small`: xl headline + 2-line summary clamp (default).

Behaviour:
- Each card's headline links to `/read?u=<encoded original URL>`,
  `target="_self"` (so the reader view replaces the current tab).
- On click (or middle-click / right-click), the article URL is recorded
  via `useReadTracker` so it stays consistent with the read state on the
  reader page.
- Read articles dim to ~45% opacity and show an italic "read" tag in
  the byline. Hovering temporarily un-dims so the summary stays
  readable. Each read article exposes a "mark unread" link in its meta
  row.

### `src/components/useReadTracker.ts`
Client hook backed by localStorage.
- Storage key: `mediakit:read-articles:v1`.
- Stores a `Set<string>` of original article URLs.
- Cross-component sync via `storage` event + a custom
  `mediakit:read-changed` event.
- Returns `{ isRead, markRead, clearAll, hydrated, count }`.
- `hydrated` is used to avoid SSR/CSR mismatch — components render in the
  "unread" state until the client has loaded localStorage.

### `src/components/ReadControls.tsx`
Tiny client component. Shows in the top header strip only when the visitor
has read at least one article. Renders `Reset N read · clear` and clears
all read state on click.

### `src/components/MarkReadOnLoad.tsx`
Invisible client component the reader page mounts. On hydration it calls
`markRead(link)` for the article URL passed to it. This means just opening
the reader view counts as having read the article.

## Design intent (the "FT look")

The owner asked for an aesthetic in the spirit of the Financial Times
website — clean, editorial, mobile-friendly. Implementation choices:

- **Salmon-paper background** (`#fff1e5`) instead of stark white. Warmer
  and easier on the eyes for long reading sessions.
- **Georgia serif headlines** with tight letter-spacing and 1.15
  line-height — newspaper feel without buying a webfont.
- **System sans-serif for meta/UI** so the chrome stays clean and fast
  (no font-loading penalty).
- **Hairline rules** (`--rule`) between cards instead of card shadows /
  rounded boxes — keeps the layout dense and editorial.
- **Deep-red accent** (`#990f3d`) used sparingly: kickers, hover state,
  the over-budget "danger" zone in any future widgets.
- **64ch reader column width** at 18px / 1.7 line-height — the comfortable
  per-line word count for sustained reading on mobile and desktop.
- **Mobile-first grid** — every section collapses to a single column on
  small viewports; nav row is horizontally scrollable to avoid wrap.

## User-visible behaviour rules

- **Every external link opens in a new tab.** Implemented site-wide via
  `<base target="_blank">` in the root layout. Hash anchors and the
  internal `/read` links are explicitly `target="_self"`.
- **Read tracking persists per device.** No login, no server storage —
  localStorage only.
- **Articles open in Mediakit's reader view first.** A click on any
  homepage headline goes to `/read?u=…`, *not* to the publisher.
- **Both the top and bottom of the reader view show the original-source
  link**, with the publisher name. The bottom also includes a copyright
  attribution line.

## Ranking model summary

| Section          | Pool                                           | Half-life | Weights                                   |
|------------------|------------------------------------------------|-----------|-------------------------------------------|
| Top / Latest     | All articles                                   | 36 h      | recency 55, rep 30, depth 10, kw ±        |
| Cybersecurity    | `category=security`, top by main score         | —         | inherits main score                       |
| Technology       | `category=tech`, top by main score             | —         | inherits main score                       |
| Applied AI       | All articles with `aiScore ≥ 0.6`              | 96 h      | aiScore 50, rep 30, recency 20            |

## Lessons learned (don't re-break these)

- **Use `linkedom`, not `jsdom`, for the reader extractor.** jsdom's
  transitive dep `html-encoding-sniffer` does CommonJS `require()` on an
  ES module, which Vercel's serverless runtime refuses. Symptom: `/read`
  works locally but returns HTTP 500 in production. The fix is in
  `src/lib/extract.ts`.
- **The reader page must render a friendly UI for *every* failure mode**
  (HTTP error from publisher, paywall, no readable content, parser
  exception). Both the `extractArticle` error path and the `/read/error.tsx`
  boundary exist for this — keep them in sync.
- **The owner has approved removing the Claude API credits widget.** It
  was built and then deleted. Don't reintroduce it without an explicit
  ask. (The Anthropic public API doesn't expose credit balance directly,
  only spend via the Admin API — that's why the original implementation
  needed a manually-set monthly budget.)
- **`<base target="_blank">` would also break in-page navigation if applied
  blindly.** Anchor links and the internal reader link are individually
  set to `target="_self"`. Keep that pattern when adding new internal
  links.

## Adding things — quick recipes

### Add a new RSS source
1. Append a new entry to `SOURCES` in `src/lib/sources.ts`.
2. Pick `category` (`security` / `tech` / `ai`) — that determines which
   homepage section it competes in.
3. Set `reputation` honestly (1–10). It directly affects ranking.
4. Build, commit, deploy. No other files need changes.

### Tune AI section sensitivity
Edit `AI_KEYWORDS` in `src/lib/sources.ts`. Each entry is `{ pattern,
weight }`. The minimum threshold to appear in Applied AI is `aiScore ≥ 0.6`
in `rankAiArticles` (`src/lib/feed.ts`).

### Change the colour palette
Edit the CSS variables at the top of `src/app/globals.css`. Every card,
rule, and headline reads from those tokens, so a single edit re-themes
the whole site.

### Add a new homepage section
1. Compute the article subset in `page.tsx` (filter on `articles`).
2. Drop in a `<section>` block following the existing pattern (kicker
   → border-b-2 → grid of `<ArticleCard />`).
3. Add a nav link in the masthead `<nav>` with `target="_self"`.

## Deployment

Each change is built locally (`npm run build`), committed, pushed to
`main`, then deployed with `vercel deploy --prod --yes`. The `vercel`
CLI is logged in as `theebh-6436`. The project is linked locally
(`.vercel/` directory).

The owner asked about wiring GitHub → Vercel for auto-deploy. Steps were
written into the conversation but not executed (it requires the owner to
install the Vercel GitHub App once). Until then, deploys are CLI-driven.
