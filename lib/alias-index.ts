import { aliasSlugSegments, slugifyAliasSegment } from './aliases';
import { source } from './source';

let aliasMap: Map<string, string> | undefined;

/** Alias slug path ("dictionary/zikr") → canonical page URL. Real pages win collisions. */
function getAliasMap(): Map<string, string> {
  if (aliasMap) return aliasMap;

  const map = new Map<string, string>();
  for (const page of source.getPages()) {
    const aliases = page.data.aliases;
    if (!aliases) continue;

    for (const alias of aliases) {
      const segments = aliasSlugSegments(alias, page.slugs);
      if (!segments) continue;

      // An alias must never shadow a real page.
      if (source.getPage(segments)) continue;

      const key = segments.join('/');
      if (!map.has(key)) map.set(key, page.url);
    }
  }

  aliasMap = map;
  return map;
}

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/** Look up an unmatched slug as an alias; returns the canonical page URL. */
export function resolveAliasUrl(slug?: string[]): string | undefined {
  if (!slug || slug.length === 0) return undefined;

  const map = getAliasMap();
  const candidates = [
    slug.join('/'),
    slug.map(decodeSegment).join('/'),
    slug.map((segment) => slugifyAliasSegment(decodeSegment(segment))).join('/'),
  ];

  for (const candidate of candidates) {
    const url = map.get(candidate);
    if (url) return url;
  }
  return undefined;
}
