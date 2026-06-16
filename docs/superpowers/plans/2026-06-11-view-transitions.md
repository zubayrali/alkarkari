# View Transitions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Site-wide crossfade between page navigations via Next.js 16's `experimental.viewTransition` + React's `<ViewTransition>`, with the `DocsLayout` sidebar anchored (no flicker) and `prefers-reduced-motion` respected.

**Spec:** [docs/superpowers/specs/2026-06-11-view-transitions-design.md](../specs/2026-06-11-view-transitions-design.md)

**Tech Stack:** Next.js 16.2.7 App Router, React 19.2.7 (Next vendors `react-builtin` w/ `ViewTransition` for `app/`), Fumadocs UI 16.9.3

---

## File map

| File | Action | Responsibility |
|---|---|---|
| `next.config.mjs` | Modify | Enable `experimental.viewTransition` |
| `types/react-view-transition.d.ts` | Create | Ambient type for `ViewTransition` (gap in `@types/react@19.2.x`) |
| `app/global.css` | Modify | Reduced-motion override + sidebar anchor CSS |
| `app/(docs)/[...slug]/layout.tsx` | Modify | Anchor sidebar with `viewTransitionName` |
| `app/(docs)/[...slug]/page.tsx` | Modify | Wrap page content in `<ViewTransition>` |
| `docs/adr/0007-view-transitions.md` | Create | ADR documenting the decision |

---

### Task 1: Enable the experimental flag

**Files:**
- Modify: `next.config.mjs`

- [ ] **Step 1: Add `experimental.viewTransition`**

```js
// next.config.mjs
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  serverExternalPackages: ['@takumi-rs/image-response'],
  reactStrictMode: true,
  experimental: {
    viewTransition: true,
  },
};

export default withMDX(config);
```

- [ ] **Step 2: Commit**

```bash
git add next.config.mjs
git commit -m "feat: enable experimental view transitions"
```

---

### Task 2: Add `ViewTransition` type shim

**Files:**
- Create: `types/react-view-transition.d.ts`

- [ ] **Step 1: Create the ambient module declaration**

```ts
// types/react-view-transition.d.ts
//
// `react@19.2.x` (the version pinned in package.json / @types/react) does not
// yet export `ViewTransition`. Next.js aliases `react` inside `app/` to its
// vendored `react-builtin`, which DOES export it at runtime — this shim only
// fixes type-checking. Delete once @types/react ships real types for it
// (a duplicate declaration will then error, surfacing the cleanup point).
import 'react';

declare module 'react' {
  type ViewTransitionClass = 'none' | 'auto' | (string & {});
  type ViewTransitionClassPerType =
    | ViewTransitionClass
    | Record<string, ViewTransitionClass>;

  export const ViewTransition: React.ComponentType<{
    name?: string;
    share?: ViewTransitionClassPerType;
    enter?: ViewTransitionClassPerType;
    exit?: ViewTransitionClassPerType;
    update?: ViewTransitionClassPerType;
    layout?: ViewTransitionClassPerType;
    default?: ViewTransitionClassPerType;
    children?: React.ReactNode;
  }>;
}
```

- [ ] **Step 2: Verify types**

```bash
pnpm types:check
```

Expected: no errors related to `ViewTransition`. (If `.source/server.ts` comes back empty/non-module, `rm -rf .source` and re-run — known flaky codegen cache issue, unrelated to this change.)

- [ ] **Step 3: Commit**

```bash
git add types/react-view-transition.d.ts
git commit -m "chore: add type shim for React ViewTransition"
```

---

### Task 3: Global CSS — reduced motion + sidebar anchor

**Files:**
- Modify: `app/global.css`

- [ ] **Step 1: Append view-transition rules**

```css
/* View Transitions: respect reduced-motion preference */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
  }
}

/* View Transitions: keep the persistent docs sidebar static during
   docs-to-docs navigation (only `docs-content` should crossfade) */
::view-transition-group(site-sidebar),
::view-transition-old(site-sidebar),
::view-transition-new(site-sidebar) {
  animation: none;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/global.css
git commit -m "feat: add view-transition CSS for reduced motion and sidebar anchoring"
```

---

### Task 4: Anchor the `DocsLayout` sidebar

**Files:**
- Modify: `app/(docs)/[...slug]/layout.tsx`

- [ ] **Step 1: Pass `viewTransitionName` via `sidebar.style`**

```tsx
import type { ReactNode } from 'react';
import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';

export const dynamic = 'force-dynamic';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      {...baseOptions()}
      sidebar={{ style: { viewTransitionName: 'site-sidebar' } as React.CSSProperties }}
    >
      {children}
    </DocsLayout>
  );
}
```

`viewTransitionName` is a valid CSS property but may need an `as React.CSSProperties` cast if `@types/react`'s `CSSProperties` doesn't yet include it — check during Step 2 and remove the cast if unnecessary.

- [ ] **Step 2: Verify types**

```bash
pnpm types:check
```

- [ ] **Step 3: Commit**

```bash
git add "app/(docs)/[...slug]/layout.tsx"
git commit -m "feat: anchor docs sidebar for view transitions"
```

---

### Task 5: Wrap docs page content in `ViewTransition`

**Files:**
- Modify: `app/(docs)/[...slug]/page.tsx`

- [ ] **Step 1: Import `ViewTransition` and wrap the `DocsPage` children**

Add to imports:

```tsx
import { ViewTransition } from 'react';
```

Wrap everything currently inside `<DocsPage>` (the `DocsTitle`, `DocsDescription`, `PageTags`, actions bar, and `DocsBody`) in:

```tsx
<ViewTransition name="docs-content" share="auto" enter="auto" default="none">
  {/* existing <DocsTitle>...</DocsBody> content */}
</ViewTransition>
```

The `<DocsPage>` element itself (and its `toc`/`footer` props) stays outside the wrapper — only the page-specific content area crossfades.

- [ ] **Step 2: Verify types and lint**

```bash
pnpm types:check && pnpm lint
```

- [ ] **Step 3: Manual verification**

```bash
pnpm dev
```

Using the `run` skill / browser, check:
- Click between sidebar links on docs pages → content crossfades smoothly, sidebar stays static (no flicker/slide)
- Navigate `/` → a docs page and back → full-page crossfade (expected; HomeLayout/DocsLayout are different layout trees per ADR-0006)
- Use search → navigate to a result → crossfade still applies
- DevTools → emulate `prefers-reduced-motion: reduce` → navigation is instant, no animation
- Visit a graph page, a canvas page, and a Base table/gallery page → note whether the crossfade produces a jarring "frozen frame" on canvas/WebGL content (see spec's "Known caveat" section). If so, do **not** fix ad-hoc here — flag it as a follow-up needing its own `page.data` flag (ADR-0005 pattern), out of scope for this plan.
- Resize to mobile viewport → `DocsLayout`'s mobile header doesn't double-render or flicker

- [ ] **Step 4: Commit**

```bash
git add "app/(docs)/[...slug]/page.tsx"
git commit -m "feat: crossfade docs page content with View Transitions"
```

---

### Task 6: Document the decision

**Files:**
- Create: `docs/adr/0007-view-transitions.md`

- [ ] **Step 1: Write the ADR**

Summarize (see spec for full detail):
- Decision: enable `experimental.viewTransition`, crossfade `docs-content` via `<ViewTransition name="docs-content" share="auto" enter="auto" default="none">`, anchor the `DocsLayout` sidebar via `viewTransitionName: 'site-sidebar'`.
- Why: Fumadocs has no built-in support; this is the native, dependency-free Next 16 path, consistent with ADR-0006's "bare, out of the box" direction.
- The `@types/react` gap and the `types/react-view-transition.d.ts` shim — note it should be deleted once `@types/react` adds real types.
- Experimental status + rollback path (single config flag).
- Deferred follow-ups: directional footer prev/next, shared-element morphs, theme-toggle reveal, possible canvas/graph `default="none"` exemption if testing in Task 5 found it necessary.

- [ ] **Step 2: Update CLAUDE.md**

Add a one-line pointer under "Page chrome" or a new "View transitions" subsection in `CLAUDE.md`'s "Key files by area", referencing ADR-0007, `app/global.css` anchor names (`site-sidebar`, `docs-content`), and the type shim location.

- [ ] **Step 3: Commit**

```bash
git add docs/adr/0007-view-transitions.md CLAUDE.md
git commit -m "docs: record view transitions decision (ADR-0007)"
```
