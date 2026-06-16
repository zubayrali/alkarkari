# Navigation progress bar synced to view transitions, built on Next's client instrumentation hook

All pages are `force-dynamic` (ADR-0001's cookie check), so every navigation pays a server
round-trip *before* the ADR-0007 crossfade can play. That gap reads as jank: click, dead
time, then a sudden crossfade. A top-of-viewport progress bar fills the gap and hands off
to the crossfade as one continuous motion.

No dependency was added. Fumadocs ships no progress primitive and ADR-0007 already chose
native mechanisms over third-party wrappers (`next-nprogress` and friends poll or patch
`history`). The bar is ~100 lines of component styled with the existing design tokens
(`bg-fd-primary`) in `components/nav-progress.tsx`, mounted once in `app/layout.tsx` so it
covers home↔docs, docs↔docs, graph, canvas, and tag-page navigations alike.

**Start signal** — `instrumentation-client.ts` exports `onRouterTransitionStart`, Next's
client instrumentation hook that fires the instant any App Router navigation begins
(links, the search dialog, graph-node clicks, programmatic `router.push`). It broadcasts a
`vaultpress:nav-start` CustomEvent on `window`; the component listens. This is the only
global navigation-start signal in the App Router — no per-link wiring, nothing misses.
Note: the hook is wired at server startup, so creating/renaming this file requires a dev
server restart.

**Completion = synchronization** — the component completes the bar in a `useEffect` on
`usePathname()`. The pathname updates in the same React commit that triggers
`document.startViewTransition()`, so the bar snaps to 100% exactly as the crossfade
begins, then fades out (300ms) while the crossfade plays. The bar carries its own
`view-transition-name: nav-progress` with the same animation-suppression CSS as
`site-sidebar` (`app/global.css`), keeping it live rather than double-ghosted in the
old/new snapshots.

**Behavior details** — a 120ms show-delay keeps fast navigations bar-free (no flash);
progress trickles asymptotically toward 85% while waiting on the server; navigations to
the current pathname (hash/TOC clicks, same-page links) are ignored since nothing would
ever complete them; an 8s safety timeout force-completes anything that slips through.
Reduced-motion users keep the bar (it is a loading indicator, not decoration) minus the
width/opacity easing (`motion-reduce:transition-none`), and the global reduced-motion
view-transition override from ADR-0007 already covers the crossfade side.
