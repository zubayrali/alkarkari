# Night Threshold Reader Shell

**Date:** 2026-07-18

**Status:** Implemented (2026-07-19). Two user-approved deviations: the clerk-style TOC bar was replaced by a "Contents" dropdown + reading time in the black utility strip (`components/night-contents.tsx`), and callout theming (originally deferred) shipped in this pass (`.kk-callout`).

**Scope:** First bespoke visual pass for generated knowledge-base pages, excluding the graph and other specialized viewers

## Goal

Carry the homepage's Primordial Light language into the knowledge base without making reading surfaces decorative, busy, or dependent on generic Fumadocs styling.

The result should feel recognizably Karkariya through the relationship between darkness, light, Arabic typography, and restrained gold. It should remain a simple knowledge base: pages, tags, metadata, references, and navigation.

## Selected direction: Night Threshold

Every ordinary entry begins in a black threshold containing its identity and then opens into a spacious reading field. A constant-black sidebar acts as the library's night index. One gold line connects the active entry to the reading surface.

The system is memorable because of its composition, not because every component wears a decorative motif.

### Visual thesis

- The sidebar and entry header are night.
- The article body is the light or ink reading field selected by the current theme.
- Arabic typography carries identity when real Arabic metadata exists.
- Gold marks position, focus, and connection.
- Solid neutral rules establish structure.
- Whitespace and typography provide most of the character.

## Explicit rejections

This design does not interpret the Muraqqaʿa as a generic rainbow, ordered spectrum, grid of colors, or set of arbitrary mini cloth patches.

The first reader-shell pass includes none of the following:

- rainbow or multi-color gradient bands;
- random or ordered patch-color decoration;
- tilted tag pills or hand-cut card rotations;
- dashed borders as a site-wide skin;
- garment fields or patchwork behind prose;
- ambient reader-page motion;
- decorative Arabic invented for pages that do not provide it;
- a repeated Rub el Hizb watermark on every page.

The existing deterministic `patchOf()` language remains available to surfaces where categorical color is genuinely useful, but it is not a load-bearing part of this reader-shell direction.

## Platform approach

Keep the current Fumadocs `DocsLayout` and its responsive, accessible layout behavior. Use its supported configuration and sidebar component seams, plus project-owned page components and styles.

Do not switch to the Notebook layout and do not run the Fumadocs customization command to fork layout source in this phase. Existing sidenotes, reader mode, sidebar persistence, search behavior, and view transitions should keep their established architecture.

Official Fumadocs reference: <https://www.fumadocs.dev/docs/ui/layouts/docs>

## First-pass scope

### Included

- documentation sidebar and active navigation;
- ordinary page title, description, aliases, tags, and optional Arabic identity;
- article heading and internal-link typography;
- table-of-contents bar and active position treatment;
- Properties panel;
- backlinks;
- previous and next navigation;
- tags index, hierarchy, counts, descriptions, and filtering;
- responsive, dark-mode, focus, and reduced-motion behavior for these surfaces.

### Deferred

- global graph and local-graph redesign;
- canvas, Base, and Excalidraw viewer redesigns;
- search-dialog redesign;
- callout and code-block redesign;
- review-card redesign;
- new motion effects;
- deletion of `/design` or its workshop modules;
- content editing or Arabic metadata authoring.

Specialized pages continue using their current layouts in this phase.
Tag pages are the only Base-backed page kind included. The `/tags` index receives the Night Threshold and tag ledger. Individual `/tags/<tag>` pages receive the Night Threshold but retain their existing Base results view beneath it. Non-tag Base pages retain their existing chrome and views.

## Sidebar: the night index

The sidebar is a constant-black surface in light and dark modes. It remains a functional Fumadocs page-tree navigator.

### Identity

The top identity lockup includes the site's Latin and Arabic names. This guarantees an authentic Arabic presence across the knowledge base without fabricating page-level Arabic.

### Navigation

- Folder and page labels are monochrome.
- Inactive entries use legible muted white.
- The active entry uses white text and a single solid gold line extending toward the reading field.
- Current state must also remain available semantically through Fumadocs' active or `aria-current` state; color is not the only indicator.
- Hover and focus use changes in text, rule, or ground contrast. Items do not tilt.
- The existing mobile drawer/header behavior remains intact.

The sidebar's Tags and Graph destinations remain available. The graph itself is not restyled in this phase.

## Entry threshold

A shared server-rendered entry header sits above the reading field.

It may display:

- section or page-kind label;
- title;
- description;
- optional Arabic title;
- aliases;
- linked tags;
- existing page actions in a quiet utility row.

### Arabic rule

The page's real `arabic` YAML/frontmatter property is the only source for a page-specific Arabic display.

- When present, it appears as the threshold's large typographic counterform or secondary title.
- It remains subordinate to the readable page title and never obscures actions or descriptions.
- When absent, the threshold reflows cleanly and contains no invented translation, placeholder Arabic, or fallback glyph.
- When promoted into the threshold, `arabic` is excluded from the Properties panel to prevent duplication.

The Rub el Hizb `۞` remains available only for occasional section breaks or index-level moments. It is not the default page watermark.

### Tags and aliases

Tags and aliases appear as restrained linked metadata, not pills. They use typography and spacing rather than background fills. Hover and focus may use a gold underline or rule.

## Reading field

The article body stays spacious and familiar.

- Spectral remains the display and heading face.
- The established readable body measure and line height are preserved.
- Body text remains on the standard Fumadocs background/foreground tokens.
- Internal links receive a restrained underline response; they do not become decorative labels.
- Section headings use hierarchy, whitespace, and at most one short static gold rule.
- No stitch animation runs while a visitor reads.

Reader mode continues hiding page actions, Properties, backlinks, comments, and footer surfaces as it does today.

## Properties panel

The Properties panel becomes a quiet terminology ledger rather than an ornamented garment label.

- Neutral surface and solid hairline perimeter.
- Compact label/value grid.
- One gold or dark structural rule may establish the panel's left edge or header hierarchy.
- No dashed perimeter, patch colors, tilt, or shadow-stack effect.
- Promoted header properties are excluded through an explicit interface rather than by duplicating hide logic in CSS.
- If no displayable properties remain, the panel self-hides as it does today.

## Tags directory

The `/tags` index uses the Night Threshold header and opens into a white/ink typographic ledger.

### Layout

- Two columns at comfortable desktop widths.
- One column on mobile.
- Each entry contains the hierarchical tag name, page count, and optional description.
- Entries are separated by solid hairlines, not cards.
- Nested tags indent beneath a short gold hierarchy rail.
- Hover and focus reveal a gold title or directional arrow without shifting the row.

### Filter

The filter is an understated text field integrated into the top ledger rule. It has a visible label, clear focus treatment, and preserves the current instant client-side filtering.

When there are no matching tags, the page shows the existing plain-language empty state within the reading field.

## Backlinks: connection rail

Backlinks stop rendering as generic rounded cards. They become a vertical reference list connected by a meaningful solid rail.

- The rail represents real inbound references.
- Each backlink branches from the rail with a short gold segment or terminal.
- Each row contains title and available description.
- Rows remain ordinary links with strong hover and focus states.
- The section is omitted when there are no backlinks and no adjacent local graph.
- The existing local graph remains functionally and visually unchanged in this phase.

## Previous and next navigation

Previous/next navigation closes the entry with a compact black panel or band.

- Direction is shown with plain labels and arrows.
- Destination titles use the display face.
- Gold marks the actionable direction.
- There are no patch swatches, tilted cards, or rainbow accents.
- Mobile stacks the destinations in reading order.

The exact implementation may style the existing Fumadocs footer if its DOM and data are sufficient. A project-owned footer is justified only if the existing interface cannot express the approved composition without brittle selectors.

## Table of contents and page actions

The existing clerk-style TOC remains compact.

- Container grouping uses neutral surface contrast and solid hairlines.
- The current heading receives a gold position segment.
- The bar must remain usable on mobile and with long tables of contents.

Page-action buttons remain utility controls. They use neutral grounds, visible focus, and gold only for active or selected state. They do not become thematic showpieces.

## Component and data boundaries

The page route derives a small entry-chrome model from page data rather than passing the entire arbitrary frontmatter object through every visual component.

The model contains only what the threshold needs:

- page kind;
- section identity;
- title;
- description;
- optional Arabic title;
- aliases;
- tags.

A shared entry-header component renders the model. The Properties panel receives an explicit set of promoted/excluded keys, including `arabic` when it is displayed in the threshold.

The tags ledger and backlink rail remain separate components with their current domain inputs. They do not own routing or source-loader behavior.

Reader-shell styles should live in a dedicated stylesheet or a comparably focused existing stylesheet. They must use existing `--color-fd-*`, night, and gold tokens rather than introduce another palette.

Fumadocs DOM selectors are used only when a supported component/configuration seam is unavailable. Any unavoidable stable-ID dependency must be documented beside the selector because sidebar, TOC, and sidenote geometry already rely on those IDs.

## State and failure behavior

- Missing `arabic`: remove the Arabic layer and reflow; no placeholder.
- Missing aliases or tags: omit their metadata group.
- No displayable Properties: omit the panel.
- No backlinks: omit the backlink list; preserve the local graph if it exists.
- No matching tags: show a calm empty state beneath the filter.
- Long titles or Arabic: wrap without colliding with page actions.
- JavaScript failure: all article content, metadata, tags, and backlink links remain server-rendered; only client filtering loses interactivity.

## Responsive behavior

- Desktop keeps the dark sidebar and full Night Threshold composition.
- Mobile retains Fumadocs' established drawer/header navigation.
- The threshold remains visible but reduces type scale and padding.
- Latin and Arabic titles wrap independently and never overlap.
- Tag ledger collapses from two columns to one.
- Backlink rail remains visible with shorter branches.
- Previous/next navigation stacks.
- No horizontal scrolling is introduced by active sidebar lines, Arabic type, or reference rails.

## Dark mode

The sidebar and threshold remain black. The reading field follows existing Fumadocs tokens and becomes the established near-black ink ground.

The threshold/body transition will be subtler in dark mode, so hierarchy depends on spacing, rules, and type—not a forced white surface. Gold text always uses the accessible mode-aware token rather than raw decorative gold.

## Motion

The reader shell introduces no ambient or scroll-driven animation.

Existing view transitions remain. Hover and focus responses use short color, opacity, or line transitions. Under `prefers-reduced-motion`, these settle immediately through the project's existing motion policy.

## Accessibility

- Semantic page titles, headings, navigation, tags, and links remain intact.
- Arabic content uses `dir="rtl"` and `lang="ar"`.
- Active navigation is conveyed by semantics and contrast as well as gold.
- Focus indicators remain clearly visible on black and reading grounds.
- Normal text meets WCAG AA contrast through existing design tokens.
- The decorative Arabic counterform is hidden from assistive technology only when the same text is also presented as a meaningful readable label; otherwise the meaningful Arabic remains accessible exactly once.
- The tag filter has an explicit accessible label rather than relying only on placeholder text.
- No motion carries navigation or meaning by itself.

## Verification

Implementation is complete when the following are verified:

1. A terminology page with `arabic` frontmatter shows it once in the threshold and not again in Properties.
2. An ordinary page without Arabic renders a balanced threshold with no empty ornament.
3. Pages with aliases and tags expose usable linked metadata.
4. Pages with and without Properties do not leave empty containers.
5. Backlinks render as the connection rail and disappear cleanly when absent.
6. `/tags`, a nested tag, filtering, and the no-results state work.
7. Desktop and mobile layouts have no clipping or horizontal overflow.
8. Light and dark modes preserve hierarchy and contrast.
9. Reader mode still hides its established chrome.
10. Keyboard navigation exposes focus and active state throughout.
11. Home-to-docs and docs-to-docs view transitions still work.
12. `/design`, graph, canvas, Base, and other specialized pages retain their current behavior.
13. `pnpm vitest run`, `pnpm types:check`, and `pnpm lint` pass without new failures.

## Acceptance statement

The first pass succeeds when a reader can identify the knowledge base from its black threshold, Arabic identity, spacious typographic field, and gold navigation line before noticing any individual component styling—and can still read for a long time without the theme competing with the text.
