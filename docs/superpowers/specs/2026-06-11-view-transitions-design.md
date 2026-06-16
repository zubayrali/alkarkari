# View Transitions Design — Karkari Wiki

**Date:** 2026-06-11
**Status:** Approved

## Goal

Add smooth, site-wide crossfade transitions between page navigations using Next.js 16's native View Transitions integration (`experimental.viewTransition` + React's `<ViewTransition>`), without disrupting the persistent `DocsLayout` sidebar (sticky, restored in [ADR-0006](../../adr/0006-layout-route-groups.md)).

## Background research

- **Fumadocs**: no built-in support. Zero mentions of "view transition" in `fumadocs-ui`/`fumadocs-core` docs or source.
- **Next.js 16.2.7** (installed version) ships `experimental.viewTransition` — enables React's `<ViewTransition>` component and wraps App Router navigations in `document.startViewTransition()`. Marked experimental / "not recommended for production" by Next, but it's the native, dependency-free path and matches the project's "bare, out of the box" direction (ADR-0006).
- **`next-view-transitions`** (community library, raw `document.startViewTransition` + `next/navigation` wrapping): not needed — superseded by the native integration on Next 16.

### Type-checking gap

`react@19.2.7` (installed, stable channel) does not export `ViewTransition` — it's only present in Next's internally vendored `react-builtin` (`node_modules/next/dist/compiled/react`), which Next's bundler aliases `react` to for the `app/` directory at build/runtime. So:

- **Runtime**: `import { ViewTransition } from 'react'` resolves correctly via Next's aliasing.
- **`tsc --noEmit`** (part of `pnpm types:check`): resolves `react` to `node_modules/@types/react@19.2.17`, which has no `ViewTransition` type yet → compile error without a fix.

**Fix**: add an ambient module augmentation (`types/react-view-transition.d.ts`) declaring `ViewTransition`'s prop shape (`name`, `share`, `enter`, `exit`, `update`, `default`, `children`) on `'react'`. This is a stopgap until `@types/react` catches up — safe to delete once it does (TS will then use the real types and a duplicate declaration would error, surfacing the cleanup point).

`next/link`'s `transitionTypes` prop is already typed in this Next version — no shim needed there.

## Architecture

### 1. Enable the feature flag

`next.config.mjs` → `experimental: { viewTransition: true }`. Single flag, fully reversible — removing it makes all `<ViewTransition>` markers and view-transition CSS inert (per Next docs, without the flag navigations aren't wrapped in `startViewTransition`).

### 2. Docs content crossfade

`app/(docs)/[...slug]/page.tsx` wraps the `<DocsPage>` children (title, description, tags, actions bar, `DocsBody`) in:

```tsx
<ViewTransition name="docs-content" share="auto" enter="auto" default="none">
  {/* existing children */}
</ViewTransition>
```

`name="docs-content"` gives the content area a stable identity across navigations so React/the browser crossfades old → new content. `default="none"` ensures no animation on the very first render (only subsequent navigations transition).

### 3. Anchor the persistent sidebar

Without anchoring, the View Transitions API's default behavior crossfades the **entire viewport snapshot**, including the `DocsLayout` sidebar — which would flicker on every docs-to-docs navigation despite being a persistent layout element (the sticky sidebar restored in ADR-0006).

`app/(docs)/[...slug]/layout.tsx` gives the sidebar a stable `viewTransitionName`:

```tsx
<DocsLayout
  tree={source.getPageTree()}
  {...baseOptions()}
  sidebar={{ style: { viewTransitionName: 'site-sidebar' } }}
>
```

`app/global.css` then suppresses animation for that name:

```css
::view-transition-group(site-sidebar),
::view-transition-old(site-sidebar),
::view-transition-new(site-sidebar) {
  animation: none;
}
```

### 4. Reduced motion

`app/global.css` adds the standard accessibility override:

```css
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
  }
}
```

This is required, not optional, for a production-ready implementation — directional/crossfade motion is a common motion-sensitivity trigger.

### 5. Home page (`/`)

No changes. `/` (`HomeLayout`) and docs pages (`DocsLayout`) are sibling route groups with entirely different chrome (ADR-0006) — there's no persistent element to anchor between them, so the default full-page crossfade on home ↔ docs navigation is correct and desired as-is.

## Out of scope (deferred follow-ups)

These are valuable but each needs its own design pass — bundling them into v1 would blow up scope and risk on top of an already-experimental API:

- **Directional (forward/back) slides for the prev/next footer** — fumadocs' `Footer` component doesn't expose a `transitionTypes` hook on its internal `<Link>`s; needs a custom footer slot (`slots.footer` / replacing `DocsPage`'s `footer`).
- **Shared-element morphs** — e.g. home page section cards / dictionary strip → their target pages, graph nodes → note pages. Requires coordinating matching `<ViewTransition name="...">` identifiers across many independent components (home page, dictionary index, graph view).
- **Theme-toggle circular reveal** — a different pattern entirely (manual `document.startViewTransition()` on click), independent of `experimental.viewTransition`.

## Known caveat: canvas / graph / base table pages

`(docs)/[...slug]` also serves canvas pages (React Flow), the graph view (React Force Graph / canvas), and Base table/gallery views — all wrapped in the same `docs-content` `<ViewTransition>` for v1 consistency. Canvas/WebGL surfaces are captured as a static image for the transition snapshot, which can produce a brief "frozen frame" feel on these pages.

**Verification step**: check these page types during testing. If the freeze is jarring, the fix follows the same pattern as ADR-0005's `base: true` flag — add a frontmatter/page-data flag for the affected page kind and pass `default="none"` (no transition) for those pages specifically. Not pre-emptively implemented — only added if testing shows it's needed.

## Risk & rollback

- `experimental.viewTransition` is marked "not recommended for production" upstream. We're accepting this because: (a) it degrades gracefully — without browser support or with the flag removed, navigation works exactly as before, just without the crossfade; (b) the blast radius is two files (`next.config.mjs`, `app/global.css`) plus the wrapper in `page.tsx` and the sidebar's `style` prop — all easily revertible.
- Rollback: set `experimental.viewTransition` to `false` (or remove it). No other code needs to change — `<ViewTransition>` and the `viewTransitionName` style become inert no-ops.

## Verification plan

- `pnpm types:check && pnpm lint`
- `pnpm dev`, manual check (browser):
  - Sidebar navigation between docs pages → content crossfades, sidebar does not flicker/slide
  - Home (`/`) ↔ docs page → full crossfade (expected, unanchored)
  - Search-triggered navigation
  - `prefers-reduced-motion: reduce` (DevTools emulation) → instant swap, no animation
  - Graph view, canvas pages, base table/gallery pages → check for snapshot-freeze artifacts (see caveat above)
  - Mobile viewport → `DocsLayout`'s mobile-only header doesn't double-render or flicker
