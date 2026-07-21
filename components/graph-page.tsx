import type { CSSProperties } from "react";
import { GraphView } from "@/components/graph-view";
import { buildGraph } from "@/lib/build-graph";
import { getSiteLanguage } from "@/lib/locale";
import { patchOf } from "@/lib/patch";

export async function GraphPageContent() {
  const graph = buildGraph();
  const siteLanguage = getSiteLanguage();

  const tagCount = graph.nodes.filter((node) => node.kind === 'tag').length;
  const pageCount = graph.nodes.length - tagCount;
  // Node colours are assigned by section via patchOf — legend swatches use
  // the same --graph-node-color-N vars the canvas resolves at runtime.
  const sections = [...new Set(graph.nodes.map((node) => node.group))]
    .filter((section): section is string => Boolean(section))
    .sort();

  return (
    <div className="flex flex-col gap-3">
      <div className="not-prose graph-legend flex flex-wrap items-center justify-between gap-2 text-fd-muted-foreground">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {sections.map((section) => (
            <span key={section} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="kk-swatch"
                style={{ '--kk-swatch-color': `var(--graph-node-color-${patchOf(section)})` } as CSSProperties}
              />
              {section}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="kk-swatch"
              style={{ '--kk-swatch-color': 'var(--graph-tag-color)' } as CSSProperties}
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
      <GraphView graph={graph} className="h-[min(75vh,52rem)]" />
    </div>
  );
}
