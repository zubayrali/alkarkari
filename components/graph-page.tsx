import { GraphView } from "@/components/graph-view";
import { buildGraph } from "@/lib/build-graph";
import { getSiteLanguage } from "@/lib/locale";

export async function GraphPageContent() {
  const graph = buildGraph();
  const siteLanguage = getSiteLanguage();

  const tagCount = graph.nodes.filter((node) => node.kind === 'tag').length;
  const pageCount = graph.nodes.length - tagCount;

  return (
    <div className="flex flex-col gap-3">
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
      <GraphView graph={graph} className="h-[min(75vh,52rem)]" />
    </div>
  );
}
