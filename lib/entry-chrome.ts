export type EntryChromeKind =
  | "entry"
  | "tags-index"
  | "tag-page"
  | "specialized";

export interface EntryChromeInput {
  slugs: string[];
  data: Record<string, unknown>;
}

export interface EntryChromeLabels {
  sectionFallback: string;
  sectionTagsIndex: string;
  sectionTag: string;
  untitled: string;
}

const DEFAULT_LABELS: EntryChromeLabels = {
  sectionFallback: "Knowledge entry",
  sectionTagsIndex: "Index of subjects",
  sectionTag: "Tag",
  untitled: "Untitled",
};

export interface EntryChromeModel {
  kind: EntryChromeKind;
  sectionLabel: string;
  title: string;
  description?: string;
  arabic?: string;
  aliases: string[];
  tags: string[];
  promotedPropertyKeys: ReadonlySet<string>;
}

function cleanString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const clean = value.trim();
  return clean.length > 0 ? clean : undefined;
}

function cleanStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const clean = cleanString(item);
    return clean ? [clean] : [];
  });
}

function titleCaseSlug(slug: string | undefined, fallback: string): string {
  if (!slug) return fallback;
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function pageKind({ slugs, data }: EntryChromeInput): EntryChromeKind {
  if (slugs.length === 1 && slugs[0] === "tags") return "tags-index";
  if (data.tagPage === true) return "tag-page";
  if (data.base === true || data.full === true) return "specialized";
  return "entry";
}

function sectionLabel(
  kind: EntryChromeKind,
  slugs: string[],
  labels: EntryChromeLabels,
): string {
  if (kind === "tags-index") return labels.sectionTagsIndex;
  if (kind === "tag-page") return labels.sectionTag;
  return titleCaseSlug(slugs[0], labels.sectionFallback);
}

/**
 * The reader shell's single metadata seam. Callers pass loader data once and
 * receive only the fields the visual chrome is allowed to know about.
 */
export function buildEntryChrome(
  input: EntryChromeInput,
  labels: EntryChromeLabels = DEFAULT_LABELS,
): EntryChromeModel {
  const kind = pageKind(input);
  const arabic = kind === "specialized" ? undefined : cleanString(input.data.arabic);
  const aliases = cleanStringList(input.data.aliases);
  const promotedPropertyKeys = new Set<string>();
  if (arabic) promotedPropertyKeys.add("arabic");
  if (aliases.length > 0 && kind !== "specialized") {
    promotedPropertyKeys.add("aliases");
  }

  return {
    kind,
    sectionLabel: sectionLabel(kind, input.slugs, labels),
    title: cleanString(input.data.title) ?? labels.untitled,
    description: cleanString(input.data.description),
    arabic,
    aliases,
    tags: cleanStringList(input.data.tags),
    promotedPropertyKeys,
  };
}

export function usesNightThreshold(kind: EntryChromeKind): boolean {
  return kind !== "specialized";
}
