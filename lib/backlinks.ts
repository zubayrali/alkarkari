import { resolveReference, source } from './source';
import { pageRequiresAuth } from './protected';

export interface BacklinkEntry {
  url: string;
  title: string;
  description?: string;
}

type Page = ReturnType<typeof source.getPages>[number];

/**
 * Pages whose body references the target page, inverted from the same
 * `extractedReferences` data the graph view is built on. Protected pages are
 * excluded unless the visitor has unlocked access (mirrors `buildGraph`).
 */
export function getBacklinks(target: Page, hasAccess = false): BacklinkEntry[] {
  const backlinks: BacklinkEntry[] = [];

  for (const page of source.getPages()) {
    if (page.url === target.url) continue;
    if (!hasAccess && pageRequiresAuth(page)) continue;
    // Tag pages list members by query, not by reference; membership is
    // already visible via the page's tag chips.
    if (page.data.tagPage) continue;

    const { extractedReferences = [] } = page.data;
    const refersToTarget = extractedReferences.some(
      (ref) => resolveReference(page, ref.href)?.url === target.url,
    );

    if (refersToTarget) {
      backlinks.push({
        url: page.url,
        title: page.data.title,
        description: page.data.description,
      });
    }
  }

  return backlinks.sort((a, b) => a.title.localeCompare(b.title));
}
