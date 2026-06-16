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

**Bases (Obsidian Bases)**
- `lib/base-types.ts` — `NoteRecord`, `BaseConfig`, `BaseView`, `CompiledBase`, etc.
- `lib/base-compiler/` — Pratt-parser → bytecode IR → stack VM (ported from aarnphm/quartz)
- `lib/base-parser.ts` — YAML → `BaseConfig` + filter compilation; `vaultPathToSlug`
- `lib/base-query.ts` — `applyFilter`, `applySort`, `groupNotes` over `NoteRecord[]`
- `lib/remark-inline-base.ts` — remark plugin: ` ```base ``` ` fenced blocks → `<BasesInlineView>`
- `components/bases-page.tsx` — RSC: reads compiled JSON from disk, renders first view (no fetch)
- `components/bases-inline-view.tsx` — client component: view-tab switching, lazy VM re-evaluation
- `components/bases-view-table.tsx` / `bases-view-gallery.tsx` / `bases-view-list.tsx` — view renderers

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

**Graph view** (renderer kept on react-force-graph-2d; behaviors ported from aarnphm/quartz — see ADR-0011)
- `lib/build-graph.ts` — builds graph data from all pages, their extracted wikilink references (via `resolveReference`), and tag nodes (tag pages become `kind: 'tag'` nodes linked to tagged pages); precomputes node neighbors (`enrichNeighbors`)
- `lib/graph-utils.ts` — pure helpers shared by server and client: `enrichNeighbors`, `localGraph` (sentinel-BFS depth slice)
- `components/graph-view.tsx` — canvas renderer: degree-sized nodes, zoom-faded labels, focus-on-hover dimming (tweened), visited tint (localStorage `graph-visited`), radial layout on the global variant, zoom-to-fit/fullscreen controls. Auto-fit runs **once per dataset** — after that, pan/zoom belongs to the user (no refit on engine stop or resize); the fit button re-fits manually
- `components/local-graph.tsx` — client local graph ("Connections") in the docs TOC footer (`tableOfContent.footer` **and** `tableOfContentPopover.footer`, so it's available on mobile); depth selector re-slices the full graph client-side; heading mirrors fumadocs' `#toc-title` markup. The TOC itself is the stock fumadocs `clerk` table of contents — no custom collapse/sidebar treatment.
- `components/sidebar-persist.tsx` — persists fumadocs' left-sidebar `collapsed` state (via `useSidebar` from `fumadocs-ui/components/sidebar/base`) to localStorage; mounted inside `DocsLayout`
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
- `source.config.ts` — Fumadocs schema: `tags` (string or array → normalized), `protected` (bool or string → normalized), `aliases` (string or array → normalized); `.passthrough()` keeps arbitrary vault frontmatter for the Properties panel; MDX plugins (inline-base, wikilinks, Mermaid, math/KaTeX, sidenotes)
- `lib/source.ts` — `source` loader; `resolvePage` (handles encoded/decoded slugs); `resolveReference` (extracted-reference href → page; relative hrefs resolve by slugs, not file path); `getLLMText`
- `lib/shared.ts` — app-wide constants: `appName`, `docsRoute`, `gitConfig`

**View transitions**
- Native Next 16 `experimental.viewTransition` (`next.config.mjs`) crossfades `docs-content` (`app/(docs)/[...slug]/page.tsx`) and gives the sidebar a named `site-sidebar` snapshot (via `viewTransitionName` in `app/(docs)/[...slug]/layout.tsx` **and** a guaranteed `#nd-sidebar { view-transition-name }` in `app/global.css`) so it animates independently of the content crossfade. Its old/new snapshots **fade** (`vp-sidebar-out`/`vp-sidebar-in`) rather than `animation: none` — the old `animation: none` froze the unmatched old sidebar at full opacity on docs→home (home has no sidebar to pair with), so it lingered then popped; the fade is imperceptible on docs↔docs (two near-identical sidebars) and clean on docs→home. Reduced-motion overrides for all names live in `app/global.css`. Content navigations use a **fade-through with rise** (old fades out, new fades in +10px — `vp-content-out`/`vp-content-in` on `docs-content`) instead of a muddy 50/50 dissolve, and base-table rows **morph into the entry's H1** ("magic move"): `lib/transition-name.ts` derives a shared `entry-<path>` `view-transition-name` from the row's `NoteRecord.slug` (`components/bases-view-table.tsx`) and the destination page's `page.url` (`DocsTitle` in the catch-all route), so the browser pairs them. See ADR-0007. `app/(home)/page.tsx` wraps its content in `<ViewTransition name="docs-content" share="auto" enter="auto" default="none">` — the **same name** as the docs page's wrapper — so home↔docs navigation (in both directions) pairs as one shared "update" transition instead of relying on unmatched enter/exit across the unrelated `HomeLayout`/`DocsLayout` subtrees. `types/react-view-transition.d.ts` is a temporary type shim for `ViewTransition` — delete once `@types/react` ships real types. See ADR-0007.
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
- `components/link-popover.tsx` and `components/sidenotes.tsx` depend on fumadocs-ui's stable DOM ids (`nd-page`, `nd-toc`, `nd-sidebar`). Re-verify them when upgrading fumadocs-ui.
- An alias that matches an existing page slug is silently ignored (real pages always win); see `lib/alias-index.ts`.
- Remark plugins must emit `mdxJsxTextElement`/`mdxJsxFlowElement` nodes, never raw `html` nodes — html nodes make the whole MDX module unparsable (`MODULE_UNPARSABLE`).
- Annotation delimiters (`==`, `!!`, `^^`, `((`, `||`) are reserved in note prose — `((text))` in particular annotates any double-parenthesized text. See ADR-0012.

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
