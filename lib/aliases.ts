import GithubSlugger from 'github-slugger';

export type PageAliasesInput = string | string[] | undefined;

/** Frontmatter `aliases` accepts a string or array (Obsidian allows both). */
export function normalizeAliases(aliases: PageAliasesInput): string[] | undefined {
  if (!aliases) return undefined;
  const list = (Array.isArray(aliases) ? aliases : [aliases])
    .map((alias) => alias.trim())
    .filter((alias) => alias.length > 0);
  return list.length > 0 ? list : undefined;
}

const slugger = new GithubSlugger();

export function slugifyAliasSegment(segment: string): string {
  slugger.reset();
  return slugger.slug(segment);
}

/**
 * Resolve an alias to slug segments. Plain names ("Zikr") become siblings of
 * the aliased page; path-style aliases ("/dictionary/zikr", "../zikr") resolve
 * against the page's folder, mirroring aarnphm's alias emitter semantics.
 */
export function aliasSlugSegments(alias: string, pageSlugs: string[]): string[] | undefined {
  const isAbsolute = alias.startsWith('/');
  const parts = alias.split('/').filter((part) => part.length > 0);
  const resolved: string[] = isAbsolute ? [] : pageSlugs.slice(0, -1);

  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') {
      resolved.pop();
      continue;
    }
    resolved.push(slugifyAliasSegment(part));
  }

  return resolved.length > 0 ? resolved : undefined;
}
