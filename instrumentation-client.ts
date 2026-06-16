export const NAV_START_EVENT = "vaultpress:nav-start";

/**
 * Next.js client instrumentation hook: fires the moment any App Router
 * navigation starts (links, search dialog, graph clicks, router.push).
 * Broadcast it so `components/nav-progress.tsx` can start the progress bar
 * before the server round-trip begins.
 */
export function onRouterTransitionStart(url: string) {
  window.dispatchEvent(new CustomEvent(NAV_START_EVENT, { detail: { url } }));
}
