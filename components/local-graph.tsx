'use client';
import { Waypoints } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { GraphView, recordVisited, type Graph } from './graph-view';
import { localGraph } from '@/lib/graph-utils';

// Obsidian-style local graph: the current page's neighborhood at an
// adjustable depth, shown under the table of contents. Receives the full
// (already access-filtered) graph and re-slices client-side so the depth
// control needs no server round-trip.

export function LocalGraph({
  graph,
  currentUrl,
  label,
  globalGraphLabel,
}: {
  graph: Graph;
  currentUrl: string;
  label: string;
  globalGraphLabel: string;
}) {
  const [depth, setDepth] = useState(1);
  const sliced = useMemo(
    () => localGraph(graph, currentUrl, depth),
    [graph, currentUrl, depth],
  );

  useEffect(() => {
    recordVisited(currentUrl);
  }, [currentUrl]);

  // An orphan page has no neighborhood worth drawing.
  if (sliced.nodes.length <= 1) return null;

  return (
    <div className="flex flex-col gap-3.5 pt-4 pb-6">
      <div className="flex items-center justify-between">
        {/* Mirrors fumadocs' #toc-title heading so both sidebar sections match. */}
        <h3 className="inline-flex items-center gap-1.5 text-sm text-fd-muted-foreground">
          <Waypoints className="size-4" />
          {label}
        </h3>
        <Link
          href="/graph"
          className="text-xs text-fd-muted-foreground underline-offset-2 hover:text-fd-foreground hover:underline"
        >
          {globalGraphLabel}
        </Link>
      </div>
      <GraphView
        graph={sliced}
        variant="local"
        currentUrl={currentUrl}
        className="h-44"
        extraControls={
          <select
            aria-label="Graph depth"
            className="rounded-md border bg-fd-background/80 px-1.5 py-1 text-xs text-fd-muted-foreground backdrop-blur"
            value={depth}
            onChange={(event) => setDepth(Number(event.target.value))}
          >
            {[1, 2, 3].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        }
      />
    </div>
  );
}
