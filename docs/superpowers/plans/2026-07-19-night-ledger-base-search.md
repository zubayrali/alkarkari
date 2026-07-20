# Night Ledger (Base Views & Search Dialog) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the four Base views (table, list, gallery, sphere) and the Cmd+K search dialog into the Night Threshold ledger language, and localize their hardcoded strings.

**Architecture:** CSS-first restyle. All `base-*` styles migrate out of `app/global.css` into a new `app/base-ledger.css` and are converted to the ledger idiom (hairlines, mono labels, Spectral titles, gold position marks). `app/search.css` is rewritten as a constant-night surface. Component edits are limited to string threading (via props from server boundaries, following the existing `tags-filter` pattern) and one class hook. No behavior, data flow, or `lib/base-*` logic changes.

**Tech Stack:** Next.js 16 static export, Fumadocs, plain CSS with existing design tokens, vitest.

**Spec:** `docs/superpowers/specs/2026-07-19-night-ledger-base-search-design.md`

## Global Constraints

- Static export (`output: 'export'`): no server-only APIs in client components; strings cross the server→client boundary as serializable props.
- Use only existing tokens: `--color-fd-*`, `--kk-night`, `--kk-night-fg`, `--kk-night-muted`, `--kk-glass-line`, `--kk-gold-ink`, `--kk-ember`, `--font-mono-plex`, `--font-spectral`. No new palette values.
- **Gold rule:** theme-following grounds (the reading field, so all Base views) use `--kk-gold-ink`; constant-black grounds (the search dialog) use `--kk-ember`. This mirrors `app/reader-shell.css`.
- Keep the `base-*` and `fd-search-*` class contracts — other code does not select on them, but the generated MDX and view-transition logic depend on current DOM structure, which must not change.
- `content-site/{en,fr,cn}.json` must keep key parity (enforced by `tests/site-strings.test.ts` shape test).
- Do not touch: `lib/base-*`, `lib/remark-inline-base.ts`, `components/bases-view-sphere.tsx` internals (WIP owned by another stream; only its surroundings are styled), search indexing/CJK encoder in `search-dialog.tsx`.
- The working tree carries unrelated uncommitted work (homepage, keystatic, bases-sphere stream). **Never `git add -A`.** Stage only the files each task names.
- Verify after every task: `pnpm types:check && pnpm lint && pnpm test` (lint has 7 pre-existing warnings; only new ones count as failures). If `types:check` fails with "`.source/server.ts` is not a module", run `npx fumadocs-mdx` and retry — known dev-server race.

---

### Task 1: New site-string keys

**Files:**
- Modify: `lib/site-strings.ts` (SiteStrings interface, after `countOfLabel: string;` at line ~282)
- Modify: `content-site/en.json`, `content-site/fr.json`, `content-site/cn.json` (after `"countOfLabel"`)
- Test: `tests/site-strings.test.ts` (existing shape-parity test — no new test file)

**Interfaces:**
- Consumes: nothing.
- Produces: 11 new keys on `SiteStrings`, used by Tasks 2 and 4: `baseNoResults`, `baseShowMore`, `baseRemainingUnit`, `baseFilterPlaceholder`, `searchPlaceholder`, `searchLoading`, `searchTypeToBegin`, `searchNoResults`, `searchHintNavigate`, `searchHintOpen`, `searchHintClose` (all `string`). Base result counts reuse the existing `pageSingular`/`pagePlural`/`countOfLabel`.

- [ ] **Step 1: Add the keys to the interface and en.json only**

In `lib/site-strings.ts`, inside `interface SiteStrings`, directly after `countOfLabel: string;`:

```ts
  baseNoResults: string;
  baseShowMore: string;
  baseRemainingUnit: string;
  baseFilterPlaceholder: string;
  searchPlaceholder: string;
  searchLoading: string;
  searchTypeToBegin: string;
  searchNoResults: string;
  searchHintNavigate: string;
  searchHintOpen: string;
  searchHintClose: string;
```

In `content-site/en.json`, directly after `"countOfLabel": "of",`:

```json
  "baseNoResults": "No results.",
  "baseShowMore": "Show more",
  "baseRemainingUnit": "remaining",
  "baseFilterPlaceholder": "Filter…",
  "searchPlaceholder": "Search the library…",
  "searchLoading": "Loading search index…",
  "searchTypeToBegin": "Type to search…",
  "searchNoResults": "No results found",
  "searchHintNavigate": "Navigate",
  "searchHintOpen": "Open",
  "searchHintClose": "Close",
```

- [ ] **Step 2: Run the parity test to verify it fails**

Run: `npx vitest run tests/site-strings.test.ts`
Expected: FAIL — "keeps every locale on the canonical schema" (fr and cn lack the new keys).

- [ ] **Step 3: Add translated values to fr.json and cn.json**

`content-site/fr.json`, after `"countOfLabel"`:

```json
  "baseNoResults": "Aucun résultat.",
  "baseShowMore": "Afficher plus",
  "baseRemainingUnit": "restants",
  "baseFilterPlaceholder": "Filtrer…",
  "searchPlaceholder": "Rechercher dans la bibliothèque…",
  "searchLoading": "Chargement de l’index de recherche…",
  "searchTypeToBegin": "Commencez à taper…",
  "searchNoResults": "Aucun résultat",
  "searchHintNavigate": "Naviguer",
  "searchHintOpen": "Ouvrir",
  "searchHintClose": "Fermer",
```

`content-site/cn.json`, after `"countOfLabel"`:

```json
  "baseNoResults": "没有结果。",
  "baseShowMore": "显示更多",
  "baseRemainingUnit": "剩余",
  "baseFilterPlaceholder": "筛选…",
  "searchPlaceholder": "搜索文库…",
  "searchLoading": "正在加载搜索索引…",
  "searchTypeToBegin": "输入以搜索…",
  "searchNoResults": "没有找到结果",
  "searchHintNavigate": "移动",
  "searchHintOpen": "打开",
  "searchHintClose": "关闭",
```

- [ ] **Step 4: Run tests and type-check to verify green**

Run: `npx vitest run tests/site-strings.test.ts && pnpm types:check`
Expected: PASS / exit 0.

- [ ] **Step 5: Commit**

```bash
git add lib/site-strings.ts content-site/en.json content-site/fr.json content-site/cn.json
git commit -m "feat: add base-view and search-dialog string keys"
```

---

### Task 2: Thread strings through the Base views

**Files:**
- Modify: `components/bases-inline-view.tsx`
- Modify: `components/bases-view-table.tsx`, `components/bases-view-list.tsx`, `components/bases-view-gallery.tsx`
- Modify: `components/bases-page.tsx`
- Modify: `components/mdx.tsx`

**Interfaces:**
- Consumes: Task 1's `SiteStrings` keys via `getSiteLanguage()` from `@/lib/locale` (server side only).
- Produces: `export interface BasesStrings { noResults: string; showMore: string; remainingUnit: string; filterPlaceholder: string; pageSingular: string; pagePlural: string; countOf: string }` and `export function basesStringsFrom(lang: { baseNoResults: string; baseShowMore: string; baseRemainingUnit: string; baseFilterPlaceholder: string; pageSingular: string; pagePlural: string; countOfLabel: string }): BasesStrings`, both from `components/bases-inline-view.tsx`. The view components accept `strings?: Pick<BasesStrings, 'noResults' | 'showMore' | 'remainingUnit'>`.

Background: `getSiteLanguage()` resolves via `process.env.SITE_LANGUAGE`, which is **not** inlined into client bundles — calling it inside a `'use client'` component silently falls back to English on fr/cn builds. Strings therefore flow as props from server components: `BasesPageContent` (RSC, used by all generated Base/tag/folder pages) and the MDX component map in `components/mdx.tsx` (RSC render site; also fixes the latent gap that `<BasesInlineView>` emitted by inline ` ```base ` fences and `![[x.base]]` embeds was never registered there).

- [ ] **Step 1: Add the strings contract to `bases-inline-view.tsx`**

Below the `viewIcons` const, add:

```ts
export interface BasesStrings {
  noResults: string
  showMore: string
  remainingUnit: string
  filterPlaceholder: string
  pageSingular: string
  pagePlural: string
  countOf: string
}

export const DEFAULT_BASES_STRINGS: BasesStrings = {
  noResults: 'No results.',
  showMore: 'Show more',
  remainingUnit: 'remaining',
  filterPlaceholder: 'Filter…',
  pageSingular: 'page',
  pagePlural: 'pages',
  countOf: 'of',
}

export function basesStringsFrom(lang: {
  baseNoResults: string
  baseShowMore: string
  baseRemainingUnit: string
  baseFilterPlaceholder: string
  pageSingular: string
  pagePlural: string
  countOfLabel: string
}): BasesStrings {
  return {
    noResults: lang.baseNoResults,
    showMore: lang.baseShowMore,
    remainingUnit: lang.baseRemainingUnit,
    filterPlaceholder: lang.baseFilterPlaceholder,
    pageSingular: lang.pageSingular,
    pagePlural: lang.pagePlural,
    countOf: lang.countOfLabel,
  }
}
```

Add `strings = DEFAULT_BASES_STRINGS` to the `Props` interface (`strings?: BasesStrings`) and the destructuring in `BasesInlineView`. Then replace the two hardcoded UI strings:

The results count (currently `` `${notes.length} results` `` / `` `${filteredNotes.length} of ${notes.length}` ``):

```tsx
          <span className="base-results-count">
            {filteredNotes.length === notes.length
              ? `${notes.length} ${notes.length === 1 ? strings.pageSingular : strings.pagePlural}`
              : `${filteredNotes.length} ${strings.countOf} ${notes.length}`}
          </span>
```

The filter input placeholder: `placeholder="Filter…"` → `placeholder={strings.filterPlaceholder}`.

Pass `strings={strings}` to all four child views (`BasesViewTable`, `BasesViewGallery`, `BasesViewList`, `BasesViewSphere` — for the sphere just forward it; if its `Props` doesn't accept `strings`, add `strings?: BasesStrings` to its `Props` without using it, so the WIP stream can adopt it later).

- [ ] **Step 2: Accept strings in the three view components**

In each of `bases-view-table.tsx`, `bases-view-list.tsx`, `bases-view-gallery.tsx`:

```ts
import { DEFAULT_BASES_STRINGS, type BasesStrings } from './bases-inline-view'
```

Add to `Props`: `strings?: Pick<BasesStrings, 'noResults' | 'showMore' | 'remainingUnit'>` and destructure `strings = DEFAULT_BASES_STRINGS`.

Replace every literal `No results.` with `{strings.noResults}` (one in table, two each in list and gallery) and every show-more label

```tsx
          Show more ({notes.length - visibleCount} remaining)
```

with

```tsx
          {strings.showMore} ({notes.length - visibleCount} {strings.remainingUnit})
```

In `bases-view-table.tsx` only, also swap the name-link class (hook for Task 3):

```tsx
        className="base-name-link"
```

replacing `className="underline underline-offset-2"` in `renderCell` — the `onClick` view-transition handler stays exactly as is.

- [ ] **Step 3: Pass real strings from the server boundaries**

`components/bases-page.tsx` — add imports and thread:

```ts
import { getSiteLanguage } from '@/lib/locale'
import { BasesInlineView, basesStringsFrom } from './bases-inline-view'
```

and inside the returned JSX add the prop:

```tsx
      strings={basesStringsFrom(getSiteLanguage())}
```

`components/mdx.tsx` — register the inline-fence component (fixes the unregistered `<BasesInlineView>` name):

```tsx
import { BasesInlineView, basesStringsFrom, type BasesStrings } from "@/components/bases-inline-view";
import { getSiteLanguage } from "@/lib/locale";

const basesStrings: BasesStrings = basesStringsFrom(getSiteLanguage());

function LocalizedBasesInlineView(
  props: Omit<ComponentProps<typeof BasesInlineView>, "strings">,
) {
  return <BasesInlineView strings={basesStrings} {...props} />;
}
```

and in `getMDXComponents`, after `ObsidianCalloutTitle: KarkariCalloutTitle,`:

```tsx
    BasesInlineView: LocalizedBasesInlineView,
```

- [ ] **Step 4: Verify gates and a rendered page**

Run: `pnpm types:check && pnpm lint && pnpm test`
Expected: exit 0 / no new lint warnings / all tests pass.

Run: `pnpm build`
Expected: static export completes. Spot-check `out/dictionary/index.html` contains `base-results-count` with "pages" (not "results") and `out/articles/index.html` (or any generated folder index) contains `base-name-link`.

- [ ] **Step 5: Commit**

```bash
git add components/bases-inline-view.tsx components/bases-view-table.tsx components/bases-view-list.tsx components/bases-view-gallery.tsx components/bases-view-sphere.tsx components/bases-page.tsx components/mdx.tsx
git commit -m "feat: localize base view strings, register inline base embeds"
```

(Include `bases-view-sphere.tsx` only if Step 1 actually edited its Props; it is otherwise another stream's WIP — leave it unstaged.)

---

### Task 3: `app/base-ledger.css` — the ledger conversion

**Files:**
- Create: `app/base-ledger.css`
- Modify: `app/global.css` (delete the base block; add the import)

**Interfaces:**
- Consumes: `base-*` class names from the components (unchanged DOM) plus Task 2's `.base-name-link` hook.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Create `app/base-ledger.css`**

Full file content:

```css
/* Base views as typographic ledgers — the Night Ledger pass
   (docs/superpowers/specs/2026-07-19-night-ledger-base-search-design.md).
   Hairlines for structure, mono labels, Spectral titles, gold position
   marks. Gold here is --kk-gold-ink: these views sit on the
   theme-following reading field, never on constant black. */

/* ── Toolbar ── */
.base-toolbar {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  padding-top: 0.25rem;
  margin-bottom: 1rem;
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--color-fd-background);
}

.base-view-tabs {
  display: flex;
  gap: 0;
  overflow-x: auto;
  border-bottom: 1px solid var(--color-fd-border);
}

.base-view-tabs::-webkit-scrollbar {
  display: none;
}

.base-view-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.7rem;
  margin-bottom: -1px;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--color-fd-muted-foreground);
  font-family: var(--font-mono-plex), ui-monospace, monospace;
  font-size: 0.67rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.base-view-tab:hover,
.base-view-tab:focus-visible {
  color: var(--color-fd-foreground);
}

.base-view-tab.active {
  color: var(--color-fd-foreground);
  border-bottom-color: var(--kk-gold-ink);
}

.base-toolbar-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: auto;
  padding-bottom: 0.5rem;
}

.base-results-count {
  font-family: var(--font-mono-plex), ui-monospace, monospace;
  font-size: 0.67rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-fd-muted-foreground);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.base-search {
  position: relative;
  display: flex;
  align-items: center;
}

.base-search-icon {
  position: absolute;
  left: 0;
  width: 13px;
  height: 13px;
  color: var(--color-fd-muted-foreground);
  pointer-events: none;
}

.base-search-input {
  width: 10rem;
  padding: 0.3rem 1.25rem 0.3rem 1.25rem;
  font-size: 0.8125rem;
  border: 0;
  border-bottom: 1px solid var(--color-fd-border);
  border-radius: 0;
  background: transparent;
  color: var(--color-fd-foreground);
  outline: none;
  transition: border-color 0.15s ease, width 0.2s ease;
}

.base-search-input:focus {
  border-bottom-color: var(--kk-gold-ink);
  width: 14rem;
}

.base-search-clear {
  position: absolute;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.125rem;
  border: none;
  background: transparent;
  color: var(--color-fd-muted-foreground);
  cursor: pointer;
}

.base-search-clear:hover {
  color: var(--color-fd-foreground);
}

/* ── Table ── */
.base-table-wrapper {
  overflow-x: auto;
}

.base-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  line-height: 1.5;
}

.base-table thead th {
  padding: 0.55rem 0.75rem;
  text-align: left;
  white-space: nowrap;
  background: var(--color-fd-background);
  position: sticky;
  top: 0;
  z-index: 10;
  /* the ledger's head rule: heavier than row hairlines */
  border-bottom: 2px solid var(--color-fd-border);
  color: var(--color-fd-muted-foreground);
  font-family: var(--font-mono-plex), ui-monospace, monospace;
  font-size: 0.67rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.base-table tbody tr {
  border-bottom: 1px solid var(--color-fd-border);
  transition: background-color 0.15s ease;
}

.base-table tbody tr:hover:not(.base-group-header),
.base-table tbody tr:focus-within:not(.base-group-header) {
  background: color-mix(in srgb, var(--color-fd-foreground) 4%, transparent);
}

.base-table tbody tr:hover:not(.base-group-header) td:first-child,
.base-table tbody tr:focus-within:not(.base-group-header) td:first-child {
  /* the gold position segment — same mark as the sidebar's active entry */
  box-shadow: inset 2px 0 0 var(--kk-gold-ink);
}

.base-table tbody td {
  padding: 0.5rem 0.75rem;
  vertical-align: top;
  max-width: var(--base-cell-max-width, 24rem);
}

.base-first-col {
  width: var(--base-first-col-width, 18rem);
  max-width: var(--base-first-col-width, 18rem);
}

.base-cell-content {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.base-name-link {
  font-family: var(--font-spectral), Georgia, serif;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-fd-foreground);
  text-decoration: none;
  transition: color 0.15s ease;
}

.base-name-link:hover,
.base-name-link:focus-visible {
  color: var(--kk-gold-ink);
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-color: color-mix(in srgb, var(--kk-gold-ink) 55%, transparent);
}

/* Group headers */
.base-group-header td {
  padding: 1rem 0.75rem 0.4rem;
  background: transparent;
  border-bottom: 1px solid var(--color-fd-border);
  font-family: var(--font-mono-plex), ui-monospace, monospace;
  font-size: 0.67rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-fd-foreground);
}

.base-group-label {
  color: var(--color-fd-muted-foreground);
  margin-right: 0.375rem;
}

.base-group-count {
  margin-left: 0.5rem;
  color: var(--color-fd-muted-foreground);
  font-variant-numeric: tabular-nums;
}

/* Summary footer: the ledger's closing double rule */
.base-table tfoot {
  border-top: 3px double var(--color-fd-border);
  background: transparent;
}

.base-table tfoot td {
  padding: 0.5rem 0.75rem;
  color: var(--color-fd-muted-foreground);
  font-family: var(--font-mono-plex), ui-monospace, monospace;
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* Boolean checkbox */
.base-checkbox {
  appearance: none;
  width: 15px;
  height: 15px;
  border: 1px solid var(--color-fd-border);
  border-radius: 0;
  vertical-align: middle;
  position: relative;
  cursor: default;
  flex-shrink: 0;
  margin: 0;
  padding: 0;
}

.base-checkbox:checked {
  background: var(--kk-gold-ink);
  border-color: var(--kk-gold-ink);
}

.base-checkbox:checked::after {
  content: '';
  position: absolute;
  top: 1px;
  left: 4px;
  width: 5px;
  height: 9px;
  border: solid var(--color-fd-background);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* ── Shared ── */
.base-empty {
  padding: 2rem 0;
  text-align: center;
  font-size: 0.875rem;
  color: var(--color-fd-muted-foreground);
}

/* Tags: quiet mono labels, never pills */
.base-card-tag {
  display: inline-block;
  font-family: var(--font-mono-plex), ui-monospace, monospace;
  font-size: 0.62rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0;
  border-radius: 0;
  background: transparent;
  color: var(--color-fd-muted-foreground);
  white-space: nowrap;
  line-height: 1.5;
}

.base-card-tag-more {
  opacity: 0.6;
}

/* ── Gallery ── */
.base-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--base-card-min, 280px), 1fr));
  gap: 1.25rem;
}

.base-card-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.base-card-group-header {
  margin: 0 0 0.75rem;
  font-family: var(--font-mono-plex), ui-monospace, monospace;
  font-size: 0.67rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-fd-muted-foreground);
  border-bottom: 1px solid var(--color-fd-border);
  padding-bottom: 0.5rem;
}

.base-card {
  display: flex;
  flex-direction: column;
  border: none;
  border-radius: 0;
  overflow: visible;
  height: 100%;
  text-decoration: none;
  color: inherit;
}

.base-card-image {
  display: block;
  width: 100%;
  aspect-ratio: 1 / var(--base-card-aspect, 0.625);
  background-size: cover;
  background-position: center;
  background-color: var(--color-fd-muted);
  /* the hairline frame; caption sits below it, unframed */
  border: 1px solid var(--color-fd-border);
  transition: border-color 0.15s ease;
}

.base-card:hover .base-card-image,
.base-card:focus-visible .base-card-image {
  border-color: var(--kk-gold-ink);
}

.base-card-body {
  padding: 0.6rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  flex: 1;
}

.base-card-title {
  font-family: var(--font-spectral), Georgia, serif;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.35;
  color: var(--color-fd-foreground);
  transition: color 0.15s ease;
}

.base-card:hover .base-card-title {
  color: var(--kk-gold-ink);
}

.base-card-desc {
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--color-fd-muted-foreground);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
}

.base-card-footer {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  margin-top: auto;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-fd-border);
  font-size: 0.75rem;
  color: var(--color-fd-muted-foreground);
}

.base-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.6rem;
}

.base-card-meta-inline {
  display: flex;
  gap: 0.375rem;
  line-height: 1.5;
}

.base-card-meta-label {
  font-family: var(--font-mono-plex), ui-monospace, monospace;
  font-size: 0.65rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  flex-shrink: 0;
}

.base-card-meta-label::after {
  content: ':';
}

.base-card-meta-value {
  color: var(--color-fd-foreground);
}

/* ── List ── */
.base-list-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.base-list-group-header {
  margin: 0 0 0.5rem;
  font-family: var(--font-mono-plex), ui-monospace, monospace;
  font-size: 0.67rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-fd-muted-foreground);
  border-bottom: 1px solid var(--color-fd-border);
  padding-bottom: 0.5rem;
}

.base-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.base-list-entry {
  border-bottom: 1px solid var(--color-fd-border);
}

.base-list-entry-link {
  display: block;
  padding: 0.8rem 0.75rem;
  text-decoration: none;
  color: inherit;
  border-radius: 0;
  transition: background 0.15s ease;
}

.base-list-entry-link:hover,
.base-list-entry-link:focus-visible {
  background: color-mix(in srgb, var(--color-fd-foreground) 4%, transparent);
  box-shadow: inset 2px 0 0 var(--kk-gold-ink);
}

.base-list-entry-header {
  display: flex;
  align-items: center;
  gap: 0.5rem 0.75rem;
  flex-wrap: wrap;
}

.base-list-entry-title {
  font-family: var(--font-spectral), Georgia, serif;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.35;
  color: var(--color-fd-foreground);
  margin: 0;
  transition: color 0.15s ease;
}

.base-list-entry-link:hover .base-list-entry-title {
  color: var(--kk-gold-ink);
}

.base-list-entry-tags {
  display: flex;
  gap: 0.25rem 0.6rem;
  flex-wrap: wrap;
}

.base-list-entry-desc {
  font-size: 0.8125rem;
  line-height: 1.55;
  color: var(--color-fd-muted-foreground);
  margin: 0.25rem 0 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.base-list-entry-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.75rem;
  margin-top: 0.375rem;
  font-size: 0.75rem;
  color: var(--color-fd-muted-foreground);
}

.base-list-entry-meta-item {
  display: inline-flex;
  align-items: baseline;
  gap: 0.25rem;
}

.base-list-entry-meta-label {
  font-family: var(--font-mono-plex), ui-monospace, monospace;
  font-size: 0.65rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.base-list-entry-meta-label::after {
  content: ':';
}

.base-list-entry-sep {
  color: var(--color-fd-border);
}

/* ── Load more ── */
.base-load-more {
  display: block;
  width: 100%;
  padding: 0.6rem;
  margin-top: 0.75rem;
  text-align: center;
  font-family: var(--font-mono-plex), ui-monospace, monospace;
  font-size: 0.67rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-fd-muted-foreground);
  background: transparent;
  border: none;
  border-block: 1px solid var(--color-fd-border);
  border-radius: 0;
  cursor: pointer;
  transition: color 0.15s ease;
}

.base-load-more:hover,
.base-load-more:focus-visible {
  color: var(--kk-gold-ink);
}

/* ── Mobile ── */
@media (max-width: 640px) {
  .base-toolbar {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .base-toolbar-right {
    width: 100%;
  }

  .base-search {
    flex: 1;
  }

  .base-search-input,
  .base-search-input:focus {
    width: 100%;
  }

  .base-table {
    font-size: 0.8125rem;
  }

  .base-table thead th,
  .base-table tbody td {
    padding: 0.375rem 0.5rem;
  }

  .base-card-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .base-view-tab,
  .base-search-input,
  .base-name-link,
  .base-card-image,
  .base-card-title,
  .base-list-entry-link,
  .base-list-entry-title,
  .base-load-more,
  .base-table tbody tr {
    transition: none;
  }
}
```

Note the deliberate deletion: the old `.base-search-input` used `scrollbar-width: none` on tabs only — kept — but the old boxed borders, radii, zebra `--color-fd-muted` fills, and pill backgrounds do not reappear anywhere.

- [ ] **Step 2: Remove the old block from `app/global.css` and import the new file**

Delete everything from the line `/* ── Bases: toolbar ── */` (line ~463) through the closing brace of the `@media (max-width: 640px)` bases-mobile block (line ~1026 — the block containing `.base-card-body { padding: 0.75rem; }`). Verify with `grep -c "base-table\|base-card\|base-list-entry\|base-load-more\|base-toolbar" app/global.css` → expected `0`.

Add the import next to the other ledger imports (where `@import "./tag-ledger.css";` lives):

```css
@import "./base-ledger.css";
```

- [ ] **Step 3: Verify build and visual state**

Run: `pnpm types:check && pnpm lint && pnpm build`
Expected: all green; export completes.

With `pnpm dev` running, screenshot key pages headlessly (fresh profile every time — reused profiles serve stale dev CSS):

```bash
SCRATCH=$(mktemp -d)
"/Applications/Helium.app/Contents/MacOS/Helium" --headless --disable-gpu \
  --user-data-dir="$SCRATCH" --window-size=1440,1000 \
  --screenshot=/tmp/ledger-table.png "http://localhost:3000/dictionary" &
sleep 8 && pkill -f "Helium.*headless"
```

Repeat for `/tags/teaching` (table under Night Threshold), `/articles` (folder index), and a gallery/list view page if one exists (check `locales/en/public/bases/*/index.json` for a `"type":"gallery"` view; if none exists, verify gallery/list on `/base-test` which exercises multiple views). Read each PNG: hairline rows, mono heads, no boxed cells/cards, gold hover can't be screenshotted (hover-capable pointer absent headlessly) — verify hover styles by grepping the built CSS instead: `grep -c "base-name-link:hover" .next/` output or the `out/_next/static/**/*.css` bundle.

- [ ] **Step 4: Commit**

```bash
git add app/base-ledger.css app/global.css
git commit -m "feat: convert base views to the night ledger idiom"
```

---

### Task 4: Search dialog — constant night

**Files:**
- Modify: `app/search.css` (full rewrite)
- Modify: `components/search-dialog.tsx` (strings prop + mark class)
- Modify: `components/root-provider.tsx` (inject strings into fumadocs' search slot)
- Modify: `app/layout.tsx` (pass strings from the server)

**Interfaces:**
- Consumes: Task 1's `search*` keys.
- Produces: `export interface SearchStrings { placeholder: string; loading: string; typeToBegin: string; noResults: string; hintNavigate: string; hintOpen: string; hintClose: string }` from `components/search-dialog.tsx`; `RootProvider` gains optional prop `searchStrings?: SearchStrings`.

- [ ] **Step 1: Thread strings through the dialog component**

In `components/search-dialog.tsx`, above the component:

```ts
export interface SearchStrings {
  placeholder: string;
  loading: string;
  typeToBegin: string;
  noResults: string;
  hintNavigate: string;
  hintOpen: string;
  hintClose: string;
}

const DEFAULT_STRINGS: SearchStrings = {
  placeholder: 'Search the library…',
  loading: 'Loading search index…',
  typeToBegin: 'Type to search…',
  noResults: 'No results found',
  hintNavigate: 'Navigate',
  hintOpen: 'Open',
  hintClose: 'Close',
};
```

Extend the component signature:

```tsx
export default function SearchDialog({
  open,
  onOpenChange,
  strings = DEFAULT_STRINGS,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strings?: SearchStrings;
}) {
```

Replace the literals: `placeholder="Search documentation…"` → `placeholder={strings.placeholder}`; `Loading search index…` → `{strings.loading}`; `Type to search…` → `{strings.typeToBegin}`; `No results found` → `{strings.noResults}`; footer spans → `{strings.hintNavigate}` / `{strings.hintOpen}` / `{strings.hintClose}`.

In `highlightText`, replace the Tailwind mark classes with a stylesheet hook:

```tsx
      <mark key={i} className="fd-search-mark">
```

- [ ] **Step 2: Inject strings via `root-provider.tsx` and `layout.tsx`**

`components/root-provider.tsx`:

```tsx
'use client';

import { RootProvider as FumadocsProvider } from 'fumadocs-ui/provider/next';
import { useMemo, type ComponentProps } from 'react';
import SearchDialog, { type SearchStrings } from './search-dialog';

type Props = Omit<ComponentProps<typeof FumadocsProvider>, 'search'> & {
  searchStrings?: SearchStrings;
};

export function RootProvider({ searchStrings, ...props }: Props) {
  const search = useMemo(
    () => ({
      SearchDialog: (p: { open: boolean; onOpenChange: (open: boolean) => void }) => (
        <SearchDialog {...p} strings={searchStrings} />
      ),
    }),
    [searchStrings],
  );
  return <FumadocsProvider {...props} search={search} />;
}
```

`app/layout.tsx` — extend the existing `<RootProvider i18n={…}>` call:

```tsx
        <RootProvider
          i18n={i18nProvider(siteLanguage.translations)}
          searchStrings={{
            placeholder: siteLanguage.searchPlaceholder,
            loading: siteLanguage.searchLoading,
            typeToBegin: siteLanguage.searchTypeToBegin,
            noResults: siteLanguage.searchNoResults,
            hintNavigate: siteLanguage.searchHintNavigate,
            hintOpen: siteLanguage.searchHintOpen,
            hintClose: siteLanguage.searchHintClose,
          }}
        >
```

- [ ] **Step 3: Rewrite `app/search.css` as constant night**

Full file content:

```css
/* Search dialog — constant night: black in BOTH color modes. Search is a
   navigation surface, and navigation is night in this system (sidebar,
   threshold, prev/next band). Gold on this ground is --kk-ember, never
   light-mode --kk-gold-ink (same rule as reader-shell.css night scopes).
   fd tokens are remapped locally so inner rules stay on fd vars. */

.fd-search-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: min(92vw, 860px);
  width: 860px;
  max-height: min(80vh, 560px);
  margin: 0;
  padding: 0;
  border: 1px solid var(--kk-glass-line);
  border-radius: 0;
  background: var(--kk-night);
  color: var(--kk-night-fg);
  --color-fd-foreground: var(--kk-night-fg);
  --color-fd-muted-foreground: var(--kk-night-muted);
  --color-fd-border: var(--kk-glass-line);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
  overflow: hidden;
}

.fd-search-dialog::backdrop {
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

/* Inner layout */
.fd-search-panel {
  display: flex;
  flex-direction: column;
  height: min(80vh, 560px);
  max-height: min(80vh, 560px);
}

/* Header */
.fd-search-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-fd-border);
  flex-shrink: 0;
}

.fd-search-icon {
  color: var(--color-fd-muted-foreground);
  flex-shrink: 0;
}

.fd-search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-size: 15px;
  color: var(--color-fd-foreground);
  font-family: inherit;
  caret-color: var(--kk-ember);
}

.fd-search-input::placeholder {
  color: var(--color-fd-muted-foreground);
}

.fd-search-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.fd-search-close kbd,
.fd-search-footer kbd {
  display: inline-block;
  padding: 2px 6px;
  font-size: 10px;
  font-family: var(--font-mono-plex), ui-monospace, monospace;
  letter-spacing: 0.04em;
  line-height: 1.4;
  color: var(--color-fd-muted-foreground);
  background: transparent;
  border: 1px solid var(--color-fd-border);
  border-radius: 0;
}

/* Body: split layout */
.fd-search-body {
  display: flex;
  flex: 1;
  min-height: 0;
}

/* Results list (left) */
.fd-search-results {
  flex: 0 0 min(50%, 380px);
  overflow-y: auto;
  padding: 4px 0;
  border-right: 1px solid var(--color-fd-border);
  overscroll-behavior: contain;
}

.fd-search-empty {
  padding: 32px 16px;
  text-align: center;
  color: var(--color-fd-muted-foreground);
  font-size: 14px;
}

/* Result item */
.fd-search-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-radius: 0;
  background: none;
  cursor: pointer;
  text-align: left;
  color: var(--color-fd-foreground);
  font-family: inherit;
  font-size: 14px;
  line-height: 1.4;
  transition: background 0.1s ease;
}

.fd-search-item.active,
.fd-search-item:hover {
  background: rgba(255, 255, 255, 0.06);
  /* gold position segment — same mark as sidebar and ledger rows */
  box-shadow: inset 2px 0 0 var(--kk-ember);
}

.fd-search-item-icon {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--color-fd-muted-foreground);
}

.fd-search-item-content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.fd-search-item-breadcrumb {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  color: var(--color-fd-muted-foreground);
  font-weight: 400;
}

.fd-search-item-title {
  font-weight: 500;
}

/* Highlight marks */
.fd-search-mark {
  background: color-mix(in srgb, var(--kk-ember) 24%, transparent);
  color: var(--kk-ember);
  border-radius: 0;
  padding: 0 1px;
}

/* Preview pane (right) */
.fd-search-preview {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  overscroll-behavior: contain;
}

.fd-search-preview-title {
  font-family: var(--font-spectral), Georgia, serif;
  font-size: 17px;
  font-weight: 500;
  margin-bottom: 4px;
}

.fd-search-preview-section {
  font-family: var(--font-mono-plex), ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-fd-muted-foreground);
  margin-bottom: 12px;
}

.fd-search-preview-content {
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-fd-muted-foreground);
}

/* Footer */
.fd-search-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-top: 1px solid var(--color-fd-border);
  font-size: 11px;
  font-family: var(--font-mono-plex), ui-monospace, monospace;
  letter-spacing: 0.05em;
  color: var(--color-fd-muted-foreground);
  flex-shrink: 0;
}

.fd-search-footer kbd {
  margin-right: 3px;
}

/* Mobile: hide preview pane */
@media (max-width: 640px) {
  .fd-search-dialog {
    max-width: 95vw;
  }

  .fd-search-results {
    flex: 1;
    border-right: none;
  }

  .fd-search-preview {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fd-search-item {
    transition: none;
  }
}
```

- [ ] **Step 4: Verify**

Run: `pnpm types:check && pnpm lint && pnpm test && pnpm build`
Expected: green.

Headless check (the dialog opens via JS; drive it with a keyboard event):

```bash
SCRATCH=$(mktemp -d)
"/Applications/Helium.app/Contents/MacOS/Helium" --headless --disable-gpu \
  --user-data-dir="$SCRATCH" --window-size=1200,800 \
  --screenshot=/tmp/search-night.png \
  "http://localhost:3000/articles/style-test" &
```

If keyboard-driving proves flaky headlessly, verify instead that the built page CSS contains `.fd-search-dialog{...background:var(--kk-night)` (grep the CSS bundle under `out/_next/static/`) and hand the visual check to the user. Verify light mode too: the dialog must stay black when `<html>` lacks the `dark` class.

- [ ] **Step 5: Commit**

```bash
git add app/search.css components/search-dialog.tsx components/root-provider.tsx app/layout.tsx
git commit -m "feat: constant-night search dialog with localized strings"
```

---

### Task 5: Full verification sweep and docs

**Files:**
- Modify: `CLAUDE.md` (search + bases sections)
- Modify: `docs/superpowers/specs/2026-07-19-night-ledger-base-search-design.md` (status line)

**Interfaces:**
- Consumes: everything above.
- Produces: shipped state.

- [ ] **Step 1: Run the spec's verification list**

1. `pnpm types:check && pnpm lint && pnpm test` — green, no new lint warnings.
2. `pnpm build` — export completes.
3. Headless screenshots (fresh `--user-data-dir` each; `await document.fonts.ready` when using puppeteer-core against `/Applications/Helium.app/Contents/MacOS/Helium`): `/dictionary` (table), `/tags/teaching` (ledger under threshold — confirm no width regression), `/articles` (folder index), `/base-test` (multi-view tabs), one dark-mode variant (toggle by evaluating `document.documentElement.classList.add('dark')` via puppeteer-core before the screenshot — there is no URL query switch).
4. Confirm the table-row → H1 view-transition morph still works (code inspection: `onClick` handler intact in `bases-view-table.tsx`; the class swap must not have touched it).
5. Confirm no horizontal page scroll: table wrapper keeps `overflow-x: auto`.

- [ ] **Step 2: Update docs**

- `CLAUDE.md` **Bases** section: note view styles live in `app/base-ledger.css` (ledger idiom) and strings thread from `BasesPageContent`/`components/mdx.tsx` via `basesStringsFrom`.
- `CLAUDE.md` **Search** client-side bullet: note the dialog is constant-night (both modes) with strings from `RootProvider`'s `searchStrings` prop.
- Spec status line → `**Status:** Implemented (<date>).`

- [ ] **Step 3: Final commit**

```bash
git add CLAUDE.md docs/superpowers/specs/2026-07-19-night-ledger-base-search-design.md
git commit -m "docs: mark night ledger pass implemented"
```

- [ ] **Step 4: Hand off for human eyeball**

Per the `visual-qa` skill, hand the user the checklist: base table/gallery/list feel, tag-page ledger under the threshold, search dialog in light + dark, mobile filter input, hover gold segments.
