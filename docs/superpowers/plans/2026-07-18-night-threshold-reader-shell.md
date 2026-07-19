# Night Threshold Reader Shell Implementation Plan

**Goal:** Replace the generic Fumadocs-facing reader chrome with the approved Night Threshold system while preserving Fumadocs navigation, specialized viewers, reader mode, sidenotes, and generated content behavior.

**Architecture:** Keep `DocsLayout` and `DocsPage`. Derive a small server-side entry-chrome model from page metadata, render it through a shared Night Threshold header, and restyle project-owned tags, Properties, backlinks, and footer surfaces. Use the installed Fumadocs 16.9.3 sidebar `components.Item` seam for active page links and documented stable layout IDs only where no public component seam exists.

**Stack:** Next.js 16, React 19, TypeScript, Fumadocs UI 16.9.3, Tailwind CSS, project CSS tokens.

---

## Task 1: Model reader-shell page kinds and promoted metadata

**Files:**

- Create: `lib/entry-chrome.ts`
- Create: `tests/entry-chrome.test.ts`

**Steps:**

1. Define the page kinds the shell needs: ordinary entry, tags index, individual tag page, and specialized page.
2. Add a pure builder that normalizes title, description, aliases, tags, optional `arabic`, and section identity from page data without exposing arbitrary loader internals.
3. Mark `arabic` as a promoted Properties key only when a valid non-empty string is displayed.
4. Test ordinary entries with and without Arabic, the tags index, a Base-backed tag page, non-tag Base pages, and full specialized pages.
5. Run `pnpm vitest run tests/entry-chrome.test.ts`.

## Task 2: Build the shared Night Threshold entry header

**Files:**

- Create: `components/entry-threshold.tsx`
- Modify: `components/page-tags.tsx`
- Create: `app/reader-shell.css`
- Modify: `app/global.css`

**Steps:**

1. Render the section label, `DocsTitle`, description, optional Arabic title, aliases, linked tags, and page actions through one server component.
2. Keep the meaningful Arabic text accessible once with `dir="rtl"` and `lang="ar"`; make any duplicate typographic counterform decorative.
3. Add a plain metadata variant to `PageTags`: linked text separated typographically, with no button, pill, swatch, tilt, or patch color.
4. Implement the constant-black threshold, responsive type scale, restrained gold Arabic/position accents, and safe wrapping in `reader-shell.css`.
5. Import the reader-shell stylesheet before `karkari-theme.css` so theme tokens remain authoritative.

## Task 3: Integrate page-kind-aware chrome without touching specialized viewers

**Files:**

- Modify: `app/(docs)/[...slug]/page.tsx`
- Modify: `components/properties-panel.tsx`

**Steps:**

1. Build the entry-chrome model once after page resolution.
2. Use Night Threshold for ordinary entries, `/tags`, and `/tags/<tag>`.
3. Preserve the current header/chrome path for graph, canvas, Excalidraw, slides, and non-tag Base/full pages.
4. Pass page actions into the threshold without changing their existing destinations or permissions.
5. Add `excludeKeys` to `PropertiesPanel` and exclude `arabic` only when it was promoted into the threshold.
6. Preserve reader-mode selectors and the current order of body, backlinks, footer, and comments.

## Task 4: Turn the desktop sidebar into the night index

**Files:**

- Create: `components/night-sidebar-item.tsx`
- Create: `components/site-identity.tsx`
- Modify: `app/(docs)/[...slug]/layout.tsx`
- Modify: `app/reader-shell.css`
- Modify: `app/global.css`

**Steps:**

1. Wrap Fumadocs' exported `SidebarItem` through the supported `sidebar.components.Item` interface.
2. Resolve current-page state from the pathname and preserve the original item name, icon, URL, external-link behavior, prefetching, and link semantics.
3. Render a bilingual Latin/Arabic site identity in the docs sidebar title without changing the home navbar.
4. Apply the constant-black surface only to the desktop `#nd-sidebar`; leave Fumadocs' mobile drawer structure intact.
5. Replace the stock active pill with white text plus one solid gold line extending toward the reading field. Preserve `data-active`/`aria-current` state and visible focus.
6. Retheme the sidebar banner links, search trigger, collapse control, locale switcher, and theme control for black-ground contrast without making them focal components.
7. Document the stable `#nd-sidebar` dependency beside the selector.

## Task 5: Establish the spacious article reading rhythm

**Files:**

- Modify: `app/reader-shell.css`

**Steps:**

1. Preserve the current prose measure and body line height.
2. Give article `h2` elements a short static gold rule with no infinite animation.
3. Apply the restrained underline treatment only to internal/hash links inside article prose; keep external-link affordances intact.
4. Restyle page-action controls as neutral utilities with visible hover and focus.
5. Retain the clerk TOC and its existing overflow fixes; use neutral hairlines and one gold active-position segment.
6. Verify that sidenotes and annotations do not inherit reader-shell rules intended for article prose.

## Task 6: Convert Properties into a quiet metadata ledger

**Files:**

- Modify: `app/properties-panel.css`
- Modify: `components/properties-panel.tsx`

**Steps:**

1. Keep the existing semantic `details`, `summary`, and `dl` structure.
2. Replace rounded/pill-heavy treatments with a neutral hairline surface and one solid gold/dark structural edge.
3. Keep dates, URLs, booleans, numbers, and wikilinks legible without categorical patch colors.
4. Preserve self-hiding behavior after promoted keys are excluded.
5. Check narrow layouts for label/value wrapping and long URLs.

## Task 7: Replace backlink cards with the connection rail

**Files:**

- Modify: `components/backlinks.tsx`
- Modify: `app/reader-shell.css`

**Steps:**

1. Remove the Fumadocs `Card` dependency from backlinks.
2. Render real inbound links as a semantic list with title and optional description.
3. Add the solid vertical rail, gold branch, and terminal only when backlinks exist.
4. Preserve the existing two-column relationship with `LocalGraph`; leave LocalGraph internals and appearance unchanged.
5. Preserve the no-backlinks/graph-only state without an empty rail.
6. Ensure hover, focus, long titles, and the existing scroll cap remain usable.

## Task 8: Rebuild `/tags` as a typographic ledger

**Files:**

- Modify: `components/tags-index.tsx`
- Modify: `components/tags-filter.tsx`
- Modify: `app/tags.css`

**Steps:**

1. Keep the current tag index data, hierarchy, URLs, descriptions, and client-side filtering.
2. Replace rounded cards with a two-column hairline ledger that collapses to one column.
3. Represent nested tags with indentation and one short solid gold hierarchy rail.
4. Integrate the filter with the ledger's top rule and add an explicit accessible label.
5. Show total and filtered counts without turning them into badges.
6. Preserve the existing no-tags and no-matches messages.
7. Leave individual `/tags/<tag>` Base results unchanged beneath their new threshold.

## Task 9: Close ordinary entries with the black previous/next band

**Files:**

- Modify: `app/(docs)/[...slug]/page.tsx`
- Modify: `app/reader-shell.css`

**Steps:**

1. Continue using Fumadocs' `PageFooter` so page-tree ordering and destination resolution stay authoritative.
2. Add a dedicated class to the existing manual footer render.
3. Style its links as a compact black band with display-face destination titles, plain direction/description labels, and restrained gold arrows.
4. Stack destinations on mobile and preserve keyboard focus.
5. Do not render the band on chromeless specialized pages, matching current behavior.

## Task 10: Verify responsive, theme, and interaction behavior

**Files:**

- Verify: `app/(docs)/[...slug]/layout.tsx`
- Verify: `app/(docs)/[...slug]/page.tsx`
- Verify: `app/(home)/page.tsx`
- Verify: `app/(home)/design/page.tsx`

**Steps:**

1. Run `pnpm vitest run`.
2. Run `pnpm types:check`.
3. Run `pnpm lint`, separating pre-existing warnings from new failures.
4. Start `pnpm dev` and confirm successful responses for `/`, `/design`, `/start-here`, a terminology entry with Arabic, an ordinary entry without Arabic, `/tags`, one `/tags/<tag>` page, and `/graph`.
5. Check the development console for hydration/runtime errors.
6. Hand off visual QA for desktop/mobile, light/dark, reader mode, sidebar collapse, keyboard focus, long titles, missing Arabic, tag filtering, no-results, backlinks, home-to-docs transitions, and specialized-page non-regression.
7. Request an independent code review and resolve all Critical or Important findings before completion.
