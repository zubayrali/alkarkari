import { resolveReference, source } from './source';

export interface BacklinkEntry {
  url: string;
  title: string;
  description?: string;
}

type Page = ReturnType<typeof source.getPages>[number];

export function getBacklinks(target: Page): BacklinkEntry[] {
  const backlinks: BacklinkEntry[] = [];

  for (const page of source.getPages()) {
    if (page.url === target.url) continue;
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
