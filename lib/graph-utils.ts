// Pure graph helpers, safe for both server (build-graph) and client
// (local graph depth control) — no source/loader imports here.
import type { Graph } from '../components/graph-view';

/** Precompute neighbors server-side so the client never scans links. */
export function enrichNeighbors(graph: Graph): Graph {
  const neighbors = new Map<string, Set<string>>();
  const add = (a: string, b: string) => {
    const set = neighbors.get(a);
    if (set) set.add(b);
    else neighbors.set(a, new Set([b]));
  };

  for (const link of graph.links) {
    add(link.source as string, link.target as string);
    add(link.target as string, link.source as string);
  }

  for (const node of graph.nodes) {
    const set = neighbors.get(node.id as string);
    node.neighbors = set ? [...set] : [];
  }

  return graph;
}

/**
 * Depth-limited neighborhood around a page, BFS with a per-level sentinel
 * (ported from aarnphm/quartz graph.inline.ts). Runs over an already-built
 * graph so the client can re-slice when the depth control changes.
 */
export function localGraph(graph: Graph, centerId: string, depth: number): Graph {
  const byId = new Map(graph.nodes.map((node) => [node.id as string, node]));
  const neighborhood = new Set<string>();
  const queue: (string | null)[] = [centerId, null];
  let remaining = depth;

  while (remaining >= 0 && queue.length > 0) {
    const current = queue.shift()!;
    if (current === null) {
      remaining--;
      if (queue.length === 0) break;
      queue.push(null);
      continue;
    }
    if (neighborhood.has(current)) continue;
    neighborhood.add(current);

    for (const neighbor of byId.get(current)?.neighbors ?? []) {
      if (!neighborhood.has(neighbor)) queue.push(neighbor);
    }
  }

  return {
    nodes: graph.nodes.filter((node) => neighborhood.has(node.id as string)),
    links: graph.links.filter(
      (link) =>
        neighborhood.has(link.source as string) &&
        neighborhood.has(link.target as string),
    ),
  };
}
