# Night Ledger: Base Views & Search Dialog

**Date:** 2026-07-19

**Status:** Approved design; awaiting implementation

**Scope:** Second Night Threshold pass — extends the reader shell's ledger
language to the four Base views (table, list, gallery, sphere) and the
Cmd+K search dialog. Successor to
`2026-07-18-night-threshold-reader-shell-design.md` (implemented), which
deferred these surfaces.

## Goal

Data surfaces (Base views on folder indexes, tag pages, and inline embeds)
and the search palette should read as part of the Night Threshold system —
hairlines, mono labels, Spectral titles, restrained gold — instead of
generic Fumadocs styling, without changing any behavior.

## Approach

CSS-first restyle with light component touches. Keep the existing DOM,
behavior, and data flow of all five components; do the conversion in
focused stylesheets plus small component edits only where CSS cannot reach
(string localization, class/data hooks, small structural affordances like a
result count). Rejected alternatives: extracting a shared ledger-row
primitive across table/list/tags/backlinks (churns four working components
for no user-visible gain), and adopting fumadocs' search UI as a themable
base (the custom dialog's static index, split-pane preview, and CJK
encoder are deliberate).

### Relationship to the in-flight bases work

The uncommitted bases stream (sphere view, YouTube thumbnails, parser
tweaks) is **covered** by this design: the sphere is treated as a fourth
view type and lands already night-styled. This spec styles only its frame
and labels — never the sphere's internal rendering.

## Shared ledger vocabulary

All Base views inherit the language already shipped in the tag ledger and
properties ledger:

- Solid hairlines (`--color-fd-border`) for structure — never boxed cells,
  zebra fills, rounded cards, or shadows.
- Mono uppercase labels (`--font-mono-plex`) for column heads, group
  labels, counts, and view tabs.
- Spectral for note titles (name columns, gallery captions, list titles).
- Gold (`--kk-gold-ink`) marks position and focus only: a short left-edge
  segment on the hovered/active row — the same mark as the sidebar's
  active entry — plus underlines/accents. Never decorative fills.
- Hover/focus adds a faint ink wash (`currentColor` at low opacity);
  rows never shift, tilt, or grow.

## Base views

### Table (`components/bases-view-table.tsx`)

- Typographic ledger: rows separated by solid hairlines; no cell borders
  or background fills.
- Column heads: mono uppercase, closed by a single heavier rule (2px) that
  separates head from body; ordinary rows use 1px hairlines.
- Name column in Spectral; other cells inherit body/muted tokens.
- Row hover/focus-within: ink wash + gold left-edge segment.
- Group header rows: mono section label + count on their own hairline.
- Numeric summary footer keeps `Σ` in mono, sitting below a closing
  double hairline (the ledger's "total" rule).
- The click-time `viewTransitionName` row-morph behavior is untouched.
- "Show more" pagination button restyled as a quiet mono utility control.

### List (`components/bases-view-list.tsx`)

- Hairline-separated rows: Spectral title, muted description beneath.
- Typography matches the backlink rail's rows, but **without** the rail —
  the rail means "inbound references" and is not reused for generic lists.

### Gallery (`components/bases-view-gallery.tsx`)

- Grid layout preserved. Cards flatten: square-cornered images inside a
  1px hairline frame; no border-radius or shadow.
- Caption below the frame: mono label (if a secondary property is shown)
  + Spectral title.
- Hover/focus: frame hairline turns gold.

### Sphere (`components/bases-view-sphere.tsx`, WIP)

- Frame-only styling: night-consistent ground and the same mono view-label
  treatment as the other views. The sphere's internal canvas/imagery is
  out of scope.

### View switcher & toolbar (`components/bases-inline-view.tsx`)

- View tabs become mono utility tabs: quiet muted text, gold underline on
  the active view, visible focus ring.
- A result count renders beside the tabs (localized, reusing the
  `pageSingular`/`pagePlural`/`countOfLabel` strings where they fit).
- No black band: the full-ledger direction was chosen over a "night
  toolbar band" variant.

### Inline embeds

Fenced ` ```base ` blocks inside notes use the same components and inherit
everything automatically. No embed-specific styling beyond what spacing
requires.

## Search dialog — constant night

`components/search-dialog.tsx` + `app/search.css`. The palette is a night
surface in **both** color modes: black panel, white/muted-white text,
hairline internal rules, gold accents. Because the ground is always black,
gold uses the dark-mode-safe value (`--kk-gold-ink` as resolved in dark
mode) — never light-mode decorative gold on black.

- Input strip: mono placeholder, gold caret, hairline below.
- Results list: active row gets the gold left segment + ink wash (same
  vocabulary as sidebar and table rows).
- Preview pane: vertical hairline separator, Spectral title, muted body,
  gold `<mark>` highlights (replacing the current
  `bg-fd-primary/20 text-fd-primary` marks, which assume a
  theme-following ground).
- Footer kbd hints in mono on a hairline-topped strip.
- The `<dialog>` element, `showModal()`, keyboard navigation, flexsearch
  index, CJK encoder, and module-level cache are untouched.

## Component and data boundaries

- **New** `app/base-ledger.css` — all `base-*` view styles, migrated out
  of `app/global.css` (which currently holds them) and imported from
  `global.css` alongside `tag-ledger.css`/`properties-ledger.css`.
- **Edited** `app/search.css` — night conversion in place; the
  `fd-search-*` class contract is kept.
- **Component edits limited to:** class/data hooks, the result count, and
  string threading. No changes to `lib/base-*` logic, `base-properties`
  resolution, or search indexing.
- **Localization:** hardcoded strings move to `lib/site-strings.ts` +
  `content-site/{en,fr,cn}.json`: "No results." (`base-empty` and table
  variant), "Show more (N remaining)", "Search documentation…",
  "Loading search index…", "Type to search…", "No results found", and the
  footer hint labels (Navigate / Open / Close). Keep key parity across
  all three locales.
- Existing `--color-fd-*`, night, and gold tokens only; no new palette.

## State and failure behavior

- Empty/loading/no-match states keep plain-language copy, localized.
- The RSC first view (`bases-page.tsx`) renders the full ledger without
  JavaScript; view switching and re-evaluation remain the client
  enhancement they are today.
- Long cell values and long titles wrap; the table wrapper keeps its own
  horizontal scroll on overflow (with the overlay-scrollbar treatment) —
  the page body never scrolls horizontally.
- Reduced motion: hover/focus transitions settle immediately via the
  existing motion policy; no new animation is introduced.

## Accessibility

- Active search result remains conveyed by `data-active` semantics and
  contrast, not gold alone.
- Focus indicators visible on the black dialog ground and on ledger rows.
- Mono uppercase labels keep AA contrast via existing tokens.
- The gallery's image frames do not remove alt text or link semantics.

## Verification

1. Folder-index table, a grouped table, gallery, and list views render as
   ledgers in light and dark modes.
2. A `/tags/<tag>` page shows the ledger table beneath its Night Threshold
   with no width regression.
3. An inline ` ```base ` embed inherits the ledger inside prose.
4. Table row → destination H1 view-transition morph still works.
5. Search dialog is night in both modes; keyboard navigation, preview
   pane, highlights, and Escape behavior unchanged; strings localized in
   all three locales.
6. Sphere view (if the WIP has landed) sits correctly framed; if not
   landed, table/list/gallery are unaffected by its absence.
7. No horizontal page scroll from wide tables; the wrapper scrolls.
8. Headless Helium screenshots taken for each of the above surfaces.
9. `pnpm vitest run`, `pnpm types:check`, and `pnpm lint` pass without
   new failures.

## Acceptance statement

This pass succeeds when a reader moving from a themed article to a tag
page, folder index, or the search palette sees one continuous system —
night navigation, hairline ledgers, Spectral titles, gold position marks —
and nothing that still reads as stock documentation UI.
