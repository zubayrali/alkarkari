## Project

VaultPress publishes an Obsidian vault as a documentation site. Stack: Next.js + Fumadocs + React Flow. Domain glossary: `CONTEXT.md`. Architecture decisions: `docs/adr/`.

## Commands

| Command | Purpose |
|---|---|
| `pnpm generate` | Convert vault → site content (run before dev if `content/` is stale) |
| `pnpm dev` | Local dev server at http://localhost:3000 |
| `pnpm build` | Production build |
| `pnpm types:check` | MDX codegen + Next.js typegen + TypeScript — run after any schema or content change |
| `pnpm lint` | Oxlint |
| `pnpm generate -- --select` | Re-pick which vault folders/files to include |
| `pnpm obsidian` | Open the configured vault in Obsidian |

**Verify changes with:** `pnpm types:check && pnpm lint`

## Key directories

| Path | Contents |
|---|---|
| `content/` | **Generated** MDX. Fully deleted and rebuilt on every `pnpm generate` run. Only `index.mdx` and `graph.mdx` are hand-maintained and preserved. |
| `public/` | **Generated** static assets. Fully deleted and rebuilt on every `pnpm generate` run. No hand-maintained files. |
| `app/` | Next.js routes. `(home)/[[...slug]]/` is the catch-all page route. `api/` has `protected-auth` and `search`. |
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
                     (full-text search, graph view, canvas viewer, page gating, base views)
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

**Protected pages**
- `lib/protected.ts` — auth logic: `pageRequiresAuth`, `hasProtectedAccess`, `filterPageTree`
- `components/protected-gate.tsx` — UI shown when a page is locked
- `app/api/protected-auth/` — password verification endpoint (sets HttpOnly cookie)

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
- `lib/backlinks.ts` — `getBacklinks`: inverts `extractedReferences`; excludes protected pages without access and tag-page sources
- `components/backlinks.tsx` — RSC panel below the article body (fumadocs `Cards`)
- `components/link-popover.tsx` + `app/link-popover.css` — client hover previews for internal links inside `article`; fetches the target page HTML, extracts `article#nd-page`, prefixes ids with `popover-`; positioned with `@floating-ui/dom`; mounted once in the docs layout
- `lib/rehype-sidenotes.ts` — rehype plugin: GFM footnotes → `span.sidenote` + `span.sidenote-content` pairs; removes the bottom footnote section
- `components/sidenotes.tsx` + `app/sidenotes.css` — client margin-layout engine (collision-stacked left/right placement; without margin room the label opens a floating-ui popover instead); measures free margins against `#nd-sidebar`/`#nd-toc`, so collapsing the TOC frees space for margin notes
- `lib/remark-annotations.ts` — rough-notation syntax (`==highlight==`, `!!underline!!`, `^^box^^`, `((circle))`, `||bracket||`, ` ```highlight ` fences) → `.rough-ann` JSX spans; see ADR-0012
- `components/rough-annotations.tsx` — client runtime: draws rough-notation SVGs over `#nd-page .rough-ann`; colors from `--ann-*` vars in `app/global.css`

**Terminology layer** (note transclusion + properties infobox — see ADR-0013)
- `lib/remark-wikilinks.ts` — also detects a **standalone** `![[Note]]`/`![[Note#Section]]`/`![[Note|Label]]` paragraph (non-`.base`) and emits a block-level `<NoteEmbed>`; mid-sentence embeds fall through to the wikilink pass as links
- `lib/note-embed.ts` — `resolveNoteTarget`: lazy name→page index over `source` (stem/title/alias; titles win), powers transclusion + frontmatter wikilinks; `slugifySection` for `#Section` anchors
- `components/note-embed.tsx` + `app/note-embed.css` — RSC: renders the target page's MDX body in a collapsible cartridge; depth is threaded through the MDX component map (`makeNoteEmbed(depth)`, `MAX_DEPTH=3`), not React context; registered only at the page render site so the server-only `source` import never reaches client MDX consumers. `#Section` links the header but does **not** slice the body
- `components/properties-panel.tsx` + `app/properties-panel.css` — RSC: renders passthrough frontmatter (`arabic`, `root`, `category`, `related`, …) as a type-aware, self-hiding Obsidian-style infobox above the body; frontmatter `[[wikilinks]]` resolve via `resolveNoteTarget`
- `.claude/skills/create-term/` — authoring contract (frontmatter schema + section layout) these two surfaces render; the KM consistency strategy

**Content schema**
- `source.config.ts` — Fumadocs schema: `tags` (string or array → normalized), `protected` (bool or string → normalized), `aliases` (string or array → normalized), `draft` (bool), `unlisted` (bool); `.passthrough()` keeps arbitrary vault frontmatter for the Properties panel; MDX plugins (inline-base, wikilinks, Mermaid, math/KaTeX, citations, sidenotes)
- `lib/source.ts` — `source` loader; `resolvePage` (handles encoded/decoded slugs); `resolveReference` (extracted-reference href → page; relative hrefs resolve by slugs, not file path); `getLLMText`
- `lib/shared.ts` — app-wide constants: `appName`, `docsRoute`, `gitConfig`

**View transitions**
- Native Next 16 `experimental.viewTransition` (`next.config.mjs`) + React's `<ViewTransition>` component crossfade page content. Both `app/(docs)/[...slug]/page.tsx` and `app/(home)/page.tsx` wrap their content in `<ViewTransition name="docs-content" share="auto" enter="auto" default="none">` so home↔docs navigation pairs as a shared transition. See ADR-0007.
- **React 19's `<ViewTransition>` assigns a separate `vt-name` to each direct child**: `docs-content`, `docs-content_1`, `docs-content_2`, etc. Only `::view-transition-group(docs-content)` has the `animation-duration: 0s` snap fix — the suffixed groups get the browser's default 0.25s position interpolation. Worse: when pages have different sets of conditional children (aliases, tags, properties), the indices misalign and unrelated elements morph into each other. **Fix**: the `<ViewTransition>` must have exactly **one** child element (a wrapper `<div>`) so the entire content block gets the single `docs-content` name. The docs page wraps its content in `<div className="flex flex-col gap-4 flex-1">`.
- The `::view-transition-group(docs-content)` uses `animation-duration: 0s` so it **snaps** to the new element's position/size instead of interpolating. Without this, even sub-pixel position differences between old and new pages cause a visible horizontal shift (content drifts right then settles left). The old/new snapshots crossfade via `vp-content-out`/`vp-content-in` (opacity only, no `translateY`). Reduced-motion overrides for all names live in `app/global.css`.
- The sidebar does **not** participate in named view transitions. Earlier attempts gave `#nd-sidebar` its own `site-sidebar` view-transition-name, but when the sidebar is collapsed (floating mode) its old snapshot would briefly flash during navigation. No inline `viewTransitionName` is set on the sidebar via the layout's `sidebar` prop — CSS is the sole source for any sidebar transition styling.
- Base-table row links set their `viewTransitionName` only on click (`onClick` handler in `components/bases-view-table.tsx`), not permanently. A permanent name on every row carves holes in the parent `docs-content` snapshot (the View Transitions API excludes named children from the parent's bitmap), causing rows to animate independently — the table appeared to "load up piece by piece." The click-time name enables the "magic move" morph from the clicked row to the destination page's H1 when navigating via a table link, while keeping the `docs-content` snapshot intact for all other navigations. `lib/transition-name.ts` derives the shared `entry-<path>` name.
- Navigation progress bar (`components/nav-progress.tsx`, mounted in `app/layout.tsx`) fills the server round-trip before the crossfade: `instrumentation-client.ts` broadcasts `onRouterTransitionStart` as a `vaultpress:nav-start` window event, the bar trickles, completes on the `usePathname()` commit (the same commit that starts the crossfade), and fades out under its own animation-suppressed `nav-progress` view-transition name (`app/global.css`). Changing `instrumentation-client.ts` requires a dev-server restart. See ADR-0009.

## Environment variables

| Variable | Purpose |
|---|---|
| `OBSIDIAN_VAULT_PATH` | Absolute path to the vault. Required for `pnpm generate` and `pnpm obsidian`. Not read at runtime. |
| `SITE_LANGUAGE` | UI locale: `en` (default) or `cn`. Restart dev server after changing. |
| `GENERATE_INCLUDE` | Comma-separated top-level vault folders/files to include. Saved by `--select`. |
| `SITE_PROTECT_PASSWORD` | Shared password for protected pages. Never commit this value. |

## Footguns

- `content/` and `public/` are **fully deleted** at the start of every `pnpm generate` run. Only `content/index.mdx` and `content/graph.mdx` survive. Never store hand-maintained files in `public/`.
- `pnpm types:check` runs `fumadocs-mdx` codegen first — if `content/` is empty, unrelated type errors will appear. Run `pnpm generate` first if content is missing.
- Wikilink resolution builds a page index from `content/` at **build time**. Links to notes excluded from `GENERATE_INCLUDE` silently become dead links.
- `protected: true` gates the **body only** — title, description, and tags are always visible. This is intentional; see ADR-0001.
- `base: true` and `full: true` pages are **chromeless**: no TOC (desktop or mobile popover), no actions bar, no prev/next footer, no backlinks/local graph. They also render **full content width** (`DocsPage full={chromeless}` in the catch-all route) since they're data tables. The graph page uses `full: true` in hand-maintained `content/graph.mdx`.
- Canvas pages require both the MDX wrapper in `content/` **and** the raw `.canvas` file in `public/`. Both are produced together by generation; see ADR-0002.
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
- `{{sidenotes[label]: content}}` syntax is transformed at generation time, not at MDX compile time. MDX's acorn parser treats `{{` as a JSX expression and crashes if the syntax reaches it. The `transformSidenoteSyntax()` in `scripts/generate.ts` must run before any MDX processing. Hand-maintained `content/` files cannot use this syntax — use standard GFM footnotes (`[^n]`) instead.
- `rehype-citation` ships with browser and Node conditional exports. Turbopack resolves to the browser build (which can't read local `.bib` files). `lib/rehype-citations.ts` uses `createRequire(import.meta.url)` to force Node resolution. Do not replace with a static `import` — it will break with "Cannot read non valid bibliography URL in node env."
- `rehype-citation` joins `options.path` and `options.bibliography` with `path.join()`. Passing an absolute `bibliography` path doubles the directory (e.g. `/cwd/abs/path/ref.bib`). Always pass the relative filename and let `path: process.cwd()` resolve it.
- **View transition named children create holes.** Any element with a `viewTransitionName` inside a `<ViewTransition>` wrapper is excluded from the parent's captured bitmap — the browser transitions it independently. On table pages this caused every row to animate separately ("table loads up piece by piece"). Only assign `viewTransitionName` to elements that will have a matching partner on the destination page; use onClick-time assignment for one-off morphs.
- **View transition group interpolation causes layout shift.** The default `::view-transition-group` animation interpolates position/size from old to new. Even tiny position differences (e.g., different `max-width` between page types, or sub-pixel centering changes) animate as a visible horizontal drift. The CSS uses `::view-transition-group(*) { animation-duration: 0s }` to snap all groups (docs-content, root) instead of interpolating. The old/new pseudo-elements are separate and unaffected by the group override, so the crossfade is preserved.
- **`<ViewTransition>` with multiple direct children creates per-child transition names.** React 19 assigns `vt-name="name"`, `vt-name="name_1"`, `vt-name="name_2"`, etc. to each direct child. CSS targeting `::view-transition-group(name)` only applies to the first child; the suffixed names get the browser's default 0.25s position/size interpolation. When pages have different sets of conditional children, the indices misalign (aliases→description, description→tags, etc.) causing elements to morph into unrelated partners. Always wrap `<ViewTransition>` children in a single `<div>` wrapper.
- **Sidebar state resets during view-transition updates.** When navigating between docs pages, fumadocs' sidebar context briefly resets to `collapsed=false`, changing `--fd-sidebar-col` from `0px` to `var(--fd-sidebar-width)` (268px). When `SidebarPersist` restores it, fumadocs' Container detects the change and activates `transition-[grid-template-columns]`, causing the visible "content slide." The fix is `#nd-docs-layout { transition: none !important }` in `app/global.css`, which makes the grid snap instead of animating. The sidebar's own translate animation on `#nd-sidebar` is unaffected. Do not remove this rule.
- Do not set `viewTransitionName` on the sidebar via inline styles (e.g. the layout's `sidebar={{ style: { viewTransitionName } }}` prop). Inline styles override CSS selectors, so conditional rules like `#nd-sidebar[data-collapsed] { view-transition-name: none }` would be silently ignored.
- **Fumadocs has a CSS transition on the docs grid.** The `Container` component (`fumadocs-ui/dist/layouts/docs/slots/container.js`) sets `data-column-changed="true"` on `#nd-docs-layout` for one render cycle when `collapsed` changes. The CSS `data-[column-changed=true]:transition-[grid-template-columns]` smoothly animates the sidebar column resize. This is separate from view transitions — it fires on user-initiated sidebar toggling (including reader mode), not during page navigation.

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
