import { z } from "zod";
import type {
  AffineDiagnostic,
  AffineFrontmatterValue,
  AffinePublicationPage,
  AffinePublicPublishingSnapshot,
  AffineStudioSnapshot,
} from "./types";
import { getAffineDocumentUrl } from "./url.ts";

const portalSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  route: z.string().min(1).transform((value) => value.replace(/^\/+|\/+$/g, "")),
  label: z.string().min(1),
  description: z.string().optional(),
  collection: z.string().min(1),
  layout: z.enum(["cards", "library", "list", "media", "timeline"]).default("cards"),
  locales: z.array(z.string().min(1)).optional(),
  slugPrefix: z.string().optional(),
  required: z.boolean().default(false),
  properties: z.array(z.string().min(1)).default([]),
});

export const publishingStudioConfigSchema = z.object({
  version: z.literal(1),
  portals: z.array(portalSchema).default([]),
  editorial: z.object({
    recommendedProperties: z.array(z.string().min(1)).default(["Description", "Translation Key"]),
  }).default({ recommendedProperties: ["Description", "Translation Key"] }),
});

export type AffinePublishingStudioConfig = z.infer<typeof publishingStudioConfigSchema>;

export interface AffineCollectionSnapshot {
  id: string;
  name: string;
  allowList: string[];
  rules?: unknown;
}

export interface AffineWorkspaceDocumentSnapshot {
  id: string;
  title?: string;
  properties: Record<string, unknown>;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function boolean(value: unknown): boolean | undefined {
  if (value === true || value === false) return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  const valueText = text(value);
  return valueText ? valueText.split(",").map((item) => item.trim()).filter(Boolean) : [];
}

function safeValue(value: unknown): AffineFrontmatterValue | undefined {
  if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number") return value;
  if (Array.isArray(value)) {
    const result = value.map(safeValue).filter((item): item is AffineFrontmatterValue => item !== undefined);
    return result;
  }
  return undefined;
}

function pageProperty(page: AffinePublicationPage, name: string): unknown {
  const direct = page.metadata[name];
  if (direct !== undefined) return direct;
  const nested = page.metadata.affineProperties;
  return nested && typeof nested === "object" && !Array.isArray(nested)
    ? nested[name]
    : undefined;
}

function normalizePrefix(value: string | undefined): string | undefined {
  const normalized = value?.replace(/^\/+|\/+$/g, "");
  return normalized || undefined;
}

function matchesPrefix(slug: string, prefix: string | undefined): boolean {
  const normalized = normalizePrefix(prefix);
  return !normalized || slug === normalized || slug.startsWith(`${normalized}/`);
}

function homepagePage(page: AffinePublicationPage) {
  return {
    id: page.id,
    title: page.title,
    href: `/${page.slug}`,
    description: text(page.metadata.description),
    modified: text(page.metadata.modified),
    tags: stringList(page.metadata.tags),
  };
}

function homepageSection(page: AffinePublicationPage): string | undefined {
  return text(pageProperty(page, "Homepage Section"))?.toLocaleLowerCase().replace(/[ _]+/g, "-");
}

export function parsePublishingStudioConfig(value: unknown): AffinePublishingStudioConfig {
  return publishingStudioConfigSchema.parse(value);
}

export function buildPublishingStudio(options: {
  config: AffinePublishingStudioConfig;
  locale: string;
  generatedAt: string;
  pages: AffinePublicationPage[];
  documents: AffineWorkspaceDocumentSnapshot[];
  collections: AffineCollectionSnapshot[];
  localeCollections: Array<{ code: string; collection: string }>;
  diagnostics?: AffineDiagnostic[];
  workspaceId?: string;
  affineBaseUrl?: string;
}): { publicSnapshot: AffinePublicPublishingSnapshot; studioSnapshot: AffineStudioSnapshot; diagnostics: AffineDiagnostic[] } {
  const diagnostics = [...(options.diagnostics ?? [])];
  const collectionByName = new Map(options.collections.map((collection) => [collection.name, collection]));
  const pageById = new Map(options.pages.map((page) => [page.id, page]));
  const languageCollections = options.localeCollections
    .map((entry) => ({ ...entry, value: collectionByName.get(entry.collection) }))
    .filter((entry): entry is typeof entry & { value: AffineCollectionSnapshot } => Boolean(entry.value));

  for (const page of options.pages) {
    const memberships = languageCollections.filter((entry) => entry.value.allowList.includes(page.id));
    if (memberships.length === 0) {
      diagnostics.push({ level: "warning", code: "AFFINE_LANGUAGE_COLLECTION_MISSING", docId: page.id, message: `${page.title} is published but is not in a configured language collection.` });
    } else if (memberships.length > 1) {
      diagnostics.push({ level: "error", code: "AFFINE_LANGUAGE_COLLECTION_MULTIPLE", docId: page.id, message: `${page.title} belongs to multiple language collections: ${memberships.map((item) => item.collection).join(", ")}.` });
    } else if (memberships[0]!.code !== page.locale) {
      diagnostics.push({ level: "error", code: "AFFINE_LOCALE_COLLECTION_MISMATCH", docId: page.id, message: `${page.title} has Locale=${page.locale} but belongs to ${memberships[0]!.collection}.` });
    }
    for (const property of options.config.editorial.recommendedProperties) {
      if (pageProperty(page, property) === undefined || pageProperty(page, property) === "") {
        diagnostics.push({ level: "warning", code: "AFFINE_RECOMMENDED_PROPERTY_MISSING", docId: page.id, message: `${page.title} is missing recommended property ${property}.` });
      }
    }
  }

  const translationOwners = new Map<string, string>();
  for (const page of options.pages) {
    const key = text(pageProperty(page, "Translation Key"));
    if (!key) continue;
    const unique = `${page.locale}:${key}`;
    const owner = translationOwners.get(unique);
    if (owner) diagnostics.push({ level: "error", code: "AFFINE_DUPLICATE_TRANSLATION_LOCALE", docId: page.id, message: `Translation Key ${key} is duplicated for locale ${page.locale} (also ${owner}).` });
    else translationOwners.set(unique, page.id);
  }

  const portals = options.config.portals
    .filter((portal) => !portal.locales || portal.locales.includes(options.locale))
    .map((portal) => {
      const collection = collectionByName.get(portal.collection);
      if (!collection) {
        diagnostics.push({ level: portal.required ? "error" : "warning", code: "AFFINE_PORTAL_COLLECTION_MISSING", message: `Portal ${portal.label} references missing collection ${portal.collection}.` });
      }
      const memberIds = collection?.allowList ?? [];
      const pages = memberIds
        .flatMap((id) => {
          const page = pageById.get(id);
          return page && matchesPrefix(page.slug, portal.slugPrefix) ? [page] : [];
        })
        .map((page) => {
          const properties = Object.fromEntries(portal.properties.flatMap((name) => {
            const value = safeValue(pageProperty(page, name));
            return value === undefined ? [] : [[name, value]];
          }));
          return {
            id: page.id,
            title: page.title,
            slug: page.slug,
            href: `/${page.slug}`,
            description: text(page.metadata.description),
            featured: boolean(page.metadata.featured),
            order: typeof page.metadata.order === "number" ? page.metadata.order : undefined,
            modified: text(page.metadata.modified),
            tags: stringList(page.metadata.tags),
            properties,
          };
        })
        .sort((left, right) => (left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER) || left.title.localeCompare(right.title));
      if (portal.required && pages.length === 0) diagnostics.push({ level: "warning", code: "AFFINE_PORTAL_EMPTY", message: `Required portal ${portal.label} has no published pages for ${options.locale}.` });
      return { id: portal.id, route: portal.route, label: portal.label, description: portal.description, layout: portal.layout, collection: portal.collection, pages };
    });

  const homepageCandidates = options.pages.filter((page) => homepageSection(page) !== "hidden");
  const featured = homepageCandidates
    .filter((page) => boolean(page.metadata.featured) === true || homepageSection(page) === "featured")
    .sort((left, right) => (left.metadata.order ?? Number.MAX_SAFE_INTEGER) - (right.metadata.order ?? Number.MAX_SAFE_INTEGER) || left.title.localeCompare(right.title))
    .slice(0, 4)
    .map(homepagePage);
  const recent = homepageCandidates
    .filter((page) => text(page.metadata.modified))
    .sort((left, right) => text(right.metadata.modified)!.localeCompare(text(left.metadata.modified)!))
    .slice(0, 6)
    .map(homepagePage);
  const keyTerms = homepageCandidates
    .filter((page) => page.slug.startsWith("dictionary/"))
    .sort((left, right) => (left.metadata.order ?? Number.MAX_SAFE_INTEGER) - (right.metadata.order ?? Number.MAX_SAFE_INTEGER) || left.title.localeCompare(right.title))
    .slice(0, 10)
    .map(homepagePage);
  const startHere = homepageCandidates.find((page) => homepageSection(page) === "start-here")
    ?? homepageCandidates.find((page) => page.slug === "start-here");

  const publicSnapshot: AffinePublicPublishingSnapshot = {
    version: 1,
    generatedAt: options.generatedAt,
    source: "affine-mcp",
    locale: options.locale,
    portals,
    homepage: {
      featured,
      recent,
      keyTerms,
      startHere: startHere ? homepagePage(startHere) : undefined,
    },
  };
  const diagnosticsByDocument = new Map<string, AffineDiagnostic[]>();
  for (const diagnostic of diagnostics) {
    if (!diagnostic.docId) continue;
    const items = diagnosticsByDocument.get(diagnostic.docId) ?? [];
    items.push(diagnostic);
    diagnosticsByDocument.set(diagnostic.docId, items);
  }
  const collectionsByDocument = new Map<string, Array<{ id: string; name: string }>>();
  for (const collection of options.collections) {
    for (const documentId of collection.allowList) {
      const memberships = collectionsByDocument.get(documentId) ?? [];
      memberships.push({ id: collection.id, name: collection.name });
      collectionsByDocument.set(documentId, memberships);
    }
  }
  const documents = options.documents.map((document) => {
    const page = pageById.get(document.id);
    const documentDiagnostics = diagnosticsByDocument.get(document.id) ?? [];
    const missing = options.config.editorial.recommendedProperties.filter((property) => {
      const value = page ? pageProperty(page, property) : document.properties[property];
      return value === undefined || value === "";
    });
    const hasErrors = documentDiagnostics.some((item) => item.level === "error");
    const hasWarnings = documentDiagnostics.some((item) => item.level === "warning");
    const isDraft = boolean(document.properties.Draft) === true;
    const isPublished = Boolean(page);
    const status = hasErrors
      ? "blocked"
      : hasWarnings
        ? "warning"
        : isPublished
          ? "published"
          : isDraft
            ? "draft"
            : "private";
    return {
      id: document.id,
      title: page?.title ?? document.title ?? "Untitled document",
      locale: page?.locale ?? options.locale,
      status,
      collections: (collectionsByDocument.get(document.id) ?? [])
        .sort((left, right) => left.name.localeCompare(right.name)),
      slug: page?.slug,
      publishedHref: page ? `/${page.slug}` : undefined,
      affineHref: getAffineDocumentUrl(document.id, {
        workspaceId: options.workspaceId,
        baseUrl: options.affineBaseUrl,
      }),
      diagnostics: documentDiagnostics,
      metadata: {
        complete: options.config.editorial.recommendedProperties.length - missing.length,
        total: options.config.editorial.recommendedProperties.length,
        missing,
      },
    } satisfies AffineStudioSnapshot["documents"][number];
  }).sort((left, right) => left.title.localeCompare(right.title));
  const drafts = options.documents.filter((document) => boolean(document.properties.Draft) === true || boolean(document.properties.Publish) !== true).length;
  const studioSnapshot: AffineStudioSnapshot = {
    version: 1,
    generatedAt: options.generatedAt,
    locale: options.locale,
    summary: {
      workspaceDocuments: options.documents.length,
      publishedPages: options.pages.length,
      drafts,
      errors: diagnostics.filter((item) => item.level === "error").length,
      warnings: diagnostics.filter((item) => item.level === "warning").length,
    },
    collections: options.collections.map((collection) => ({ id: collection.id, name: collection.name, documentCount: collection.allowList.length })).sort((a, b) => a.name.localeCompare(b.name)),
    portals: portals.map((portal) => ({ id: portal.id, label: portal.label, route: portal.route, collection: portal.collection, publishedCount: portal.pages.length, workspaceCount: collectionByName.get(portal.collection)?.allowList.length ?? 0 })),
    documents,
    diagnostics,
  };
  return { publicSnapshot, studioSnapshot, diagnostics };
}
