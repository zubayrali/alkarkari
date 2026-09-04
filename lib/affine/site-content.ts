import type { HomeStrings, SiteStrings } from "../site-strings";
import type { AffineDiagnostic, AffinePublicationPage } from "./types";

export const SITE_ROLE_PROPERTY = "Content Type";
export const HOMEPAGE_SITE_ROLE = "site-homepage";

export interface AffineSiteSnapshot {
  version: 1;
  generatedAt: string;
  source: "affine-mcp";
  locale: string;
  sourceDocId?: string;
  heroTagline: string;
  home: HomeStrings;
}

type EditableSiteContent = Pick<SiteStrings, "heroTagline" | "home">;

function normalizeRole(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLocaleLowerCase().replace(/[ _]+/g, "-");
  return normalized || undefined;
}

export function siteRole(page: AffinePublicationPage): string | undefined {
  const direct = page.metadata[SITE_ROLE_PROPERTY];
  if (direct !== undefined) return normalizeRole(direct);
  const properties = page.metadata.affineProperties;
  if (!properties || typeof properties !== "object" || Array.isArray(properties)) return undefined;
  return normalizeRole(properties[SITE_ROLE_PROPERTY]);
}

export function isSiteControlPage(page: AffinePublicationPage): boolean {
  return siteRole(page)?.startsWith("site-") === true;
}

function flattenStrings(value: unknown, prefix = "", output = new Map<string, string>()): Map<string, string> {
  if (typeof value === "string") {
    output.set(prefix, value);
    return output;
  }
  if (!value || typeof value !== "object") return output;
  for (const [key, child] of Object.entries(value)) {
    flattenStrings(child, prefix ? `${prefix}.${key}` : key, output);
  }
  return output;
}

function tableValue(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("|", "\\|")
    .replace(/\r?\n/g, "<br>");
}

export function serializeHomepageSettings(content: EditableSiteContent): string {
  const editable: EditableSiteContent = {
    heroTagline: content.heroTagline,
    home: content.home,
  };
  const rows = [...flattenStrings(editable)].map(
    ([field, value]) => `| ${field} | ${tableValue(value)} |`,
  );
  return [
    "Edit values in the table below. Field names are the publisher contract; keep them unchanged.",
    "",
    "| Field | Value |",
    "| --- | --- |",
    ...rows,
  ].join("\n");
}

function splitTableRow(line: string): string[] {
  const input = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  const cells: string[] = [];
  let current = "";
  let escaped = false;
  for (const character of input) {
    if (escaped) {
      current += character;
      escaped = false;
    } else if (character === "\\") {
      escaped = true;
    } else if (character === "|") {
      cells.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  if (escaped) current += "\\";
  cells.push(current.trim());
  return cells;
}

function homepageTableValues(markdown: string): Map<string, string> {
  const values = new Map<string, string>();
  for (const line of markdown.split(/\r?\n/)) {
    if (!line.trim().startsWith("|")) continue;
    const [field, rawValue] = splitTableRow(line);
    if (!field || rawValue === undefined || field === "Field" || /^:?-{3,}:?$/.test(field)) continue;
    values.set(field, rawValue.replace(/<br\s*\/?\s*>/gi, "\n"));
  }
  return values;
}

function setKnownString(root: unknown, path: string, value: string): boolean {
  const segments = path.split(".");
  let cursor: unknown = root;
  for (let index = 0; index < segments.length - 1; index += 1) {
    if (!cursor || typeof cursor !== "object") return false;
    const segment = segments[index]!;
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  if (!cursor || typeof cursor !== "object") return false;
  const leaf = segments.at(-1)!;
  if (typeof (cursor as Record<string, unknown>)[leaf] !== "string") return false;
  (cursor as Record<string, unknown>)[leaf] = value;
  return true;
}

export function compileAffineSiteContent(options: {
  locale: string;
  generatedAt: string;
  fallback: SiteStrings;
  page?: AffinePublicationPage;
}): { snapshot: AffineSiteSnapshot; diagnostics: AffineDiagnostic[] } {
  const content: EditableSiteContent = structuredClone({
    heroTagline: options.fallback.heroTagline,
    home: options.fallback.home,
  });
  const diagnostics: AffineDiagnostic[] = [];

  if (!options.page) {
    diagnostics.push({
      level: "warning",
      code: "AFFINE_HOMEPAGE_SETTINGS_MISSING",
      message: `No AFFiNE homepage settings document exists for ${options.locale}; using bundled fallback copy.`,
    });
  } else {
    const expected = flattenStrings(content);
    const supplied = homepageTableValues(options.page.markdown);
    const unknown = [...supplied.keys()].filter((field) => !expected.has(field));
    const missing = [...expected.keys()].filter((field) => !supplied.has(field));

    for (const [field, value] of supplied) setKnownString(content, field, value);

    if (unknown.length > 0) {
      diagnostics.push({
        level: "warning",
        code: "AFFINE_HOMEPAGE_FIELD_UNKNOWN",
        docId: options.page.id,
        message: `${unknown.length} unknown homepage field${unknown.length === 1 ? "" : "s"}: ${unknown.slice(0, 5).join(", ")}.`,
      });
    }
    if (missing.length > 0) {
      diagnostics.push({
        level: "warning",
        code: "AFFINE_HOMEPAGE_FIELD_MISSING",
        docId: options.page.id,
        message: `${missing.length} homepage field${missing.length === 1 ? " is" : "s are"} missing; bundled fallback copy fills the gap.`,
      });
    }
  }

  return {
    snapshot: {
      version: 1,
      generatedAt: options.generatedAt,
      source: "affine-mcp",
      locale: options.locale,
      sourceDocId: options.page?.id,
      ...content,
    },
    diagnostics,
  };
}
