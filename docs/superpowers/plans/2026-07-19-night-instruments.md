# Night Instruments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the Night Threshold ledger idiom to the graph view, review cards, code blocks, and canvas/Excalidraw viewer chrome — visual conversion only, zero behavior change.

**Architecture:** CSS-first restyle. Two new focused stylesheets (`app/graph-ledger.css`, `app/code-ledger.css`) imported from `global.css`; `app/review.css`, `app/excalidraw.css`, `app/canvas-flow.css` edited in place. Component edits are class hooks and two palette-source changes in the graph renderer.

**Tech Stack:** Next.js 16 static export, Fumadocs, Tailwind v4, react-force-graph-2d, @xyflow/react. Spec: `docs/superpowers/specs/2026-07-19-night-instruments-design.md`.

## Global Constraints

- **NEVER `git add -A` / `git add .`** — the tree carries unrelated uncommitted WIP (homepage, keystatic). Stage only the exact paths each task's commit step lists.
- **No behavior changes.** Graph interactions, review grading/keyboard/localStorage, copy button, canvas/excalidraw pan-zoom, reduced-motion policies all stay byte-identical in logic. Do not touch `lib/build-graph.ts`, `lib/graph-utils.ts`, `lib/spaced-repetition.ts`, `lib/review-store.ts`, or any parsing/rendering logic.
- **Tokens:** existing `--color-fd-*`, `--kk-*`, `--rv-*` only. The only NEW custom properties allowed are `--graph-tag-color` (aliases `--kk-patch-6` / `--kk-ray-6`) and the `--rv-lost` definitions (aliasing `--kk-patch-1` / `--kk-ray-1`). No new palette values.
- **Ledger idiom:** hairline = `1px solid var(--color-fd-border)`; mono label stack = `var(--font-mono-plex), ui-monospace, SFMono-Regular, monospace`, uppercase, tracked; `border-radius: 0`; no box-shadows; no new animation.
- **String localization is out of scope** — change no user-facing copy.
- **Gates after every task:** `pnpm types:check && pnpm lint && pnpm vitest run`. Known race: if `types:check` fails with "`.source/server.ts` is not a module" or implicit-any errors in unrelated files, run `npx fumadocs-mdx` and retry — it is a codegen truncation race, not your change.
- If `content/` is empty (fresh checkout), run `pnpm run stage en` first (must be `pnpm run stage`, not `pnpm stage`).

## File Structure

| File | Role |
|---|---|
| `app/graph-ledger.css` (new) | Graph frame, controls, depth select, tooltip, legend, `--graph-tag-color` |
| `app/code-ledger.css` (new) | Code block frame/title/copy button, inline-code de-pill |
| `app/review.css` (edit) | Flat-ledger conversion of the review widget |
| `app/excalidraw.css` (edit) | Control buttons: current tokens, square |
| `app/canvas-flow.css` (edit) | Canvas zoom controls: square hairline |
| `app/global.css` (edit) | Two new `@import` lines |
| `components/graph-view.tsx` (edit) | Class hooks; tag-color + mono-font palette sources |
| `components/local-graph.tsx` (edit) | Depth select class hook |
| `components/graph-page.tsx` (edit) | Legend class hook + square swatches |
| `components/canvas-view.tsx` (edit) | De-round empty state + hint chip |
| `components/canvas-flow-nodes.tsx` (edit) | Flatten node card class |
| `CLAUDE.md`, spec (edit) | Docs + status flip |

---

### Task 1: Graph ledger

**Files:**
- Create: `app/graph-ledger.css`
- Modify: `app/global.css` (import block, lines 1–17)
- Modify: `components/graph-view.tsx`
- Modify: `components/local-graph.tsx`
- Modify: `components/graph-page.tsx`

**Interfaces:**
- Consumes: existing tokens from `app/karkari-theme.css` (`--kk-patch-6`, `--kk-ray-6`, `--font-mono-plex`) and fd tokens.
- Produces: CSS classes `.graph-frame`, `.graph-btn`, `.graph-select`, `.graph-tooltip`, `.graph-legend`; custom property `--graph-tag-color`. Task 3 adds its import next to this one.

- [ ] **Step 1: Create `app/graph-ledger.css`** with exactly:

```css
/* Graph view chrome as a ledger instrument — the Night Instruments pass.
   Frame, controls, legend, and palette sources only; the force-graph
   canvas rendering (node sizing, fades, visited tint) is untouched.
   components/graph-view.tsx reads --graph-tag-color and --font-mono at
   runtime via getComputedStyle. */

:root {
  /* Tag nodes: muraqqaʿa spectrum, luminous variant on the ink ground. */
  --graph-tag-color: var(--kk-patch-6);
}

.dark {
  --graph-tag-color: var(--kk-ray-6);
}

.graph-frame {
  border: 1px solid var(--color-fd-border);
  background: var(--color-fd-background);
}

.graph-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.375rem;
  border: 1px solid var(--color-fd-border);
  background: color-mix(in srgb, var(--color-fd-background) 80%, transparent);
  backdrop-filter: blur(8px);
  color: var(--color-fd-muted-foreground);
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}

.graph-btn:hover {
  color: var(--color-fd-foreground);
  background: color-mix(in srgb, var(--color-fd-foreground) 4%, var(--color-fd-background));
}

.graph-btn:focus-visible,
.graph-select:focus-visible {
  outline: 2px solid var(--color-fd-ring);
  outline-offset: 1px;
}

.graph-select {
  border: 1px solid var(--color-fd-border);
  border-radius: 0;
  background: color-mix(in srgb, var(--color-fd-background) 80%, transparent);
  backdrop-filter: blur(8px);
  padding: 0.25rem 0.375rem;
  font-family: var(--font-mono-plex), ui-monospace, SFMono-Regular, monospace;
  font-size: 0.6875rem;
  color: var(--color-fd-muted-foreground);
}

.graph-tooltip {
  border: 1px solid var(--color-fd-border);
  background: var(--color-fd-popover);
  color: var(--color-fd-popover-foreground);
}

.graph-legend {
  font-family: var(--font-mono-plex), ui-monospace, SFMono-Regular, monospace;
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
```

- [ ] **Step 2: Import it in `app/global.css`.** After the line `@import "./base-ledger.css";` add:

```css
@import "./graph-ledger.css";
```

- [ ] **Step 3: Palette sources in `components/graph-view.tsx`.** Three edits:

(a) Extend `ThemeColors` (currently lines 125–132) and `readThemeColors` (lines 134–151):

```ts
interface ThemeColors {
  current: Rgb;
  visited: Rgb;
  page: Rgb;
  tag: Rgb;
  label: Rgb;
  link: Rgb;
  /** Resolved font-family list for canvas labels (mono ledger face). */
  font: string;
}

function readThemeColors(container: HTMLElement): ThemeColors {
  const style = getComputedStyle(container);
  const token = (name: string) => style.getPropertyValue(name);
  const primary = resolveColor(token('--color-fd-primary'));
  const muted = resolveColor(token('--color-fd-muted-foreground'));
  return {
    current: primary,
    visited: [
      Math.round((primary[0] + muted[0]) / 2),
      Math.round((primary[1] + muted[1]) / 2),
      Math.round((primary[2] + muted[2]) / 2),
    ],
    page: muted,
    tag: resolveColor(token('--graph-tag-color') || 'teal'),
    label: resolveColor(token('--color-fd-foreground')),
    link: muted,
    font: token('--font-mono').trim() || 'monospace',
  };
}
```

(b) Label font (currently line 526): replace

```ts
      ctx.font = `${fontSize}px sans-serif`;
```

with

```ts
      ctx.font = `${fontSize}px ${colors.font}`;
```

(c) Chrome class hooks. Container (currently line 213):

```tsx
      className={`not-prose group relative w-full max-w-full overflow-hidden graph-frame ${
        className ?? 'h-[min(600px,70vh)]'
      }`}
```

Both control buttons (currently lines 232 and 240) — replace the full className string on each with:

```tsx
          className="graph-btn"
```

Tooltip (currently line 604):

```tsx
        className="graph-tooltip pointer-events-none absolute z-10 max-w-xs p-2 text-sm"
```

Keep the tooltip's inner `<div className="font-medium" />` / `<div className="mt-0.5 text-xs text-fd-muted-foreground" />` children untouched (`applyHover` addresses them positionally via `firstElementChild`/`lastElementChild`).

- [ ] **Step 4: Depth select in `components/local-graph.tsx`** (currently line 42). Replace the `<select>` className with:

```tsx
          className="graph-select text-xs"
```

- [ ] **Step 5: Legend in `components/graph-page.tsx`.** Replace the legend/stats wrapper and swatches (currently lines 14–38) with:

```tsx
      <div className="not-prose graph-legend flex flex-wrap items-center justify-between gap-2 text-fd-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="inline-block size-2.5"
              style={{ backgroundColor: 'var(--color-fd-muted-foreground)' }}
            />
            {siteLanguage.graphLegendPage}
          </span>
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="inline-block size-2.5"
              style={{ backgroundColor: 'var(--graph-tag-color)' }}
            />
            {siteLanguage.graphLegendTag}
          </span>
        </div>
        <span>
          {pageCount} {siteLanguage.graphStatPages} · {tagCount}{" "}
          {siteLanguage.graphStatTags} · {graph.links.length}{" "}
          {siteLanguage.graphStatLinks}
        </span>
      </div>
```

(Changes: `graph-legend` class added, `text-sm` dropped, `rounded-full` dropped from both swatches, tag swatch color `var(--color-teal-500)` → `var(--graph-tag-color)`.)

- [ ] **Step 6: Gates**

Run: `pnpm types:check && pnpm lint && pnpm vitest run`
Expected: all pass (48 tests). On the `.source` race, `npx fumadocs-mdx` and retry.

- [ ] **Step 7: Visual smoke check (headless).** With `pnpm dev` running:

```bash
/Applications/Helium.app/Contents/MacOS/Helium --headless --disable-gpu \
  --user-data-dir=$(mktemp -d) --window-size=1440,900 \
  --screenshot=/tmp/graph-light.png http://localhost:3000/graph
```

Confirm: square frame, mono legend, square swatches, tag nodes no longer teal (greenish patch-6 hue is correct in light mode).

- [ ] **Step 8: Commit**

```bash
git add app/graph-ledger.css app/global.css components/graph-view.tsx components/local-graph.tsx components/graph-page.tsx
git commit -m "feat: graph view chrome as night ledger instrument"
```

---

### Task 2: Review cards — flat ledger

**Files:**
- Modify: `app/review.css` only. Do NOT touch `components/review-block.tsx` — every change is reachable from CSS.

**Interfaces:**
- Consumes: `--kk-patch-1`, `--kk-ray-1`, `--kk-gold-ink`, `--font-mono-plex` from `karkari-theme.css`; existing `.rv-*` DOM class contract.
- Produces: nothing used by other tasks.

All edits below are exact old→new replacements against the current file. Apply in order (later line numbers shift; match on content).

- [ ] **Step 1: Header + `--rv-lost` routing.** Replace the file's opening comment (lines 1–4):

```css
/* Orbit-style spaced-repetition review widget — flat ledger idiom
   (Night Instruments pass): square corners, hairline frames, mono
   labels, no shadows. Card-stack + marquee-cover + timeline BEHAVIOR
   is unchanged. Per-block color theming via --rv-color-* custom
   properties; the loss-preview color routes to the muraqqaʿa spectrum
   here (usages keep their #c2410c fallback). */

:root {
  --rv-lost: var(--kk-patch-1);
}

.dark {
  --rv-lost: var(--kk-ray-1);
}
```

- [ ] **Step 2: Container.** Replace `.rv-block` (lines 8–14):

```css
.rv-block {
  margin: 2.5rem auto;
  max-width: 640px;
  border: 1px solid var(--color-fd-border);
  border-top: 2px solid var(--rv-color-accent, var(--kk-gold-ink));
  background: color-mix(in oklab, var(--rv-color-accent, var(--color-fd-primary)) 3%, var(--color-fd-background));
  overflow: hidden;
}
```

- [ ] **Step 3: Themed tint down.** In `.rv-themed` (lines 22–24), change `8%` to `4%`:

```css
.rv-themed {
  background: color-mix(in oklab, var(--rv-color-accent) 4%, var(--color-fd-background));
}
```

- [ ] **Step 4: Delete the filled-button theming.** Remove these two blocks entirely (grade buttons become outline utilities in Step 8; the accent stays on the top rule, ladder, and marquee):

```css
.rv-themed .rv-btn {
  background: var(--rv-color-accent);
  color: var(--rv-color-accent-fg);
}
```

and (in the `.dark` section, currently lines 196–204):

```css
.dark .rv-btn {
  background: var(--color-fd-primary);
  color: var(--color-fd-primary-foreground);
}

.dark .rv-themed .rv-btn {
  background: var(--rv-color-accent);
  color: var(--rv-color-accent-fg);
}
```

- [ ] **Step 5: Cards.** Replace `.rv-card` (lines 175–182) and delete the now-redundant `.dark .rv-card` block (lines 192–194):

```css
.rv-card {
  border: 1px solid var(--color-fd-border);
  background: var(--color-fd-card);
  overflow: hidden;
}
```

(Deleted: `border-radius: 1rem` and the two-layer `box-shadow`. The `.dark .rv-block` and `.dark .rv-themed` background rules stay.)

- [ ] **Step 6: Attachments + cover.** In `.rv-attachment img` (lines 230–235) replace `border-radius: 0.5rem;` with:

```css
  border: 1px solid var(--color-fd-border);
```

In `.rv-cover` (line 429) change `border-radius: 0 0 1rem 1rem;` to `border-radius: 0;`.

- [ ] **Step 7: Ladder labels go mono.** Replace `.rv-tl-label` (lines 316–322):

```css
.rv-tl-label {
  font-size: 0.625rem;
  font-weight: 500;
  font-family: var(--font-mono-plex), ui-monospace, SFMono-Regular, monospace;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-fd-muted-foreground);
  white-space: nowrap;
  transition: color 0.2s;
}
```

- [ ] **Step 8: Grade buttons become mono utility controls.** Replace the `.rv-btn` block (lines 478–494), the hover block (502–505), and the active block (516–519):

```css
.rv-btn {
  flex: 0 1 13rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  border: 1px solid var(--color-fd-border);
  border-radius: 0;
  padding: 0.65rem 1rem;
  font-family: var(--font-mono-plex), ui-monospace, SFMono-Regular, monospace;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  background: transparent;
  color: var(--color-fd-muted-foreground);
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  touch-action: manipulation;
}
```

```css
.rv-btn:hover:not(.disabled) {
  background: color-mix(in srgb, currentColor 8%, transparent);
  color: var(--color-fd-foreground);
}
```

```css
.rv-btn:active:not(.disabled) {
  background: color-mix(in srgb, currentColor 14%, transparent);
}
```

Then, directly after the `.rv-btn:active` block, add the gold-ink primary action:

```css
/* The affirmative action carries the gold position mark (AA per mode). */
.rv-remembered:not(.disabled) {
  border-color: var(--kk-gold-ink);
  color: var(--kk-gold-ink);
}

.rv-remembered:hover:not(.disabled) {
  color: var(--kk-gold-ink);
}
```

Keep untouched: `.rv-btn svg` sizing, the `.rv-forgot`/`.rv-remembered` icon micro-interactions, `.rv-btn.disabled`, `.rv-skip-link`.

- [ ] **Step 9: Restart button + idle chip.** Replace `.rv-restart` (lines 613–624):

```css
.rv-restart {
  cursor: pointer;
  border: 1px solid var(--color-fd-border);
  border-radius: 0;
  padding: 0.375rem 0.75rem;
  font-family: var(--font-mono-plex), ui-monospace, SFMono-Regular, monospace;
  font-size: 0.6875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  background: transparent;
  color: var(--color-fd-muted-foreground);
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
}
```

Replace `.rv-idle-chip` (lines 571–577):

```css
.rv-idle-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-family: var(--font-mono-plex), ui-monospace, SFMono-Regular, monospace;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-fd-foreground);
}
```

- [ ] **Step 10: Mobile.** In the `@media (max-width: 480px)` block: delete the `border-radius: 0.75rem;` line from `.rv-block` (line 637), and in the mobile `.rv-btn` block (lines 685–689) change `font-size: 0.8125rem;` to `font-size: 0.6875rem;`.

- [ ] **Step 11: Gates**

Run: `pnpm types:check && pnpm lint && pnpm vitest run`
Expected: all pass.

- [ ] **Step 12: Visual smoke check.** `pnpm dev` + Helium screenshot of `http://localhost:3000/articles/style-test` (has orbit blocks). Confirm: square cards with hairline frames, no shadows, accent top rule on the block, mono ladder labels, outline grade buttons with gold-ink "remembered", themed blocks still show their palette on rule/ladder/marquee.

- [ ] **Step 13: Commit**

```bash
git add app/review.css
git commit -m "feat: review cards as flat night ledger"
```

---

### Task 3: Code ledger

**Files:**
- Create: `app/code-ledger.css`
- Modify: `app/global.css` (import block)

**Interfaces:**
- Consumes: fumadocs-ui CodeBlock DOM (documented in the file header below) and the typography plugin's inline-code rule (`.prose :where(code)…` — zero-specificity `:where`, so any compound selector out-specifies it).
- Produces: nothing used by other tasks.

- [ ] **Step 1: Create `app/code-ledger.css`** with exactly:

```css
/* Code blocks as ledger panels — the Night Instruments pass.
   Frame + labels only; shiki syntax colors stay fumadocs' defaults in
   both modes (theme-following, per the spec decision).

   Selector contract (stable-DOM dependency, same rule as nd-page/nd-toc):
   fumadocs-ui's CodeBlock (dist/components/codeblock.js) renders
     figure.shiki
       > div (title bar, contains > figcaption)   — only when titled
       > div[class*="backdrop-blur"] > button     — floating copy button
       > div > pre                                — the code area
   Re-verify these shapes when upgrading fumadocs-ui. */

#nd-page figure.shiki {
  border-radius: 0;
  border: 1px solid var(--color-fd-border);
  box-shadow: none;
}

/* Title bar: mono uppercase label on its hairline rule — the same idiom
   as ledger column heads. */
#nd-page figure.shiki > div:has(> figcaption) {
  font-family: var(--font-mono-plex), ui-monospace, SFMono-Regular, monospace;
  font-size: 0.6875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-bottom: 1px solid var(--color-fd-border);
}

/* Copy button and its floating wrapper: square, quiet. */
#nd-page figure.shiki button,
#nd-page figure.shiki div[class*="backdrop-blur"] {
  border-radius: 0;
}

/* Inline code: de-pilled — faint ink tint, no border, no radius.
   `:not(pre) >` keeps block code untouched; the compound selector
   out-specifies the typography plugin's `.prose :where(code)` rule. */
.prose :not(pre) > code {
  border: none;
  border-radius: 0;
  background: color-mix(in srgb, var(--color-fd-foreground) 6%, transparent);
  padding: 0.15em 0.4em;
}
```

- [ ] **Step 2: Import it in `app/global.css`.** After the line `@import "./graph-ledger.css";` (added in Task 1) add:

```css
@import "./code-ledger.css";
```

- [ ] **Step 3: Gates**

Run: `pnpm types:check && pnpm lint && pnpm vitest run`
Expected: all pass.

- [ ] **Step 4: Visual smoke check.** Helium screenshot of `http://localhost:3000/articles/style-test` (has code fences and inline code). Confirm: square hairline code frames, mono uppercase title tab where present, de-pilled inline code, syntax colors unchanged, copy button still square-cornered but functional (behavior untouched — CSS only).

- [ ] **Step 5: Commit**

```bash
git add app/code-ledger.css app/global.css
git commit -m "feat: code blocks as ledger panels"
```

---

### Task 4: Canvas + Excalidraw chrome

**Files:**
- Modify: `app/excalidraw.css` (lines 76–95)
- Modify: `app/canvas-flow.css` (append)
- Modify: `components/canvas-view.tsx` (lines 95, 108)
- Modify: `components/canvas-flow-nodes.tsx` (lines 95–101)

**Interfaces:**
- Consumes: `--color-fd-*` tokens; xyflow `.canvas-controls` panel class (already present).
- Produces: nothing used by other tasks.

- [ ] **Step 1: Excalidraw controls — current tokens, square.** In `app/excalidraw.css` replace the two button blocks (lines 76–95):

```css
.excalidraw-controls button {
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--color-fd-border);
  border-radius: 0;
  background: var(--color-fd-background);
  color: var(--color-fd-muted-foreground);
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.1s ease;
}

.excalidraw-controls button:hover {
  background: var(--color-fd-accent);
  color: var(--color-fd-accent-foreground);
}
```

(Changes: legacy `var(--fd-border)`/`var(--fd-background)`/`var(--fd-muted-foreground)`/`var(--fd-accent)`/`var(--fd-accent-foreground)` → `--color-fd-*`; `border-radius: 6px` → `0`. Everything else identical.)

- [ ] **Step 2: Canvas zoom controls — square hairline.** Append to `app/canvas-flow.css`:

```css
/* Viewer chrome — Night Instruments pass: square hairline zoom controls.
   Unlayered CSS wins over the Tailwind utility layer's rounded classes
   from buttonVariants. */
.canvas-controls button {
  border-radius: 0;
  border: 1px solid var(--color-fd-border);
}
```

- [ ] **Step 3: Canvas empty state + hint chip.** In `components/canvas-view.tsx`:

Line 95, replace the empty-state className with:

```tsx
      <div className="not-prose flex h-[min(480px,60vh)] items-center justify-center border bg-fd-background text-sm text-fd-muted-foreground">
```

Line 108, replace the hint-chip className with:

```tsx
      <div className="pointer-events-none absolute bottom-3 right-3 z-10 border bg-fd-background/90 px-2 py-1 text-xs text-fd-muted-foreground">
```

(Only `rounded-xl` / `rounded-md` removed.)

- [ ] **Step 4: Flatten canvas node cards.** In `components/canvas-flow-nodes.tsx` replace lines 95–101:

```tsx
const cardClass =
  'h-full w-full overflow-hidden border text-fd-card-foreground';

const groupFrameClass = cn(
  buttonVariants({ color: 'secondary' }),
  'h-full w-full !rounded-none !p-0 hover:bg-fd-secondary hover:text-fd-secondary-foreground',
);
```

(Changes: `rounded-lg` and `shadow-sm` dropped from `cardClass`; `!rounded-none` added to the group frame. The per-node Obsidian color accents via `canvasNodeStyle(node.color)` are untouched.)

- [ ] **Step 5: Gates**

Run: `pnpm types:check && pnpm lint && pnpm vitest run`
Expected: all pass.

- [ ] **Step 6: Visual smoke check.** Helium screenshot of one canvas page (find one with `ls content/canvas/ 2>/dev/null` or search the sidebar; if the staged locale has none, note that in your report) and one excalidraw page (`ls content | grep -i excalidraw` or check `public/excalidraw/`). Confirm flattened node cards with color accents intact, square controls, unchanged content rendering.

- [ ] **Step 7: Commit**

```bash
git add app/excalidraw.css app/canvas-flow.css components/canvas-view.tsx components/canvas-flow-nodes.tsx
git commit -m "feat: flatten canvas and excalidraw viewer chrome"
```

---

### Task 5: Docs + spec status

**Files:**
- Modify: `CLAUDE.md` (graph view + spaced repetition sections)
- Modify: `docs/superpowers/specs/2026-07-19-night-instruments-design.md` (status line)

- [ ] **Step 1: CLAUDE.md — graph section.** In the **Graph view** section, find the `components/graph-view.tsx` bullet and append this sentence to it (after "the fit button re-fits manually"):

```
Chrome (frame, controls, depth select, tooltip, legend) is styled by `app/graph-ledger.css` (Night Instruments pass); the renderer reads `--graph-tag-color` (muraqqaʿa patch-6/ray-6, replacing teal) and `--font-mono` at runtime via `readThemeColors`, so palette changes belong in that stylesheet, not the component.
```

- [ ] **Step 2: CLAUDE.md — review section.** In the **Spaced repetition** section, find the `app/review.css` bullet and replace its text with:

```
- `app/review.css` — flat night-ledger idiom (square corners, hairline frames, mono labels, gold-ink "remembered" action; no shadows) themed with `--fd-*` vars and per-block `--rv-color-*` overrides; `--rv-lost` routes to `--kk-patch-1`/`--kk-ray-1`. Dark mode support for themed blocks. Imported via `app/global.css`.
```

- [ ] **Step 3: CLAUDE.md — code blocks.** In the **Home page & site theme** section (or directly after the callout mention in whichever section holds `reader-shell.css` notes), add one bullet:

```
- `app/code-ledger.css` / `app/graph-ledger.css` — Night Instruments pass: code-block frames + inline-code de-pilling (selector contract on fumadocs-ui's `figure.shiki` DOM, documented in-file — re-verify on fumadocs-ui upgrades) and graph chrome.
```

- [ ] **Step 4: Spec status flip.** In `docs/superpowers/specs/2026-07-19-night-instruments-design.md` change the status line to:

```
**Status:** Implemented (2026-07-19).
```

- [ ] **Step 5: Gates**

Run: `pnpm types:check && pnpm lint && pnpm vitest run`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add CLAUDE.md docs/superpowers/specs/2026-07-19-night-instruments-design.md
git commit -m "docs: mark night instruments pass implemented"
```

---

## Post-plan verification (controller, not a task)

- Isolated-worktree build of HEAD (`git worktree add … HEAD`, `cp -Rc` node_modules, `node scripts/stage.ts && npx fumadocs-mdx && npx next typegen && npx tsc --noEmit && npx vitest run && npx next build`) to prove the commits stand alone against the dirty tree.
- Helium light-mode screenshots archived per surface. Dark mode, hover/focus states, keyboard grading, and mobile go on the human visual-QA list (headless can't capture them).
