import { docsRoute } from "./shared.ts";

export type PageTagsInput = string | string[] | undefined;

/** Normalize a single Obsidian tag: trim whitespace, strip leading `#`. */
export function normalizeTag(tag: string): string {
  return tag.trim().replace(/^#+/, "");
}

/** Normalize Obsidian-style tags (string or list) into a display-ready array. */
export function normalizeTags(tags: PageTagsInput): string[] | undefined {
  if (tags === undefined) return undefined;

  const list = typeof tags === "string" ? [tags] : tags;
  const normalized = list.map(normalizeTag).filter(Boolean);

  return normalized.length > 0 ? normalized : undefined;
}

/** Normalize an unknown frontmatter value into a tag list (generation-side). */
export function normalizeRecordTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((tag) => normalizeTag(String(tag))).filter(Boolean);
  }
  if (typeof raw === "string") {
    const tag = normalizeTag(raw);
    return tag ? [tag] : [];
  }
  return [];
}

/** All hierarchical prefixes of a tag: `"a/b/c"` → `["a", "a/b", "a/b/c"]`. */
export function getTagPrefixes(tag: string): string[] {
  const segments = tag.split("/").filter(Boolean);
  return segments.map((_, i) => segments.slice(0, i + 1).join("/"));
}

/** Site URL for a tag page. */
export function tagUrl(tag: string): string {
  const encoded = tag.split("/").filter(Boolean).map(encodeURIComponent).join("/");
  const prefix = docsRoute === "/" ? "" : docsRoute;
  return `${prefix}/tags/${encoded}`;
}
