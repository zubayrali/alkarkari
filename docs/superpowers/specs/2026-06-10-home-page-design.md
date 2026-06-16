# Home Page Design — Karkari Wiki

**Date:** 2026-06-10
**Status:** Approved

## Goal

Add a dedicated home page at `/` using Fumadocs' `HomeLayout`. The page introduces the Karkari Wiki, surfaces dictionary terms dynamically, and links visitors to the six main content sections.

## Content sections (full wiki scope)

| Section | Path | What it covers |
|---|---|---|
| Dictionary | `/dictionary` | Sufi/Karkariya terms: Wird, Dhikr, Hadra, Khalwa, Fana, Baqa, Siyaha, Muraqqa', Sirr, Ism al-Mufrad, Silsila, Zawiya, Wali, and others |
| Books | `/books` | Published works by Shaykh Mohamed Faouzi al-Karkari (Foundations, Sufi Path of Light, Islamic Metaphysics, Footsteps of Moses, Sufism Revived, Candles on the Path) |
| Podcasts & Transcripts | `/podcasts` | Episodes from "Sufis of Morocco" (Spotify) and TariqaKarkariyaEnglish (YouTube) with full transcripts |
| Articles & Teachings | `/articles` | Q&A excerpts, classified durus, essay-style writings |
| Foundations | `/foundations` | The seven pillars: Wird, Hadra, Muraqqa', Ism al-Mufrad, Siyaha, Khalwa, Sirr |
| History | `/history` | Tariqa origins, initiatic chain (Prophet → Ibn Mashish → al-Shadhili → al-Alawi → al-Karkari) |
| The Shaykh | `/shaykh` | Biography of Shaykh Mohamed Faouzi al-Karkari (b. 1974, Nador, Morocco) |

Content for all sections comes from the Obsidian vault via `pnpm generate`. Obsidian Bases integration is a future enhancement — this design uses Fumadocs-native content sourcing throughout.

## Architecture

### Current state
```
app/(home)/layout.tsx             → DocsLayout wraps ALL (home) routes including /
app/(home)/[[...slug]]/page.tsx   → docs pages (all slugs)
```

### Target state
```
app/(home)/layout.tsx             → HomeLayout (navbar only, no sidebar/TOC)
app/(home)/page.tsx               → NEW — home page content
app/(home)/[[...slug]]/layout.tsx → NEW — DocsLayout (moved here, wraps docs only)
app/(home)/[[...slug]]/page.tsx   → unchanged
```

In Next.js App Router, `page.tsx` at a given level takes precedence over a catch-all at a deeper level for its exact route. So `/` hits `(home)/page.tsx` and any other slug hits `(home)/[[...slug]]/page.tsx`, with DocsLayout applied only to the latter via its own nested layout.

## Files to create or modify

| File | Change |
|---|---|
| `app/(home)/layout.tsx` | Replace `DocsLayout` with `HomeLayout` from `fumadocs-ui/layouts/home` |
| `app/(home)/page.tsx` | **New** — home page component (see Page Structure below) |
| `app/(home)/[[...slug]]/layout.tsx` | **New** — moves `DocsLayout` + `export const dynamic` here |
| `lib/shared.ts` | `appName`: `"VaultPress"` → `"Karkari Wiki"` |
| `lib/layout.shared.ts` | Add `links` array with Dictionary, Books, Podcasts nav items |
| `lib/locale.ts` | Add home page string keys (`heroTagline`, `heroPrimaryCta`, `heroSecondaryCta`, `dictionaryLabel`, `exploreLabel`) for future translation |

## Page structure (`app/(home)/page.tsx`)

Three stacked sections, full-width within `HomeLayout`:

### 1. Hero
- Centered layout
- `appName` as the headline (`h1`)
- Tagline from `locale.heroTagline` — default: `"A living knowledge base of the Tariqa Karkariya"`
- Two buttons: primary `"Browse Dictionary →"` → `/dictionary`; secondary `"Explore all pages"` → `/graph`

### 2. Dictionary preview strip
- Label: `"Dictionary — key terms"`
- Source: `source.getPages()` filtered to pages whose path starts with `dictionary/`, up to 12 entries
- Each entry renders as a pill link (`<Link href={page.url}>{page.data.title}</Link>`)
- A `"+ more →"` pill links to `/dictionary`
- **Empty state** (no dictionary pages yet): renders a muted note — `"Add notes to content/dictionary/ to populate this."`
- The section is not shown at all if the dictionary folder doesn't exist yet (guard with `pages.length === 0` showing empty state inline)

### 3. Section cards
2-column grid (collapses to 1 column on mobile). Six cards:

| Card | Icon | Title | Description | href |
|---|---|---|---|---|
| 1 | 📖 | Dictionary | Core terms and concepts of the Tariqa | `/dictionary` |
| 2 | 📚 | Books | Published works by Shaykh al-Karkari | `/books` |
| 3 | 🎙 | Podcasts & Transcripts | Episodes with full searchable transcripts | `/podcasts` |
| 4 | 🕯 | Foundations | The seven pillars of the path | `/foundations` |
| 5 | 📜 | Articles & Teachings | Q&A, durus, and essay-style writings | `/articles` |
| 6 | 🌿 | History | Origins and initiatic chain | `/history` |

Cards use Tailwind and the existing Fumadocs CSS variables (`fd-card`, `fd-muted-foreground`, etc.) so they inherit light/dark mode automatically.

## Nav links (`lib/layout.shared.ts`)

```ts
links: [
  { type: 'main', text: 'Dictionary', url: '/dictionary' },
  { type: 'main', text: 'Books',      url: '/books'      },
  { type: 'main', text: 'Podcasts',   url: '/podcasts'   },
]
```

These appear in both `HomeLayout` (home page navbar) and `DocsLayout` (docs pages navbar) since both consume `baseOptions()`.

## i18n

The existing `SITE_LANGUAGE` env-var pattern is kept. Home page strings are added to `lib/locale.ts` as new keys in both `en` and `cn` entries. No URL-based routing changes in this spec. Full Fumadocs i18n routing (Arabic/French/English URL separation) is deferred to a future migration.

## Out of scope

- Actual vault content (dictionary entries, book pages, etc.) — those are created as Obsidian notes
- Obsidian Bases integration
- Full i18n routing migration
- The Shaykh section card (7th) — omitted from the initial cards grid to keep it even; can be added later
