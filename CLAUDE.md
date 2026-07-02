## Project

VaultPress publishes an Obsidian vault as a documentation site. Stack: Next.js + Fumadocs + React Flow. Deployed as a **static export** (`output: 'export'`) to **GitHub Pages**. Domain glossary: `CONTEXT.md`. Architecture decisions: `docs/adr/`.

## Commands

| Command | Purpose |
|---|---|
| `pnpm generate --locale=<x>` | Convert that locale's vault → `locales/<x>/{content,public}` (no flag = `SITE_LANGUAGE` or `en`) |
| `pnpm generate:all` | Regenerate every locale with a configured `OBSIDIAN_VAULT_PATH_<X>` |
| `pnpm build:all` | Build all locales + stitch the full multi-locale site into `site/` (local mirror of CI; preview with `npx serve site`) |
| `pnpm stage <x>` | Copy `locales/<x>/` into the live (gitignored) `content/` + `public/` |
| `pnpm dev` | Stages `$SITE_LANGUAGE` (default `en`), then dev server at http://localhost:3000 |
| `pnpm build` | Stages, then production build (static export to `out/`) |
| `pnpm types:check` | Stage + MDX codegen + Next.js typegen + TypeScript — run after any schema or content change |
| `pnpm lint` | Oxlint |
| `pnpm generate -- --select` | Re-pick which vault folders/files to include (saves `GENERATE_INCLUDE_<LOCALE>`) |
| `pnpm locales:migrate` | One-shot move of a pre-i18n `content/`+`public/` into `locales/en/` |
| `pnpm obsidian` | Open the configured vault in Obsidian |

**Verify changes with:** `pnpm types:check && pnpm lint`

## Key directories

| Path | Contents |
|---|---|
| `locales/<locale>/content\|public` | **Committed** per-locale trees, written by `pnpm generate --locale=<x>`. Each locale is a fully isolated build (see `docs/superpowers/specs/2026-07-02-i18n-design.md`); `lib/locales-manifest.ts` is the locale list (keep `deploy.yml`'s matrix in sync). Hand-maintained per locale: `content/graph.mdx` and `content/start-here.mdx` (the notebook's index page at `/start-here` — the per-language "start here" giving cultural context; the shell home page is only a welcome mat). **Never route a page at `/index`** — static servers special-case a trailing bare `index` segment (`serve` normalizes `/cn/index` → `/cn/`), and a top-level `index.mdx` maps to `/`. The root `404.html` auto-redirects missed locale URLs (e.g. language switches to untranslated pages) to that locale's `/start-here`. Generation emits `created`/`modified` frontmatter from vault file stats (note frontmatter wins). |
| `content/`, `public/` | **Gitignored staging** — copies of one locale produced by `pnpm stage` (`.staged-locale` records which). Never edit here; edit `locales/<locale>/` or the vault. |
| `deploy/root/` | Hand-written root locale chooser + `404.html`, copied by the stitch step ({{BASE_PATH}} substituted). Keep locale lists in sync with the manifest. |
| `app/` | Next.js routes. `(home)/page.tsx` is the home page. `(docs)/[...slug]/` is the catch-all docs route. `api/search-index/` exports the static search index. |
| `components/` | React components. `canvas-*.tsx` for canvas rendering; `graph-*.tsx` for graph view. |
| `lib/` | Domain logic — no React. |
| `scripts/` | Generation pipeline (`generate.ts`, `generate-canvas-pages.ts`, `generate-base-pages.ts`) and `open-obsidian.ts`. |
| `docs/agents/` | Agent-specific instructions (issue tracker, triage labels, domain docs). |
| `docs/adr/` | Architecture Decision Records. Read ADRs in the area you're touching before making changes. |

## Architecture

```
Obsidian vault
  ├── notes (.md)        → fumadocs-obsidian → content/**/*.mdx
  ├── canvases (.canvas) → content/canvas/*.mdx (MDX wrapper)
  │                      → public/canvas/*.canvas (raw JSON for runtime viewer)
  └── bases (.base)      → content/**/*.mdx (BasesPageContent RSC)
                         → public/bases/**/*.json (compiled VM bytecode + precomputed results)
                         → public/notes-index.json (full NoteRecord index for client-side re-evaluation)
                                        ↓
                               Next.js + Fumadocs
                     (client-side search, graph view, canvas viewer, base views)
                                        ↓
                            Static export (out/) → GitHub Pages
```

Generation is read-only on the vault — it never modifies Obsidian files.

## Key files by area

**Generation pipeline**
- `scripts/generate.ts` — entry point; cleans `content/` and `public/`, writes notes, kicks off canvas and base generation
- `scripts/generate-canvas-pages.ts` — copies `.canvas` files to `public/`, writes MDX wrappers to `content/`
- `scripts/generate-base-pages.ts` — builds `NoteRecord[]`, emits `public/notes-index.json`, compiles `.base` files to `public/bases/*.json` + `content/*.mdx`. Also pre-resolves `[[wikilinks]]` in frontmatter values into `NoteRecord.wikilinks` (folder-aware, Obsidian-style disambiguation) so client base views render real links with titles
- `lib/remark-wikilinks.ts` — remark plugin that resolves `[[wikilinks]]` and `![[Name.base]]` embeds into internal links at build time

**Canvas rendering**
- `lib/canvas-types.ts` — `CanvasNode`, `CanvasEdge`, `CanvasData` types (mirrors the JSON Canvas spec)
- `lib/canvas-paths.ts` — `CanvasFileKind` classification; asset URL resolution
- `lib/canvas-to-flow.ts` — converts `CanvasData` into React Flow nodes/edges
- `components/canvas-view.tsx` — top-level canvas page component (React Flow wrapper)
- `components/canvas-flow-nodes.tsx` — per-node-type renderers

**Excalidraw rendering** (ported from quartz-community/obsidian-plugin-excalidraw)
- `lib/excalidraw-types.ts` — `ExcalidrawData`, `ExcalidrawElement`, `ExcalidrawRenderOptions`
- `lib/excalidraw-parser.ts` — parses `.excalidraw.md` (LZ-compressed JSON in code fences, embedded files section) and `.excalidraw` (raw JSON)
- `lib/excalidraw-renderer.ts` — server-side SVG rendering using `roughjs` (hand-drawn style) and `perfect-freehand`; handles rectangles, ellipses, diamonds, lines, arrows, text, freedraw, images, frames, embeddables
- `scripts/generate-excalidraw-pages.ts` — detects excalidraw files in vault, writes JSON to `public/excalidraw/` and MDX wrappers to `content/`
- `components/excalidraw-page.tsx` — RSC: reads JSON from disk, renders SVG via the renderer
- `components/excalidraw-view.tsx` — client component: pan/zoom interaction (mouse drag, scroll wheel, pinch-to-zoom)
- `app/excalidraw.css` — styles + dark mode color variable overrides

**Citations** (ported from quartz-community/citations)
- `lib/rehype-citations.ts` — wraps `rehype-citation` (Pandoc-style `[@key]` citations from a `.bib` file); uses `createRequire` to force Node.js module resolution past turbopack's browser-conditional export; runs BEFORE `rehypeSidenotes` so citations inside footnotes resolve before footnotes become sidenotes; post-processor embeds `data-citation-text` on each citation `<a>` with the full bibliography entry for hover tooltips
- `components/citation-tooltip.tsx` — client component: on hover over `a[data-citation]`, shows a styled floating tooltip with the full formatted reference (the popover from aarnphm/quartz's citation links)
- `app/citations.css` — citation link styling, bibliography section formatting, tooltip appearance
- Bibliography file defaults to `./references.bib`; configurable via `CitationsOptions`; when the file is absent the plugin returns an empty array (no-op, no build error)
- `linkCitations: true` (default) makes inline citations clickable `<a>` elements pointing to `#bib-<key>` anchors in the bibliography section

**Custom sidenote syntax** (`{{sidenotes[label]: content}}`)
- `scripts/generate.ts` `transformSidenoteSyntax()` — runs at generation time (before MDX parsing) to convert `{{sidenotes[label]: content}}` into `label[^_sn_N]` + GFM footnote definitions. Must happen before MDX sees the `{{` (acorn treats it as a JSX expression). Citations inside the content (e.g. `[@key]`) resolve normally since the transform produces standard GFM footnotes that flow through the `rehypeCitations` → `rehypeSidenotes` pipeline.
- `lib/remark-sidenote-syntax.ts` — standalone utility (same transform as above, available for non-generation contexts)

**Bases (Obsidian Bases)**
- `lib/base-types.ts` — `NoteRecord`, `BaseConfig`, `BaseView`, `CompiledBase`, etc.
- `lib/base-compiler/` — Pratt-parser → bytecode IR → stack VM (ported from aarnphm/quartz)
- `lib/base-parser.ts` — YAML → `BaseConfig` + filter compilation; `vaultPathToSlug`
- `lib/base-query.ts` — `applyFilter`, `applySort`, `groupNotes` over `NoteRecord[]`
- `lib/base-properties.ts` — shared column → value resolution (`resolveNoteProperty`, `isNameColumn`, `resolveDisplayName`); single source of truth for all view components
- `lib/remark-inline-base.ts` — remark plugin: ` ```base ``` ` fenced blocks → `<BasesInlineView>`
- `components/bases-page.tsx` — RSC: reads compiled JSON from disk, renders first view (no fetch); properties come from `compiled.config.properties` (single source, not duplicated at top level)
- `components/bases-inline-view.tsx` — client component: view-tab switching, lazy VM re-evaluation
- `components/bases-view-table.tsx` / `bases-view-gallery.tsx` / `bases-view-list.tsx` — view renderers; all import property resolution from `lib/base-properties.ts`

**Tags**
- `lib/tags.ts` — tag primitives: `normalizeTags`, `getTagPrefixes`, `tagUrl`
- `lib/tag-index.ts` — `buildTagIndex`: tag → items map with hierarchical prefix expansion
- `scripts/generate-tag-pages.ts` — per-tag synthetic Base (`file.hasTag`) → `public/bases/tags/*.json` + `content/tags/*.mdx`; merges vault `tags/<tag>.md` tag-note meta; emits `/tags` index
- `components/tags-index.tsx` — RSC listing all tags on `/tags`
- `components/page-tags.tsx` — clickable tag chips
- `lib/page-tree.ts` — hides `/tags` pages from the sidebar tree

**Draft & unlisted pages**
- `draft: true` — excluded at generation time by `isDraft()` in `scripts/generate.ts`; runtime guard in the catch-all route returns 404. Never appears in sidebar, search, graph, RSS, sitemap, or any listing.
- `unlisted: true` — generated normally and routable by direct URL, but hidden from: sidebar (`lib/page-tree.ts`), search (`app/api/search/route.ts` tags as `unlisted`), graph (`lib/build-graph.ts`), RSS (`app/rss.xml/route.ts`), sitemap (`app/sitemap.ts`), home page recent notes, tags index, and `generateStaticParams`. Gets `robots: noindex, follow` metadata.

**Graph view** (renderer kept on react-force-graph-2d; behaviors ported from aarnphm/quartz — see ADR-0011)
- `lib/build-graph.ts` — builds graph data from all pages, their extracted wikilink references (via `resolveReference`), and tag nodes (tag pages become `kind: 'tag'` nodes linked to tagged pages); precomputes node neighbors (`enrichNeighbors`)
- `lib/graph-utils.ts` — pure helpers shared by server and client: `enrichNeighbors`, `localGraph` (sentinel-BFS depth slice)
- `components/graph-view.tsx` — canvas renderer: degree-sized nodes, zoom-faded labels, focus-on-hover dimming (tweened), visited tint (localStorage `graph-visited`), radial layout on the global variant, zoom-to-fit/fullscreen controls. Auto-fit runs **once per dataset** — after that, pan/zoom belongs to the user (no refit on engine stop or resize); the fit button re-fits manually
- `components/local-graph.tsx` — client local graph ("Connections") in the docs TOC footer (`tableOfContent.footer` **and** `tableOfContentPopover.footer`, so it's available on mobile); depth selector re-slices the full graph client-side; heading mirrors fumadocs' `#toc-title` markup. The TOC itself is the stock fumadocs `clerk` table of contents — no custom collapse/sidebar treatment.
- `components/sidebar-persist.tsx` — persists fumadocs' left-sidebar `collapsed` state (via `useSidebar` from `fumadocs-ui/components/sidebar/base`) to localStorage; mounted inside `DocsLayout`. A blocking `<script>` in `app/layout.tsx` reads `sidebar-collapsed` from localStorage and sets `data-sidebar-collapsed="true"` on `<html>` before paint; CSS in `app/global.css` zeroes `--fd-sidebar-col` when that attribute is present, preventing a layout shift before React hydrates. `SidebarPersist` removes the attribute only after `collapsed=true` has been applied by React — removing it earlier would briefly expose the 268px sidebar column.
- `components/reader-toggle.tsx` — ephemeral (non-persistent) reader mode: sets `data-reader-mode="on"` on `<html>`, collapses sidebar, hides TOC/actions/properties/footer via CSS. Exits on `Escape`, `Ctrl+B`, or sidebar expand. A floating exit bar (portaled to `document.body`) shows an exit button + ESC hint when active.
- `components/graph-page.tsx` — `/graph` page content: legend + page/tag/link stats above the global graph

**Reading affordances** (aliases, backlinks, link previews, sidenotes — ported from aarnphm/quartz, see ADR-0010)
- `lib/aliases.ts` — `normalizeAliases` (frontmatter field), alias → slug-segment resolution (pure; safe for `source.config.ts`)
- `lib/alias-index.ts` — lazy alias→URL map over `source`; `resolveAliasUrl` powers the 308 redirect in the catch-all route when slug lookup fails
- `lib/backlinks.ts` — `getBacklinks`: inverts `extractedReferences`; excludes tag-page sources
- `components/backlinks.tsx` — RSC panel below the article body (fumadocs `Cards`)
- `components/link-popover.tsx` + `app/link-popover.css` — client hover previews for internal links inside `article`; fetches the target page HTML, extracts `article#nd-page`, prefixes ids with `popover-`; positioned with `@floating-ui/dom`; mounted once in the docs layout
- `lib/rehype-sidenotes.ts` — rehype plugin: GFM footnotes → `span.sidenote` + `span.sidenote-content` pairs; removes the bottom footnote section
- `components/sidenotes.tsx` + `app/sidenotes.css` — client margin-layout engine (collision-stacked left/right placement; without margin room the label opens a floating-ui popover instead); measures free margins against `#nd-sidebar`/`#nd-toc`, so collapsing the TOC frees space for margin notes
- `lib/remark-annotations.ts` — rough-notation syntax (`==highlight==`, `!!underline!!`, `^^box^^`, `((circle))`, `||bracket||`, ` ```highlight ` fences) → `.rough-ann` JSX spans; see ADR-0012
- `components/rough-annotations.tsx` — client runtime: draws rough-notation SVGs over `#nd-page .rough-ann`; colors from `--ann-*` vars in `app/global.css`

**Spaced repetition** (self-contained, no backend — Orbit's scheduler vendored, not its cloud service)
- Authoring: two syntaxes supported in vault notes — a fenced ` ```orbit ` block and an Obsidian `> [!orbit]` callout. Both hold `Q:`/`A:` pairs (blank-line separated; either field may span multiple lines). `QI:`/`AI:` lines attach an image to the preceding question or answer. An optional `color=<name>` in the fence meta or callout header selects from 10 color palettes (red, orange, yellow, green, turquoise, cyan, blue, violet, purple, pink). Becomes an inline review widget.
- `scripts/generate.ts` `transformOrbitCallouts()` — runs at generation time (before MDX parsing) to convert `> [!orbit]- color=green` callout syntax into ` ```orbit color=green ` fences. Mirrors the `transformSidenoteSyntax()` pattern: raw text → standard syntax the remark plugin handles. Must run before MDX sees the `>` blockquote.
- `lib/remark-review-prompts.ts` — remark plugin: parses ` ```orbit ` fences and `> [!orbit]` blockquotes into prompts (stable content-hash ids via djb2→base36) and emits `<ReviewBlock configBase64="…" color="…">`. Supports `QI:`/`AI:` attachment fields. Also handles blockquote-based `[!orbit]` callouts that survive past the generation transform (e.g. in hand-maintained content). Runs early in the chain so wikilink/annotation passes never see the prompt text.
- `lib/spaced-repetition.ts` — interval scheduler vendored & trimmed from Orbit's `@withorbit/core` `spacedRepetitionScheduler.ts` (Apache-2.0). Line-for-line faithful port: growth factor 2.3, initial interval 5 days, forgotten retry 10 min, ±10 min jitter, early-review guard. Three outcomes: remembered, forgotten, skipped (skipped = keep interval unchanged, same as Orbit). Pure; has a `demo()` self-check (`npx tsx`).
- `components/review-block.tsx` — client widget: per-reader schedule in `localStorage` (`orbit-review-v1`), so no accounts and no external service. 16-hour lookahead shows cards becoming due today (matches Orbit's `getReviewQueueFuzzyDueTimestampThreshold`). Three grade buttons: forgot, skip, remembered. Keyboard shortcuts: Space (reveal/remember), 1 (forgot), 2 (remembered), 3 (skip). Idle state shows a compact chip with mastered count and next due time. Supports `questionAttachment`/`answerAttachment` images. Color theming via `--rv-color-*` CSS custom properties (10 oklch palettes). Registered in `components/mdx.tsx`.
- `lib/review-store.ts` — module-level pub/sub: `registerPrompts` / `getPromptSnapshot` / `subscribePrompts` for cross-block coordination. Ready for a `/review` aggregator page.
- `app/review.css` — themed with `--fd-*` vars and per-block `--rv-color-*` overrides. Dark mode support for themed blocks. Imported via `app/global.css`.
- Not used: Orbit's hosted backend/sync/email, event sourcing, cloze deletions, markdown/KaTeX rendering inside prompt text. There is no cross-device sync or away-from-site reminder (a static export can't push).

**Terminology layer** (note transclusion + properties infobox — see ADR-0013)
- `lib/remark-wikilinks.ts` — also detects a **standalone** `![[Note]]`/`![[Note#Section]]`/`![[Note|Label]]` paragraph (non-`.base`) and emits a block-level `<NoteEmbed>`; mid-sentence embeds fall through to the wikilink pass as links
- `lib/note-embed.ts` — `resolveNoteTarget`: lazy name→page index over `source` (stem/title/alias; titles win), powers transclusion + frontmatter wikilinks; `slugifySection` for `#Section` anchors
- `components/note-embed.tsx` + `app/note-embed.css` — RSC: renders the target page's MDX body in a collapsible cartridge; depth is threaded through the MDX component map (`makeNoteEmbed(depth)`, `MAX_DEPTH=3`), not React context; registered only at the page render site so the server-only `source` import never reaches client MDX consumers. `#Section` links the header but does **not** slice the body
- `components/properties-panel.tsx` + `app/properties-panel.css` — RSC: renders passthrough frontmatter (`arabic`, `root`, `category`, `related`, …) as a type-aware, self-hiding Obsidian-style infobox above the body; frontmatter `[[wikilinks]]` resolve via `resolveNoteTarget`
- `.claude/skills/create-term/` — authoring contract (frontmatter schema + section layout) these two surfaces render; the KM consistency strategy

**Home page & site theme** (Karkari design system — see `DESIGN.md`)
- `app/(home)/page.tsx` — shell home page (ADR-0003): hero, intention band, featured "Start here" card (`featured: true` frontmatter, dictionary fallback), context gallery, pathways grid, recent notes, key terms, zāwiya footer
- `lib/home-data.ts` — React-free page data: dictionary pills, recent notes (sorted by `modified`/`created` frontmatter emitted at generation; ISO strings, formatted client-side by `components/home/relative-time.tsx` — a build-time "3d ago" would freeze in a static export), featured lookup
- `components/home/` — `hero.tsx`, `sections.tsx`, `zawiya-footer.tsx` (server; ALL copy comes from `lib/locale.ts` `home` strings — never hardcode homepage prose), `muraqqaa.tsx` + `reveal.tsx` (client animation primitives), static-imported images (never `public/`, which generate wipes)
- `app/karkari-theme.css` — site-wide Fumadocs token overrides (oxblood/ivory/gold + the 12-colour muraqqaʿa spectrum); imported last in `global.css`

**Comments & slides**
- `components/cusdis-comments.tsx` — lazy-loaded Cusdis thread below docs pages; nothing fetched until the reader clicks "Load comments" or a `#comments` deep link; instance config in `lib/shared.ts` (`cusdisConfig`)
- `slides: true` frontmatter adds a `<page>/slides` route (`SlideViewer`); extra static params emitted in the catch-all route's `generateStaticParams`

**Content schema**
- `source.config.ts` — Fumadocs schema: `tags` (string or array → normalized), `aliases` (string or array → normalized), `draft` (bool), `unlisted` (bool), `slides` (bool), `featured` (bool, home "Start here" target), `created`/`modified` (emitted by generation from vault file stats); `.passthrough()` keeps arbitrary vault frontmatter for the Properties panel; MDX plugins (inline-base, wikilinks, Mermaid, math/KaTeX, citations, sidenotes)
- `lib/source.ts` — `source` loader; `resolvePage` (handles encoded/decoded slugs); `resolveReference` (extracted-reference href → page; relative hrefs resolve by slugs, not file path); `getLLMText`
- `lib/shared.ts` — app-wide constants: `appName`, `docsRoute`, `gitConfig`, `cusdisConfig`
- `lib/locale.ts` — `SITE_LANGUAGE`-keyed UI strings incl. the `home` block (`en`, `fr`, `cn`)
- `lib/locales-manifest.ts` — the locale list (code, native label, text direction) for the isolated-builds i18n; consumed by the layout (`<html dir>`), `components/locale-switcher.tsx`, and mirrored by `deploy.yml`'s matrix + `deploy/root/*.html`
- `components/locale-switcher.tsx` — fumadocs-tabs-styled `<details>` dropdown of cross-build language links (plain `<a>`, never `next/link` — it would prepend this build's basePath). Mounted as the docs sidebar banner (above `SidebarLinks`) and as a custom nav item in `baseOptions()`. In dev (`NEXT_PUBLIC_BASE_PATH` doesn't end with `/<locale>`) sibling builds don't exist, so other locales render disabled with a hint; real switching is only live on stitched deploys (`pnpm build:all` preview or production)

**View transitions**
- Native Next 16 `experimental.viewTransition` (`next.config.mjs`) + React's `<ViewTransition>` component crossfade page content. Both `app/(docs)/[...slug]/page.tsx` and `app/(home)/page.tsx` wrap their content in `<ViewTransition name="docs-content" share="auto" enter="auto" default="none">` so home↔docs navigation pairs as a shared transition. See ADR-0007.
- **React 19's `<ViewTransition>` assigns a separate `vt-name` to each direct child**: `docs-content`, `docs-content_1`, `docs-content_2`, etc. Only `::view-transition-group(docs-content)` has the `animation-duration: 0s` snap fix — the suffixed groups get the browser's default 0.25s position interpolation. Worse: when pages have different sets of conditional children (aliases, tags, properties), the indices misalign and unrelated elements morph into each other. **Fix**: the `<ViewTransition>` must have exactly **one** child element (a wrapper `<div>`) so the entire content block gets the single `docs-content` name. The docs page wraps its content in `<div className="flex flex-col gap-4 flex-1">`.
- The `::view-transition-group(docs-content)` uses `animation-duration: 0s` so it **snaps** to the new element's position/size instead of interpolating. Without this, even sub-pixel position differences between old and new pages cause a visible horizontal shift (content drifts right then settles left). The old/new snapshots crossfade via `vp-content-out`/`vp-content-in` (opacity only, no `translateY`). Reduced-motion overrides for all names live in `app/global.css`.
- The sidebar does **not** participate in named view transitions. Earlier attempts gave `#nd-sidebar` its own `site-sidebar` view-transition-name, but when the sidebar is collapsed (floating mode) its old snapshot would briefly flash during navigation. No inline `viewTransitionName` is set on the sidebar via the layout's `sidebar` prop — CSS is the sole source for any sidebar transition styling.
- Base-table row links set their `viewTransitionName` only on click (`onClick` handler in `components/bases-view-table.tsx`), not permanently. A permanent name on every row carves holes in the parent `docs-content` snapshot (the View Transitions API excludes named children from the parent's bitmap), causing rows to animate independently — the table appeared to "load up piece by piece." The click-time name enables the "magic move" morph from the clicked row to the destination page's H1 when navigating via a table link, while keeping the `docs-content` snapshot intact for all other navigations. `lib/transition-name.ts` derives the shared `entry-<path>` name.
- Navigation progress bar (`components/nav-progress.tsx`, mounted in `app/layout.tsx`) fills the server round-trip before the crossfade: `instrumentation-client.ts` broadcasts `onRouterTransitionStart` as a `vaultpress:nav-start` window event, the bar trickles, completes on the `usePathname()` commit (the same commit that starts the crossfade), and fades out under its own animation-suppressed `nav-progress` view-transition name (`app/global.css`). Changing `instrumentation-client.ts` requires a dev-server restart. See ADR-0009.

## Deployment (GitHub Pages)

The site is deployed as **one isolated static build per locale**, stitched into a single GitHub Pages site (`.github/workflows/deploy.yml`; see `docs/superpowers/specs/2026-07-02-i18n-design.md`).

**How it works:**
1. Push to `main` triggers the workflow.
2. A matrix job builds each locale: stage `locales/<x>/` → quality gates → `pnpm build` with `SITE_LANGUAGE=<x>` and `PAGES_BASE_PATH=/<repo>/<x>` → `out-<x>` artifact.
3. The stitch job (`scripts/stitch-deploy.ts`) assembles `site/`: `deploy/root/` (locale chooser, 404) at the root, each build under `/<x>/`, legacy redirect stubs (old unprefixed URLs → `/en/…`), and a sitemap index. One Pages deploy.

**Setup (one-time):**
- Go to repo **Settings → Pages → Source** and select **GitHub Actions**.
- `locales/<locale>/{content,public}` are committed to the repo — CI does not run `pnpm generate` (no vault access in CI). Run `pnpm generate --locale=<x>` locally before committing content changes.
- Keep `deploy.yml`'s matrix and `deploy/root/*.html` locale lists in sync with `lib/locales-manifest.ts`.

**`basePath` for subpath hosting:**
- Each locale build serves at `/<repo-name>/<locale>/`; the workflow sets `PAGES_BASE_PATH` per matrix leg.
- For local dev, `PAGES_BASE_PATH` is empty (or unset), so the staged locale runs at `/` (the locale switcher hides itself — sibling builds don't exist locally).
- On a custom domain, change `BASE_PATH`/`PAGES_BASE_PATH` in the workflow (locale subpaths remain).

**Static export constraints:**
- No API routes at runtime — `app/api/search-index/route.ts` exports a pre-built JSON search index as a static file.
- No middleware — content negotiation for LLM markdown routes (`/llms.txt`, `/llms-full.txt`, `/llms.mdx/`) is handled by `generateStaticParams` + `export const dynamic = 'force-static'`.
- No `cookies()` or `headers()` — all pages are pre-rendered at build time.
- `images.unoptimized: true` — Next.js Image Optimization requires a server; images are served as-is.
- OG images are pre-generated at build time via `next/og` `ImageResponse` + `generateStaticParams`, output as static `.webp` files in `out/og/`.
- All route handlers (`rss.xml`, `sitemap.xml`, `llms.txt`, `llms-full.txt`, `llms.mdx`) must have `export const dynamic = 'force-static'` to be compatible with `output: 'export'`.

**Search:**
- Build side: `app/api/search-index/route.ts` iterates `source.getPages()`, extracts `structuredData` (headings + contents), and exports a static JSON array of `{url, title, section?, sectionId?, content}` entries at `/api/search-index`.
- Client side: `components/search-dialog.tsx` fetches the JSON index, builds a `flexsearch` `Index` (tokenize: forward), and renders a split-pane dialog (results left, content preview right) wired into fumadocs via `components/root-provider.tsx` → `search: { SearchDialog }`. The dialog uses a native `<dialog>` element with `showModal()`. The index is cached module-level so it persists across dialog open/close.
- Reader mode's Escape handler (`components/reader-toggle.tsx`) guards against `dialog[open]` so Escape closes the search dialog without also exiting reader mode.

## Environment variables

| Variable | Purpose |
|---|---|
| `OBSIDIAN_VAULT_PATH_<LOCALE>` | Absolute path to that locale's vault (e.g. `OBSIDIAN_VAULT_PATH_FR`). Unsuffixed `OBSIDIAN_VAULT_PATH` is a fallback for `en` only. Required for `pnpm generate`/`pnpm obsidian`; not read at runtime. |
| `SITE_LANGUAGE` | Which locale to stage/build/generate by default: `en`, `fr`, or `cn` (see `lib/locales-manifest.ts`). Set per matrix leg in CI. Restart dev server after changing. |
| `GENERATE_INCLUDE_<LOCALE>` | Comma-separated top-level vault folders/files to include for that locale. Saved by `--select`. Unsuffixed fallback for `en`. |
| `PAGES_BASE_PATH` | URL base path; CI sets `/<repo>/<locale>` per leg. Leave empty for local dev. Also inlined as `NEXT_PUBLIC_BASE_PATH` and (via `SITE_LANGUAGE`) `NEXT_PUBLIC_SITE_LANGUAGE`. |

## Footguns

- `content/` and `public/` are **fully deleted** at the start of every `pnpm generate` run. Only `content/index.mdx` and `content/graph.mdx` survive. Never store hand-maintained files in `public/`.
- `pnpm types:check` runs `fumadocs-mdx` codegen first — if `content/` is empty, unrelated type errors will appear. Run `pnpm generate` first if content is missing.
- Wikilink resolution builds a page index from `content/` at **build time**. Links to notes excluded from `GENERATE_INCLUDE` silently become dead links.
- `base: true` and `full: true` pages are **chromeless**: no TOC (desktop or mobile popover), no actions bar, no prev/next footer, no backlinks/local graph. They also render **full content width** (`DocsPage full={chromeless}` in the catch-all route) since they're data tables. The graph page uses `full: true` in hand-maintained `content/graph.mdx`.
- Canvas pages require both the MDX wrapper in `content/` **and** the raw `.canvas` file in `public/`. Both are produced together by generation; see ADR-0002.
- `useCanvasFullbleed` in `components/canvas-view.tsx` must use `useLayoutEffect`, not `useEffect`. The `CanvasFlow` child's `useEffect` queues `fitView` via `requestAnimationFrame` — if fullbleed styles aren't applied before that rAF fires, `fitView` centers content in the pre-expansion container and the canvas appears off-center. The hook also sets `overflow: hidden` on `documentElement` and `body` (kills scrollbar), `grid-column: 3 / -1` on `#nd-page` (spans past the right gutter column), and the canvas container itself is `absolute inset-0` so it covers the article regardless of sibling elements.
- A `.base` file and a `.md` note with the same stem in the same vault folder both generate `content/<path>.mdx`. The Base is written last and silently overwrites the note. This mirrors how canvas/note collisions are handled — no runtime check.
- A folder-index `.base` file (`dictionary/dictionary.base` or `dictionary/index.base`) writes to `content/dictionary/index.mdx`. If a vault note `dictionary/index.md` also exists, the Base overwrites it. Intentional — the Base is the folder landing page.
- Folders in `GENERATE_INCLUDE` automatically get a `content/<folder>/index.mdx` generated even with no `.base` file in the vault. To suppress auto-generation for a folder, add a hand-maintained `content/<folder>/index.mdx` (it is preserved because it's not in `public/`).
- `[[wikilinks]]` inside headings render as plain text, not links — `fumadocs-ui`'s `Heading` wraps heading content in its own `<a data-card>` anchor, so a nested `<a>` would be invalid HTML (hydration error). See `lib/remark-wikilinks.ts`.
- A vault tag note `tags/<tag>.md` does not get its own plain page — the generated tag page at the same path replaces it, embedding the note's body above the listing (mirrors the `.base`/`.md` same-stem rule). A tag literally named `index` is unsupported: `tags/index.md` is reserved as meta for the `/tags` index page.
- The Bases VM's `hasTag` is hierarchy-aware: `file.hasTag("a")` matches notes tagged `a/b` (Obsidian nested-tag semantics). Don't rely on exact matching in `.base` filters.
- `extractedReferences` hrefs are raw link URLs — wikilink-resolved ones are URL-relative without an extension (`./wird`), which `source.getPageByHref` cannot resolve (its relative branch is keyed by file path **with** extension). Always go through `resolveReference` in `lib/source.ts`.
- GFM footnotes (`[^n]`) never reach the page as footnotes — `lib/rehype-sidenotes.ts` rewrites them into sidenote spans and deletes the bottom footnote section at build time.
- Citations (`[@key]`) inside footnotes work because `rehype-citation` runs before `rehypeSidenotes` in the plugin chain. If the order in `source.config.ts` is changed, citations inside sidenotes will break.
- Citations require a `references.bib` (or configured path) at the project root. Without it, `[@key]` references render as-is with no error.
- Excalidraw pages require both the JSON in `public/excalidraw/` **and** the MDX wrapper in `content/`. Both are produced together by generation; the pattern mirrors canvas files.
- The excalidraw SVG renderer loads the Virgil font from unpkg CDN. If the CDN is unavailable, hand-drawn text falls back to system sans-serif.
- `components/link-popover.tsx` and `components/sidenotes.tsx` depend on fumadocs-ui's stable DOM ids (`nd-page`, `nd-toc`, `nd-sidebar`). Re-verify them when upgrading fumadocs-ui.
- An alias that matches an existing page slug is silently ignored (real pages always win); see `lib/alias-index.ts`.
- Remark plugins must emit `mdxJsxTextElement`/`mdxJsxFlowElement` nodes, never raw `html` nodes — html nodes make the whole MDX module unparsable (`MODULE_UNPARSABLE`).
- Annotation delimiters (`==`, `!!`, `^^`, `((`, `||`) are reserved in note prose — `((text))` in particular annotates any double-parenthesized text. See ADR-0012.
- `> [!orbit]` callout syntax is transformed at generation time by `transformOrbitCallouts()` into ` ```orbit ` fences, similar to the sidenote transform. The remark plugin also handles `[!orbit]` blockquotes directly in the AST as a fallback for hand-maintained content files. Empty blockquote lines (`>` with no text) must be matched by the regex — the `>[ ]?` pattern handles this.
- `{{sidenotes[label]: content}}` syntax is transformed at generation time, not at MDX compile time. MDX's acorn parser treats `{{` as a JSX expression and crashes if the syntax reaches it. The `transformSidenoteSyntax()` in `scripts/generate.ts` must run before any MDX processing. Hand-maintained `content/` files cannot use this syntax — use standard GFM footnotes (`[^n]`) instead.
- `rehype-citation` ships with browser and Node conditional exports. Turbopack resolves to the browser build (which can't read local `.bib` files). `lib/rehype-citations.ts` uses `createRequire(import.meta.url)` to force Node resolution. Do not replace with a static `import` — it will break with "Cannot read non valid bibliography URL in node env."
- `rehype-citation` joins `options.path` and `options.bibliography` with `path.join()`. Passing an absolute `bibliography` path doubles the directory (e.g. `/cwd/abs/path/ref.bib`). Always pass the relative filename and let `path: process.cwd()` resolve it.
- **View transition named children create holes.** Any element with a `viewTransitionName` inside a `<ViewTransition>` wrapper is excluded from the parent's captured bitmap — the browser transitions it independently. On table pages this caused every row to animate separately ("table loads up piece by piece"). Only assign `viewTransitionName` to elements that will have a matching partner on the destination page; use onClick-time assignment for one-off morphs.
- **View transition group interpolation causes layout shift.** The default `::view-transition-group` animation interpolates position/size from old to new. Even tiny position differences (e.g., different `max-width` between page types, or sub-pixel centering changes) animate as a visible horizontal drift. The CSS uses `::view-transition-group(*) { animation-duration: 0s }` to snap all groups (docs-content, root) instead of interpolating. The old/new pseudo-elements are separate and unaffected by the group override, so the crossfade is preserved.
- **`<ViewTransition>` with multiple direct children creates per-child transition names.** React 19 assigns `vt-name="name"`, `vt-name="name_1"`, `vt-name="name_2"`, etc. to each direct child. CSS targeting `::view-transition-group(name)` only applies to the first child; the suffixed names get the browser's default 0.25s position/size interpolation. When pages have different sets of conditional children, the indices misalign (aliases→description, description→tags, etc.) causing elements to morph into unrelated partners. Always wrap `<ViewTransition>` children in a single `<div>` wrapper.
- **Sidebar state resets during view-transition updates.** When navigating between docs pages, fumadocs' sidebar context briefly resets to `collapsed=false`, changing `--fd-sidebar-col` from `0px` to `var(--fd-sidebar-width)` (268px). When `SidebarPersist` restores it, fumadocs' Container detects the change and activates `transition-[grid-template-columns]`, causing the visible "content slide." The fix is `#nd-docs-layout { transition: none !important }` in `app/global.css`, which makes the grid snap instead of animating. The sidebar's own translate animation on `#nd-sidebar` is unaffected. Do not remove this rule.
- Do not set `viewTransitionName` on the sidebar via inline styles (e.g. the layout's `sidebar={{ style: { viewTransitionName } }}` prop). Inline styles override CSS selectors, so conditional rules like `#nd-sidebar[data-collapsed] { view-transition-name: none }` would be silently ignored.
- **Fumadocs has a CSS transition on the docs grid.** The `Container` component (`fumadocs-ui/dist/layouts/docs/slots/container.js`) sets `data-column-changed="true"` on `#nd-docs-layout` for one render cycle when `collapsed` changes. The CSS `data-[column-changed=true]:transition-[grid-template-columns]` smoothly animates the sidebar column resize. This is separate from view transitions — it fires on user-initiated sidebar toggling (including reader mode), not during page navigation.
- **Static export requires `dynamic = 'force-static'` on all route handlers.** Without it, `next build` with `output: 'export'` fails with "export const dynamic not configured". Every `route.ts` file must export `export const dynamic = 'force-static'`.
- **No runtime server features in static export.** `cookies()`, `headers()`, `NextRequest`, `NextResponse.rewrite/redirect` all fail with `output: 'export'`. All data must be available at build time.
- **`basePath` must match the GitHub Pages subpath.** GitHub Pages project sites serve at `/<repo-name>/`. Without `basePath`, all asset URLs (`/_next/static/...`) resolve to the root domain and CSS/JS fail to load. The `PAGES_BASE_PATH` env var in the workflow handles this automatically.
- **Alias redirects (`permanentRedirect`) work differently in static export.** Next.js generates a `<meta http-equiv="refresh">` tag instead of a 308 HTTP redirect. The redirect still works but is client-side only.

## Fumadocs reference

When working on anything Fumadocs-related, fetch the index first:

```
https://fumadocs.dev/llms.txt
```

For full content of a specific page (e.g. source API, search, MDX options):

```
https://fumadocs.dev/llms-full.txt   # 700KB — search for the section you need
```

Per-page Markdown is also available at `https://fumadocs.dev/llms.mdx/docs/<slug>/content.md`.

## Agent skills

### Issue tracker

Issues live as markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical states: needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix. See `docs/agents/triage-labels.md`.

### Domain docs

Read `CONTEXT.md` and relevant `docs/adr/` files before exploring any area. See `docs/agents/domain.md`.
