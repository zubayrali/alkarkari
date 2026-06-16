import { resolveReference, source } from '@/lib/source';
import { enrichNeighbors } from '@/lib/graph-utils';
import type { Graph } from '../components/graph-view';

import { pageRequiresAuth } from '@/lib/protected';
import { getTagPrefixes, tagUrl } from '@/lib/tags';

export function buildGraph(hasAccess = false): Graph {
  const pages = source.getPages().filter(
    (page) => hasAccess || !pageRequiresAuth(page),
  );
  const graph: Graph = { links: [], nodes: [] };

  const tagPagesByTag = new Map<string, (typeof pages)[number]>();
  for (const page of pages) {
    if (page.data.tagPage && typeof page.data.tag === 'string') {
      tagPagesByTag.set(page.data.tag, page);
    }
  }

  const tagNodeUrl = (tag: string) => tagPagesByTag.get(tag)?.url ?? tagUrl(tag);
  const tagNodes = new Set<string>();
  const ensureTagNode = (tag: string) => {
    if (tagNodes.has(tag)) return;
    tagNodes.add(tag);

    graph.nodes.push({
      id: tagNodeUrl(tag),
      url: tagNodeUrl(tag),
      text: `#${tag}`,
      description: tagPagesByTag.get(tag)?.data.description,
      kind: 'tag',
    });

    // Chain child → parent tag nodes (a/b → a).
    const prefixes = getTagPrefixes(tag);
    const parent = prefixes[prefixes.length - 2];
    if (parent) {
      ensureTagNode(parent);
      graph.links.push({ source: tagNodeUrl(tag), target: tagNodeUrl(parent) });
    }
  };

  for (const page of pages) {
    // Tag pages become tag nodes below — only for tags actually in use.
    if (page.data.tagPage) continue;

    graph.nodes.push({
      id: page.url,
      url: page.url,
      text: page.data.title,
      description: page.data.description,
      kind: 'page',
    });

    const { extractedReferences = [] } = page.data;
    for (const ref of extractedReferences) {
      const refPage = resolveReference(page, ref.href);
      if (!refPage) continue;
      if (!hasAccess && pageRequiresAuth(refPage)) continue;
      // Wikilinks into /tags pages would dangle when the tag node is absent.
      if (refPage.data.tagPage) continue;

      graph.links.push({
        source: page.url,
        target: refPage.url,
      });
    }

    for (const tag of page.data.tags ?? []) {
      ensureTagNode(tag);
      graph.links.push({ source: page.url, target: tagNodeUrl(tag) });
    }
  }

  return enrichNeighbors(graph);
}
