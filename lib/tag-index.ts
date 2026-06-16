import { getTagPrefixes } from "./tags";

/**
 * Build a tag → items index, expanding hierarchical tags so an item tagged
 * `a/b` is listed under both `a` and `a/b`. Keys are sorted lexicographically.
 *
 * Generic over the item shape so it works for both `NoteRecord[]`
 * (generation) and Fumadocs source pages (graph, /tags index).
 */
export function buildTagIndex<T>(
  items: T[],
  getTags: (item: T) => string[] | undefined,
): Map<string, T[]> {
  const index = new Map<string, T[]>();

  for (const item of items) {
    const seen = new Set<string>();
    for (const tag of getTags(item) ?? []) {
      for (const prefix of getTagPrefixes(tag)) {
        if (seen.has(prefix)) continue;
        seen.add(prefix);
        const list = index.get(prefix);
        if (list) list.push(item);
        else index.set(prefix, [item]);
      }
    }
  }

  return new Map([...index.entries()].sort(([a], [b]) => a.localeCompare(b)));
}
