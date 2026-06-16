# Tag pages — design

Date: 2026-06-11
Status: approved

## Goal

Full tag support: every tag used in the vault gets a page at `/tags/<tag>` that renders
optional hand-written meta content (from a vault *tag note*) above a listing of all pages
bearing that tag, plus a `/tags` index page, clickable tag chips on every page, and tag
nodes in the graph view. Pattern adapted from aarnphm's quartz `TagPage` emitter
(`content/tags/<tag>.md` tag notes merged with a tag→files listing), re-expressed through
this repo's Bases machinery instead of a one-off list renderer.

## Decisions (user-confirmed)

1. **Listing engine: synthetic compiled Base.** Each tag page's listing is a generated
   Base with filter `file.hasTag("<tag>")`, compiled exactly like auto folder-index pages
   (`public/bases/...json` + `content/...mdx` rendering `<BasesPageContent>`). No new
   list renderer; RSC with precomputed results and view tabs for free.
2. **Hidden from sidebar.** Tag pages are reachable via tag chips and `/tags`, not the
   docs page tree.
3. **Hierarchical tags supported now.** A note tagged `a/b` appears on `/tags/a` and
   `/tags/a/b`.
4. **Graph tag nodes now**, not just primitives.

## Vault convention

- New vault folder `tags/` (added to `GENERATE_INCLUDE`).
- `tags/<tag>.md` is a **tag note**: frontmatter `title`/`description` + markdown body
  shown above the listing on `/tags/<tag>`. Nested tag → nested path
  (`tags/practice/dhikr.md`).
- Tag notes are optional. Tags without one get defaults: title `#<tag>`, description
  `Notes tagged #<tag>`, no body.
- Escape hatch: an explicit `tags/<tag>.base` in the vault wins over the synthetic base —
  the existing `.base` pipeline already compiles it at that slug; the tag generator skips
  that tag.

## Components

### 1. Primitives — `lib/` (no React)

`lib/tags.ts` (extend existing):
- `normalizeTag(tag)`: trim, strip leading `#`. Applied inside `normalizeTags`.
- `getTagPrefixes(tag)`: `"a/b/c"` → `["a", "a/b", "a/b/c"]`.
- `tagUrl(tag)`: `` `${docsRoute}/tags/<tag>` `` with URI-encoded segments.

`lib/tag-index.ts` (new):
- `buildTagIndex<T extends { tags?: string[] }>(items: T[]): Map<string, T[]>` —
  tag → items, expanded over prefixes, deterministic sort order. Generic input shape so
  it works over both `source.getPages()` pages (graph, `/tags` index RSC) and
  `NoteRecord[]` (generation).

### 2. VM fidelity — hierarchical `hasTag`

`lib/base-compiler/interpreter.ts` (`hasTag`, ~line 1437): match becomes
`t === tag || t.startsWith(tag + "/")` per query tag — Obsidian's nested-tag semantics.
One change covers build-time precompute (`applyFilter`) and client re-evaluation (same
VM). This is what makes the per-tag synthetic filter include child tags automatically.

### 3. Generation — `scripts/generate-tag-pages.ts` (new)

Wired into `scripts/generate.ts` after note output, sharing the `NoteRecord[]` built by
`generate-base-pages.ts` (export `buildNoteRecords` or pass records through).

- Tag set = union of `getTagPrefixes` over all `NoteRecord.tags`.
- Skip tags that have an explicit vault `tags/<tag>.base`.
- Per tag:
  - Compile synthetic base: filter `file.hasTag("<tag>")`, single Table view, no sort —
    parity with auto folder indexes. Emit `public/bases/tags/<tag>.json`.
  - Write `content/tags/<tag>.mdx`:
    - If a vault tag note exists, lift its frontmatter (`title`, `description`) and body
      from the fumadocs-obsidian output for that note (frontmatter stripped) — wikilinks,
      embeds, and inline base blocks in the body keep working through the normal MDX
      pipeline. Otherwise use defaults.
    - Frontmatter flags: `base: true` (suppresses copy/open bar and prev/next footer per
      ADR-0005) and `tagPage: true` (new optional boolean in `source.config.ts` schema;
      used for tree filtering and future styling).
    - Body = tag-note body (if any) + `<BasesPageContent src="/bases/tags/<tag>.json" />`.
- Write `content/tags/index.mdx` → `/tags` index page rendering `<TagsIndexContent />`
  (see UI). Also `base: true` + `tagPage: true`.
- Exclude `tags` from the auto-folder-index loop in `generate-base-pages.ts` (the tag
  generator owns `content/tags/index.mdx`).
- Tag notes remain ordinary `NoteRecord`s (Obsidian fidelity: they can be tagged and
  appear in Base results).

### 4. UI

- Tag pages are served by the existing catch-all `app/(docs)/[...slug]/page.tsx` — no
  new routes.
- `components/page-tags.tsx`: chips become `Link`s to `tagUrl(tag)` (drop
  `cursor-default`).
- `components/tags-index.tsx` (new RSC): builds the tag index from `source.getPages()`
  at request time; renders all tags with counts and descriptions (description read from
  the tag page's own page data), hierarchy shown by nesting/grouping.
- Sidebar: the `tags/` root folder node is filtered out of the page tree at the same
  place the protected filter runs (`filterPageTree` call site in the docs layout). Pages
  stay routable and searchable.

### 5. Graph

- `components/graph-view.tsx`: `NodeType` gains `kind?: 'tag'`; tag nodes drawn in a
  distinct color (and slightly different size) in `nodeCanvasObject`/node color logic.
  Click-through already works via `url`.
- `lib/build-graph.ts`: after page nodes, use `buildTagIndex` over the **visible** pages
  (post-protected filtering) to add one node per tag (`id`/`url` = `/tags/<tag>`, `text`
  = `#<tag>`, `kind: 'tag'`), a link page→tag for each visible page bearing the tag
  (via prefixes), and parent links `a/b → a` between tag nodes. Tags with zero visible
  pages are dropped — protected handling falls out for free.

### 6. Setup + docs

- Seed the vault: create `tags/` folder with 1–2 example tag notes (e.g.
  `tags/foundation.md`). One-time scaffold; generation stays read-only on the vault.
- Add `tags` to `GENERATE_INCLUDE` in `.env`.
- New ADR-0008: tag pages are synthetic Bases (why not a dedicated list renderer; why
  hierarchical `hasTag`).
- CONTEXT.md glossary: **Tag**, **Tag note**, **Tag page**.
- CLAUDE.md: key files (tags primitives, tag generator, tags-index component) and new
  footgun — vault `tags/<tag>.md`'s plain page is overwritten by the generated tag page
  (mirrors the `.base`/`.md` same-stem collision rule).

## Error handling

- Tag strings are sanitized for path segments (URI-encode on link generation; generation
  writes nested paths from raw tag segments — same handling as existing non-ASCII slugs
  via `resolvePage`).
- Malformed/empty tags dropped by `normalizeTags` (already the case).
- A tag note for a tag no longer used by any note still gets a tag page (its own
  existence implies the tag; listing may be empty or contain just the tag note).

## Testing

- Unit-style checks where the repo has precedent (compiler/interpreter behavior:
  hierarchical `hasTag`; `getTagPrefixes`; `buildTagIndex` prefix expansion).
- `pnpm generate && pnpm types:check && pnpm lint` clean.
- Manual dev walkthrough: chip on a note → `/tags/<tag>` (tag note body above table) →
  `/tags` index → graph shows tag nodes linking pages.

## Out of scope

- Inline `#tag` extraction from note bodies (frontmatter tags only, as today).
- Tag renaming/aliasing, tag-page pagination, per-tag RSS.
