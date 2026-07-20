# Night Instruments: Graph, Review Cards, Code Blocks, Viewer Chrome

**Date:** 2026-07-19

**Status:** Implemented (2026-07-19).

**Scope:** Third Night Threshold pass — extends the ledger language to the
remaining deferred surfaces: the graph view (global + local), the spaced-
repetition review widget, code blocks, and the canvas/Excalidraw viewer
chrome. Successor to `2026-07-19-night-ledger-base-search-design.md`
(implemented).

## Goal

The site's instruments — the graph, the review deck, code panels, and the
canvas/Excalidraw viewers — should read as part of the Night Threshold
system (hairlines, mono labels, Spectral/gold restraint) instead of stock
Fumadocs, stock Orbit, or leftover Tailwind idioms, without changing any
behavior, data flow, or content rendering.

## Approach

CSS-first restyle with light component edits (class hooks and palette-source
changes only). Rejected alternatives: extracting shared viewer-chrome
components (churns four working components for no user-visible gain), and a
token-only recolor without structural restyle (leaves the rounded cards and
shadow stacks that read as stock UI).

Two user decisions shape this pass: the graph stays **theme-following**
(ground = page background, palette re-resolved on theme flip — not a
constant-night star map), and code blocks stay **theme-following** (no dual
shiki theme; re-frame only).

## Graph view

`components/graph-view.tsx`, `components/local-graph.tsx`,
`components/graph-page.tsx`; new stylesheet `app/graph-ledger.css`.

- **Palette mechanism unchanged.** `readThemeColors()` keeps resolving CSS
  vars at runtime through the 1×1 canvas, with the existing
  MutationObserver re-resolve on theme flip. Only the *sources* change.
- **Tag nodes** drop the raw `--color-teal-500` for a new
  `--graph-tag-color` custom property defined in `graph-ledger.css`:
  light `var(--kk-patch-6)`, dark `var(--kk-ray-6)` — in the muraqqaʿa
  spectrum, dark-mode-luminous like the callout accents.
- **Current/highlight** stays `--color-fd-primary` (gold); page, visited,
  label, and link colors keep their current fd sources. Hardcoded gray
  fallbacks (`#808080`, the rgba link fallback) remain as fallbacks.
- **Canvas labels** switch from hardcoded `sans-serif` to the mono face:
  the component reads the computed `--font-mono` value from its container
  (fallback `monospace`) and uses it in the 2D-context font string.
- **Frame:** the `rounded-xl border bg-fd-background` container flattens to
  a square-cornered 1px hairline frame. Height behavior unchanged.
- **Controls** (zoom-to-fit, fullscreen) and the local graph's **depth
  `<select>`** become quiet square utility controls: hairline border, no
  radius, muted mono text, visible focus ring; the group-hover reveal
  stays.
- **Legend + stats** on the global page: mono uppercase labels with small
  square swatches (replacing round dots), swatch colors from the same
  sources the canvas uses (`--color-fd-muted-foreground`,
  `--graph-tag-color`).
- Tooltip (`bg-fd-popover shadow-lg rounded-lg`) flattens to a hairline
  chip, no shadow, no radius.
- The "Connections" section around the local graph is already ledger-styled
  (`reader-shell.css`) and is not touched.

## Review cards (flat ledger)

`app/review.css` converted in place; `components/review-block.tsx` touched
only for class hooks if CSS cannot reach a state.

- **Container** (`.rv-block`): the 1.5rem-radius tinted pill becomes a
  square hairline perimeter with a thin accent **top rule** from the
  block's `--rv-color-accent`; ground stays on fd background tokens with at
  most a faint accent tint (≤4%).
- **Cards** (`.rv-card`): square corners, 1px hairline frame, drop shadows
  removed. Deck depth (cards peeking behind the front card) conveys through
  the existing offset/scale transforms plus hairlines — no shadow stacks.
  The grading slide/advance animations are untouched.
- **Accent system preserved:** all 10 `--rv-color-*` palettes survive as
  thin rules and faint tints; no palette is removed or added.
- **Progress ladder** (`.rv-timeline`): step labels and status text go mono
  uppercase (`--font-mono-plex`, tracked); the dot/arrow geometry stays.
  The loss-preview color routes to `--kk-patch-1` (dark `--kk-ray-1`)
  instead of the hardcoded `#c2410c`, keeping it as fallback.
- **Grade buttons** (`.rv-btn`): pills become square mono utility controls;
  the primary action (remembered) keeps a gold-ink treatment with AA
  contrast; hover is an ink wash, no lift/shadow. Skip stays a text link.
- **Idle chip**: mono, hairline, square.
- **Marquee cover**, keyboard shortcuts (Space/1/2/3), grading logic,
  localStorage schedule (`orbit-review-v1`), and the reduced-motion freeze
  are untouched. Answer text stays Spectral.
- Dark mode continues through existing fd/`--rv-*` token routing.

## Code blocks (theme-following re-frame)

New `app/code-ledger.css`; no component or shiki-theme changes.

- Block frame: square corners, 1px hairline border, no shadow; ground stays
  fumadocs' theme-following code background.
- Title tab (filename/language, when present): mono uppercase, tracked,
  sitting on a hairline rule — the same label idiom as table column heads.
- Copy button: quiet mono utility control, visible focus, no pill.
- Inline code: de-pilled — faint tint (`color-mix` on fd tokens), no
  border-radius, no border.
- Selectors target fumadocs-ui's CodeBlock DOM; the exact stable class
  names are pinned at implementation time and documented beside the
  selectors (same rule as the other stable-ID dependencies).
- Syntax colors are untouched (fumadocs' light/dark shiki defaults).

## Canvas + Excalidraw chrome

Frame-only; content rendering is out of scope (dotted canvas background,
Obsidian node palette hues, hand-drawn excalidraw style, the
`--excalidraw-*` color table).

- **Excalidraw controls** (`app/excalidraw.css`): migrate the legacy
  `var(--fd-*)` names to current `--color-fd-*` tokens; buttons flatten to
  square hairline utility controls (keep the `+ − ⟲` glyphs).
- **Canvas hint pill and empty state** (`components/canvas-view.tsx`):
  de-round to hairline chips on fd tokens.
- **Canvas node cards** (`components/canvas-flow-nodes.tsx` `cardClass`):
  radius 0, hairline border, shadow removed; the per-node Obsidian color
  accents from `lib/canvas-colors` are kept as-is.
- Pan/zoom, fullbleed layout, `useLayoutEffect` ordering, and xyflow
  behavior untouched.

## Component and data boundaries

- **New:** `app/graph-ledger.css`, `app/code-ledger.css`, imported from
  `global.css` beside the other ledger sheets.
- **Edited in place:** `app/review.css`, `app/excalidraw.css`,
  `app/canvas-flow.css`.
- **Component edits limited to:** class hooks, the graph palette-source
  change (`--graph-tag-color`, mono label font), and Tailwind class swaps
  on canvas chrome. No changes to `lib/build-graph.ts`, `lib/graph-utils.ts`,
  `lib/spaced-repetition.ts`, `lib/review-store.ts`, canvas/excalidraw
  parsing or rendering logic.
- **String localization is out of scope.** This pass changes no user-facing
  copy. The review widget's hardcoded strings are noted as separate
  localization debt for a future pass.
- Existing `--color-fd-*`, night, gold, and muraqqaʿa spectrum tokens only;
  no new palette values (new custom properties may alias existing tokens,
  as `--graph-tag-color` does).

## State and failure behavior

- Graph with zero nodes, review block with all cards mastered (idle chip),
  empty canvas, and missing excalidraw JSON keep their current states,
  restyled but behaviorally identical.
- Reduced motion: no new animation is introduced; existing reduced-motion
  policies (marquee freeze, transition settling) continue to apply.
- JavaScript failure: unchanged from today — these are all client surfaces
  and degrade exactly as they do now.

## Accessibility

- Graph state (current node, visited) remains conveyed by the existing
  semantics and contrast, not color alone; controls keep visible focus on
  both grounds.
- Grade buttons keep their disabled-until-reveal semantics and AA contrast
  in both modes, including the gold-ink primary action.
- Mono uppercase labels keep AA contrast via existing tokens.
- The copy button and viewer controls remain keyboard-reachable with
  visible focus.

## Verification

1. Global `/graph` and a local "Connections" graph render with the new
   palette in light and dark; theme flip re-resolves colors live; hover
   dim, visited tint, zoom-to-fit, fullscreen, and depth re-slice behave
   identically.
2. Tag nodes show the muraqqaʿa hue (not teal) in both modes; labels render
   in mono.
3. A page with two orbit blocks: flat ledger deck, grading slide, keyboard
   shortcuts, ladder, idle chip all work; grading one block does not reset
   the other; each accent palette still renders distinctly.
4. A code block with a title and one without both show the ledger frame;
   copy button works; inline code is de-pilled; syntax colors unchanged in
   both modes.
5. A canvas page and an excalidraw page: flattened chrome, unchanged
   content rendering and pan/zoom.
6. No horizontal page scroll introduced on any of the above.
7. Headless Helium screenshots per surface, light and dark.
8. `pnpm vitest run`, `pnpm types:check`, and `pnpm lint` pass without new
   failures.

## Acceptance statement

This pass succeeds when the graph, a review deck, a code panel, and the
canvas/Excalidraw viewers each read as instruments of the same night
library — hairline frames, mono labels, restrained gold — and nothing on a
generated page still reads as stock documentation UI.
