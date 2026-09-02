import yaml from "js-yaml";
import type {
  AffineDiagnostic,
  AffineDocumentSource,
  AffineFrontmatterValue,
  AffinePublicationMetadata,
  AffinePublicationPage,
} from "./types";

const INTERNAL_DOCUMENT_LINK =
  /\]\(\/?workspace\/[^/)]+\/([A-Za-z0-9_-]+)(?::[^)]*)?\)/g;
const BLOB_IMAGE = /<img\b[^>]*\bsrc=["']blob:\/\/([^"']+)["'][^>]*\/?\s*>/gi;
const AFFINE_SPAN = /<\/?span\b[^>]*>/gi;
const AFFINE_EMPTY_SPAN = /<span\b[^>]*>\s*<\/span>/gi;

function parseFrontmatter(markdown: string): {
  data: Record<string, unknown>;
  content: string;
  hasFrontmatter: boolean;
} {
  const normalized = markdown.replace(/^\uFEFF?[\t ]*(?:\r?\n)*/, "");
  const standard = normalized.match(
    /^---[\t ]*\r?\n([\s\S]*?)\r?\n---[\t ]*(?:\r?\n|$)/,
  );
  const fenced = normalized.match(
    /^```(?:yaml|yml)(?:[\t ]+affine-publication)?[\t ]*\r?\n([\s\S]*?)\r?\n```[\t ]*(?:\r?\n|$)/i,
  );
  const richText = normalized.match(
    /^---[\t ]*\r?\n(?:[\t ]*\r?\n)*[\t ]*##[\t ]+([^\r\n]+)\r?\n((?:[\t ]+[^\r\n]*(?:\r?\n|$))*)/,
  );
  const raw = standard
    ? standard[1]
    : fenced
      ? fenced[1]
      : richText
      ? [
          richText[1],
          ...(richText[2] ?? "")
            .split(/\r?\n/)
            .filter(Boolean)
            .map((line) => line.replace(/^[\t ]+/, "")),
        ].join("\n")
      : undefined;
  const match = standard ?? fenced ?? richText;
  if (!match || raw === undefined) {
    return { data: {}, content: normalized, hasFrontmatter: false };
  }
  const parsed = yaml.load(raw);
  const data =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  return {
    data,
    content: normalized.slice(match[0].length),
    hasFrontmatter: true,
  };
}

function asStringArray(value: unknown): string[] | undefined {
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }
  return undefined;
}

function normalizeMetadata(
  raw: Record<string, unknown>,
): AffinePublicationMetadata {
  const metadata: AffinePublicationMetadata = {};
  for (const [key, value] of Object.entries(raw)) {
    if (
      value === null ||
      typeof value === "boolean" ||
      typeof value === "number" ||
      typeof value === "string"
    ) {
      metadata[key] = value as AffineFrontmatterValue;
    } else if (Array.isArray(value)) {
      metadata[key] = value.map(String);
    } else if (value instanceof Date) {
      metadata[key] = value.toISOString();
    }
  }

  metadata.tags = asStringArray(raw.tags);
  metadata.aliases = asStringArray(raw.aliases);
  metadata.publish = raw.publish === true || raw.publish === "true";
  metadata.draft = raw.draft === true || raw.draft === "true";
  metadata.unlisted = raw.unlisted === true || raw.unlisted === "true";
  metadata.featured = raw.featured === true || raw.featured === "true";
  if (typeof raw.order === "string" && raw.order.trim()) {
    const order = Number(raw.order);
    if (Number.isFinite(order)) metadata.order = order;
  }
  return metadata;
}

export function findLinkedDocumentIds(markdown: string): string[] {
  const ids = new Set<string>();
  for (const match of markdown.matchAll(INTERNAL_DOCUMENT_LINK)) {
    if (match[1]) ids.add(match[1]);
  }
  return [...ids];
}

export function slugifyAffineTitle(title: string): string {
  const slug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "untitled";
}

function normalizeSlug(value: string): string {
  return value
    .split("/")
    .map((part) => slugifyAffineTitle(part))
    .filter(Boolean)
    .join("/");
}

export function sanitizeAffineMarkdown(
  markdown: string,
  docId: string,
): { markdown: string; diagnostics: AffineDiagnostic[] } {
  const diagnostics: AffineDiagnostic[] = [];
  let output = markdown.replace(AFFINE_EMPTY_SPAN, "").replace(AFFINE_SPAN, "");

  output = output.replace(BLOB_IMAGE, (_match, blobId: string) => {
    diagnostics.push({
      level: "warning",
      code: "AFFINE_BLOB_UNAVAILABLE",
      docId,
      message: `Attachment ${blobId} is referenced through AFFiNE's blob scheme, but the read-only MCP does not expose blob bytes.`,
    });
    return `\n\n> [!WARNING]\n> An AFFiNE attachment could not be included in this snapshot.\n`;
  });

  return { markdown: output.trim(), diagnostics };
}

export function parseAffinePublicationPage(
  source: AffineDocumentSource,
  defaultLocale: string,
): { page: AffinePublicationPage; diagnostics: AffineDiagnostic[] } {
  const parsed = parseFrontmatter(source.markdown);
  const metadata = normalizeMetadata(parsed.data);
  const { markdown, diagnostics } = sanitizeAffineMarkdown(
    parsed.content,
    source.id,
  );
  const firstHeading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const title = metadata.title?.trim() || firstHeading || `AFFiNE ${source.id}`;
  const locale = metadata.locale?.trim() || defaultLocale;
  const slug = normalizeSlug(metadata.slug?.trim() || title);

  if (!metadata.title && !firstHeading) {
    diagnostics.push({
      level: "warning",
      code: "AFFINE_TITLE_FALLBACK",
      docId: source.id,
      message: "No title metadata or H1 was found; the AFFiNE document ID is used as the title.",
    });
  }

  return {
    page: {
      id: source.id,
      title,
      slug,
      locale,
      markdown,
      metadata,
      linkedDocumentIds: findLinkedDocumentIds(source.markdown),
    },
    diagnostics,
  };
}

export function rewriteAffineDocumentLinks(
  markdown: string,
  pagesById: ReadonlyMap<string, AffinePublicationPage>,
  diagnostics: AffineDiagnostic[],
  docId: string,
): string {
  return markdown.replace(
    /\[([^\]]*)\]\(\/?workspace\/[^/)]+\/([A-Za-z0-9_-]+)(?::[^)]*)?\)/g,
    (original, label: string, linkedId: string) => {
      const page = pagesById.get(linkedId);
      if (!page) {
        diagnostics.push({
          level: "warning",
          code: "AFFINE_UNPUBLISHED_LINK",
          docId,
          message: `Link to AFFiNE document ${linkedId} was left unchanged because it is not part of the published snapshot.`,
        });
        return original;
      }
      return `[${label || page.title}](/${page.slug})`;
    },
  );
}

function publicationLookupKeys(page: AffinePublicationPage): string[] {
  const sourcePath =
    typeof page.metadata.sourcePath === "string"
      ? page.metadata.sourcePath.replace(/\.md$/i, "")
      : undefined;
  const basename = sourcePath?.split("/").at(-1);
  return [
    sourcePath,
    basename,
    page.slug,
    page.title,
    ...(page.metadata.aliases ?? []),
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => value.trim().toLocaleLowerCase());
}

export function rewriteObsidianWikiLinks(
  markdown: string,
  pages: readonly AffinePublicationPage[],
  diagnostics: AffineDiagnostic[],
  docId: string,
): string {
  const candidates = new Map<string, AffinePublicationPage[]>();
  for (const page of pages) {
    for (const key of publicationLookupKeys(page)) {
      const matches = candidates.get(key) ?? [];
      if (!matches.some((candidate) => candidate.id === page.id)) matches.push(page);
      candidates.set(key, matches);
    }
  }

  return markdown.replace(
    /(!?)\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g,
    (original, embed: string, rawTarget: string, heading: string, label: string) => {
      const target = rawTarget.trim().replace(/\.md$/i, "").toLocaleLowerCase();
      const matches = candidates.get(target) ?? [];
      if (matches.length !== 1) return original;
      const page = matches[0]!;
      if (embed) {
        diagnostics.push({
          level: "warning",
          code: "AFFINE_TRANSCLUSION_FLATTENED",
          docId,
          message: `Embedded note ${rawTarget} was converted to a link because AFFiNE MCP does not expose transclusion semantics.`,
        });
      }
      const anchor = heading ? `#${slugifyAffineTitle(heading)}` : "";
      return `[${label?.trim() || page.title}](/${page.slug}${anchor})`;
    },
  );
}
