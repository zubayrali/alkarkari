# Graph keeps react-force-graph-2d; aarnphm behaviors ported onto it; local graph in the TOC

Three candidate graph implementations were compared for the graph upgrade:
aarnphm/quartz's (858-line pixi.js + d3 script, WebGPU/WebGL), kufrCleaner's
(a vendored copy of starlight-site-graph: ~27k-line Astro/zod-coupled module
with its own pixi build), and our existing `react-force-graph-2d` component.

**Decision: keep react-force-graph-2d and port behaviors, not renderers.**
This site graphs ~70 nodes (pages + tags); WebGL renderers earn their
complexity in the thousands-of-nodes range. Canvas 2D handles this site at
60fps, the library is already installed, already d3-force underneath, and
already React-idiomatic (router, theme tokens, RSC props). Vendoring
starlight-site-graph would import a foreign 27k-line surface designed around
Astro custom elements; porting aarnphm's pixi script would add a ~450KB
dependency to render dots. What the candidates actually had over us was
*behavior*, so `components/graph-view.tsx` ports those onto the existing
renderer:

- **Degree-sized nodes** — radius `2 + sqrt(degree)` (quartz formula); the
  current page gets a ring and the primary color.
- **Zoom-faded labels** — label alpha `clamp(log2(zoom/baseline) + 1 −
  opacityScale)`; the baseline is captured after the post-settle `zoomToFit`,
  so labels appear as you zoom in instead of cluttering the overview.
- **Focus on hover** — non-neighbors and their links/labels dim (per-element
  alpha tweened exponentially each frame for the smooth Obsidian feel;
  `autoPauseRedraw` is off, which is affordable at this node count).
- **Visited tint** — clicked/visited pages (localStorage `graph-visited`,
  same key as quartz) render between muted and primary; the local graph
  records each page view.
- **Radial gravity** on the global variant keeps disconnected clusters from
  drifting offscreen.
- **Controls overlay** (idea from starlight-site-graph's action bar):
  zoom-to-fit and fullscreen on both variants, hover-revealed.

**Local graph** — `components/local-graph.tsx` renders the current page's
neighborhood under the table of contents (`tableOfContent.footer` slot on
`DocsPage`). The server passes the full access-filtered graph; the client
slices it with `localGraph()` (`lib/graph-utils.ts`, quartz's
sentinel-BFS depth walk), so the 1/2/3 depth selector re-slices without a
round-trip. Orphan pages render nothing. Neighbor adjacency is precomputed
server-side in `buildGraph` (`enrichNeighbors`) instead of the old per-mount
O(nodes × links) client scan.

Theme colors are resolved from fumadocs tokens once per mount and re-resolved
on light/dark flips via a MutationObserver on `<html class>`; canvas colors
are pre-parsed to rgb so per-frame alpha math is string formatting, not CSS
parsing.
