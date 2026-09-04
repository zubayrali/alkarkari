import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import {
  materializeAffineBlobAssets,
  replaceDirectoryAtomically,
} from "@affine-fumadocs/publisher/snapshot";
import { createAffineMcpClient } from "../lib/affine/mcp-client.ts";
import { createAffineBridgeMcpClient } from "../lib/affine/bridge-mcp-client.ts";
import type { AffineBridgeMcpClient } from "../lib/affine/bridge-mcp-client.ts";
import {
  parseAffinePublicationPage,
  rewriteAffineDocumentLinks,
  rewriteObsidianWikiLinks,
} from "../lib/affine/publication.ts";
import type {
  AffineDiagnostic,
  AffinePublicationPage,
  AffineSnapshotManifest,
} from "../lib/affine/types.ts";
import { resolveGenerateLocale } from "./locales.ts";
import { transformSidenoteSyntax } from "../lib/remark-sidenote-syntax.ts";
import { metadataFromAllAffineProperties } from "../lib/affine/properties.ts";
import { affineCanvasToCanvasData } from "../lib/affine/canvas-adapter.ts";
import type { AffineEdgelessCanvas } from "../lib/affine/canvas-types.ts";
import type { CanvasData } from "../lib/canvas-types.ts";
import {
  findAffineDatabaseBlockIds,
  replaceAffineDatabaseMarkers,
} from "../lib/affine/database-publisher.ts";
import type { AffineDatabaseSnapshot } from "../lib/affine/database-types.ts";
import {
  buildPublishingStudio,
  parsePublishingStudioConfig,
  type AffineCollectionSnapshot,
  type AffineWorkspaceDocumentSnapshot,
} from "../lib/affine/publishing-studio.ts";
import type { AffineLocalesConfig } from "../lib/affine/multilingual.ts";
import {
  compileAffineSiteContent,
  HOMEPAGE_SITE_ROLE,
  isSiteControlPage,
  siteRole,
} from "../lib/affine/site-content.ts";
import type { SiteStrings } from "../lib/site-strings.ts";

const DEFAULT_DISCOVERY_LIMIT = 500;

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function bridgeToken(): Promise<string> {
  const configured = process.env.AFFINE_BRIDGE_MCP_TOKEN?.trim();
  if (configured) return configured.replace(/^Bearer\s+/i, "");

  // The managed publisher creates a private, stable token for its loopback
  // bridge. Reuse it for manual snapshot commands so users never need to copy
  // that generated secret into .env.publisher.
  const tokenPath = path.resolve(
    process.cwd(),
    process.env.AFFINE_BRIDGE_MCP_TOKEN_PATH?.trim() ||
      path.join(".affine-publisher", "bridge.token"),
  );
  try {
    const token = (await fs.readFile(tokenPath, "utf8")).trim();
    if (token) return token;
  } catch {
    // Fall through to the actionable error below.
  }
  throw new Error(
    "AFFINE_BRIDGE_MCP_TOKEN is required when the managed bridge token is unavailable",
  );
}

function commaSeparated(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

async function readSiteFallback(locale: string): Promise<SiteStrings> {
  const localePath = path.join(process.cwd(), "content-site", `${locale}.json`);
  try {
    return await readJson<SiteStrings>(localePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return readJson<SiteStrings>(path.join(process.cwd(), "content-site", "en.json"));
  }
}

function normalizeCollections(value: unknown): AffineCollectionSnapshot[] {
  const items = Array.isArray(value)
    ? value
    : value && typeof value === "object" && Array.isArray((value as { items?: unknown }).items)
      ? (value as { items: unknown[] }).items
      : [];
  return items.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const entry = item as Record<string, unknown>;
    if (typeof entry.id !== "string" || typeof entry.name !== "string") return [];
    return [{
      id: entry.id,
      name: entry.name,
      allowList: Array.isArray(entry.allowList) ? entry.allowList.filter((id): id is string => typeof id === "string") : [],
      rules: entry.rules,
    }];
  });
}

function inferWorkspaceId(endpoint: string): string {
  const match = endpoint.match(/\/api\/workspaces\/([^/]+)\/mcp(?:\?|$)/);
  if (!match?.[1]) {
    throw new Error(
      "AFFINE_WORKSPACE_ID is required when it cannot be inferred from AFFINE_MCP_URL",
    );
  }
  return match[1];
}

function safeRelativeSlug(slug: string): string {
  const normalized = path.posix.normalize(slug).replace(/^\/+/, "");
  if (!normalized || normalized === "." || normalized.startsWith("../")) {
    throw new Error(`Unsafe AFFiNE publication slug: ${slug}`);
  }
  return normalized;
}

function pageOutputPath(
  page: AffinePublicationPage,
  allSlugs: ReadonlySet<string>,
): string {
  const slug = safeRelativeSlug(page.slug);
  const hasChildren = [...allSlugs].some((candidate) =>
    candidate.startsWith(`${slug}/`),
  );
  return hasChildren ? `${slug}/index.mdx` : `${slug}.mdx`;
}

function publicFrontmatter(page: AffinePublicationPage): Record<string, unknown> {
  const {
    publish: _publish,
    draft: _draft,
    locale: _locale,
    slug: _slug,
    canvasSrc: _canvasSrc,
    ...metadata
  } = page.metadata;
  return {
    ...metadata,
    title: page.title,
    affineDocId: page.id,
    contentSource: "affine",
  };
}

function serializePage(
  page: AffinePublicationPage,
  markdown: string,
  canvasAssetName?: string,
): string {
  const frontmatter = yaml.dump({
    ...publicFrontmatter(page),
    ...(canvasAssetName
      ? { canvasSrc: `/affine-canvas/${canvasAssetName}` }
      : {}),
  }, {
    lineWidth: 100,
    noRefs: true,
    sortKeys: false,
  });
  return `---\n${frontmatter}---\n\n${markdown.trim()}\n`;
}

function isCanvasPage(page: AffinePublicationPage): boolean {
  const value = page.metadata.Canvas ?? page.metadata.canvas;
  return value === true || value === "true";
}

function canvasAssetName(docId: string): string {
  if (!/^[A-Za-z0-9_-]+$/.test(docId)) {
    throw new Error(`Unsafe AFFiNE canvas document ID: ${docId}`);
  }
  return `${docId}.json`;
}

function safeAssetId(value: string, kind: string): string {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error(`Unsafe AFFiNE ${kind} ID: ${value}`);
  return value;
}

async function materializeAffineDatabases(options: {
  markdown: string;
  workspaceId: string;
  docId: string;
  publicRoot: string;
  client: AffineBridgeMcpClient;
  pagesById: ReadonlyMap<string, AffinePublicationPage>;
}) {
  const blockIds = findAffineDatabaseBlockIds(options.markdown);
  if (blockIds.length === 0) return options.markdown;
  const sources = new Map<string, string>();

  for (const blockId of blockIds) {
    safeAssetId(options.docId, "document");
    safeAssetId(blockId, "database block");
    const snapshot = await readAffineDatabaseSnapshot(options.client, options.workspaceId, options.docId, blockId, options.pagesById);
    const relative = `/affine-database/${options.docId}/${blockId}.json`;
    const destination = path.join(options.publicRoot, relative.replace(/^\//, ""));
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, `${JSON.stringify(snapshot, null, 2)}\n`);
    sources.set(blockId, relative);
  }

  return replaceAffineDatabaseMarkers(options.markdown, sources);
}

async function readAffineDatabaseSnapshot(
  client: AffineBridgeMcpClient,
  workspaceId: string,
  docId: string,
  blockId: string,
  pagesById: ReadonlyMap<string, AffinePublicationPage>,
): Promise<AffineDatabaseSnapshot> {
  const [definition, rowData] = await Promise.all([
    client.callTool("read_database_columns", { workspaceId, docId, databaseBlockId: blockId }),
    client.callTool("read_database_cells", { workspaceId, docId, databaseBlockId: blockId }),
  ]) as [Omit<AffineDatabaseSnapshot, "rows">, Pick<AffineDatabaseSnapshot, "rows">];
  return {
    ...definition,
    rows: (rowData.rows ?? []).map((row) => {
      const slug = row.linkedDocId ? pagesById.get(row.linkedDocId)?.slug : undefined;
      return slug ? { ...row, href: `/${slug}` } : row;
    }),
  };
}

async function hydrateCanvasDatabases(
  canvas: AffineEdgelessCanvas,
  client: AffineBridgeMcpClient,
  workspaceId: string,
  docId: string,
  pagesById: ReadonlyMap<string, AffinePublicationPage>,
) {
  const visit = async (children: import('../lib/affine/canvas-types.ts').AffineCanvasChild[] | undefined): Promise<void> => {
    for (const child of children ?? []) {
      if (child.flavour === 'affine:database' && child.id) {
        child.database = await readAffineDatabaseSnapshot(client, workspaceId, docId, child.id, pagesById);
      }
      await visit(child.children);
    }
  };
  for (const block of canvas.edgelessBlocks ?? []) await visit(block.children);
}

async function materializeCanvasBlobAssets(options: {
  canvas: CanvasData;
  workspaceId: string;
  publicRoot: string;
  assets: Map<string, string>;
  docId: string;
  diagnostics: AffineDiagnostic[];
}): Promise<CanvasData> {
  const materialize = async (src: string) => {
    const rewritten = await materializeAffineBlobAssets({
      markdown: `![canvas asset](${src})`,
      workspaceId: options.workspaceId,
      publicRoot: options.publicRoot,
      assets: options.assets,
      cookie: process.env.AFFINE_BLOB_COOKIE?.trim(),
      blobBaseUrl: process.env.AFFINE_BLOB_BASE_URL,
      onUnavailable: (_blobKey, message) => options.diagnostics.push({
        level: "warning", code: "AFFINE_CANVAS_BLOB_UNAVAILABLE", docId: options.docId, message,
      }),
    });
    return /^!\[canvas asset\]\((.+)\)$/.exec(rewritten)?.[1] ?? "/affine-unavailable-blob.svg";
  };
  const nodes = await Promise.all(options.canvas.nodes.map(async (node) => {
    if (node.type === "file" && node.file.startsWith("affine://blob/")) {
      return { ...node, file: await materialize(node.file) };
    }
    if (node.type !== "text" || !node.content) return node;
    const content = await Promise.all(node.content.map(async (segment) => {
      if (segment.type !== "image" || !segment.src.startsWith("affine://blob/")) return segment;
      return { ...segment, src: await materialize(segment.src) };
    }));
    return { ...node, content };
  }));
  return { ...options.canvas, nodes };
}

function withBridgePublicationMetadata(
  markdown: string,
  metadata: Record<string, unknown> | undefined,
  locale: string,
): string {
  if (!metadata) return markdown;
  const withoutLeadingFrontmatter = markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
  const frontmatter = yaml.dump(
    { locale, publish: true, ...metadata },
    { lineWidth: 100, noRefs: true, sortKeys: false },
  );
  return `---\n${frontmatter}---\n\n${withoutLeadingFrontmatter}`;
}

function normalizeAffineUpdatedAt(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const parsed = /^\d+$/.test(value) ? new Date(Number(value)) : new Date(value);
  return Number.isNaN(parsed.valueOf()) ? undefined : parsed.toISOString();
}

function nativeBridgePublicationMetadata(
  values: Record<string, unknown>,
  fallback: { title?: string; slug?: string; updatedAt?: string } | undefined,
): Record<string, unknown> | undefined {
  const title = fallback?.title;
  const metadata = metadataFromAllAffineProperties(values, title);
  const slug = metadata.slug ?? fallback?.slug;
  if (!title || !slug) return undefined;
  return {
    ...metadata,
    slug,
    modified: metadata.modified ?? normalizeAffineUpdatedAt(fallback?.updatedAt),
  };
}

function normalizeMdxComments(markdown: string): string {
  return markdown.replace(/<!--([\s\S]*?)-->/g, (_comment, body: string) =>
    `{/*${body.replace(/\*\//g, "* /")}*/}`,
  );
}

function buildFolderOrdering(
  pages: AffinePublicationPage[],
  outputPaths: ReadonlyMap<string, string>,
): Map<string, string[]> {
  const folders = new Map<string, Map<string, number>>();
  for (const page of pages) {
    const outputPath = outputPaths.get(page.id)!;
    const parts = outputPath.replace(/\.mdx$/, "").split("/");
    const isIndex = parts.at(-1) === "index";
    if (isIndex) parts.pop();
    const pageItem = isIndex ? "index" : parts.pop()!;
    const folder = parts.join("/");
    const order = page.metadata.order ?? Number.MAX_SAFE_INTEGER;
    const folderItems = folders.get(folder) ?? new Map<string, number>();
    folderItems.set(pageItem, Math.min(folderItems.get(pageItem) ?? order, order));
    folders.set(folder, folderItems);

    const folderParts = folder ? folder.split("/") : [];
    while (folderParts.length > 0) {
      const child = folderParts.at(-1)!;
      folderParts.pop();
      const parent = folderParts.join("/");
      const parentItems = folders.get(parent) ?? new Map<string, number>();
      parentItems.set(child, Math.min(parentItems.get(child) ?? order, order));
      folders.set(parent, parentItems);
    }
  }

  return new Map(
    [...folders].map(([folder, items]) => [
      folder,
      [...items]
        .sort(([nameA, orderA], [nameB, orderB]) =>
          orderA === orderB ? nameA.localeCompare(nameB) : orderA - orderB,
        )
        .map(([name]) => name),
    ]),
  );
}

function displaySegment(segment: string): string {
  return segment
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function serializeFolderIndex(
  folder: string,
  items: string[],
  pageTitlesByRoute: ReadonlyMap<string, string>,
): string {
  const title = displaySegment(folder.split("/").at(-1) ?? folder);
  const links = items
    .map((item) => {
      const route = [folder, item].filter(Boolean).join("/");
      const href = `/${route}`;
      return `- [${pageTitlesByRoute.get(route) ?? displaySegment(item)}](${href})`;
    })
    .join("\n");
  const frontmatter = yaml.dump(
    {
      title,
      description: `Published AFFiNE pages in ${title}.`,
      contentSource: "affine",
      generatedIndex: true,
    },
    { lineWidth: 100, noRefs: true, sortKeys: false },
  );
  return `---\n${frontmatter}---\n\n# ${title}\n\n${links}\n`;
}

async function main() {
  const bridgeEndpoint = process.env.PUBLISHER_SOURCE === "official"
    ? undefined
    : process.env.AFFINE_BRIDGE_MCP_URL?.trim();
  const endpoint = bridgeEndpoint ? undefined : requiredEnv("AFFINE_MCP_URL");
  const token = bridgeEndpoint
    ? await bridgeToken()
    : requiredEnv("AFFINE_MCP_TOKEN").replace(/^Bearer\s+/i, "");
  const locale = process.env.AFFINE_LOCALE?.trim() || resolveGenerateLocale();
  const workspaceId =
    process.env.AFFINE_WORKSPACE_ID?.trim() || inferWorkspaceId(endpoint!);
  const outputRoot = path.resolve(
    process.cwd(),
    process.env.AFFINE_OUTPUT_ROOT?.trim() || path.join("affine", locale),
  );
  const publishingConfig = parsePublishingStudioConfig(await readJson(
    path.resolve(process.cwd(), process.env.AFFINE_PUBLISHING_CONFIG?.trim() || "affine/publishing.config.json"),
  ));
  const localesConfig = await readJson<AffineLocalesConfig>(
    path.resolve(process.cwd(), process.env.AFFINE_LOCALES_CONFIG?.trim() || "affine/locales.config.json"),
  );
  const importMapPath = process.env.AFFINE_DOC_MAP_PATH?.trim();
  const importMap = importMapPath
    ? (JSON.parse(
        await fs.readFile(path.resolve(process.cwd(), importMapPath), "utf8"),
      ) as {
        manifest?: string;
        documents?: Record<string, string>;
      })
    : undefined;
  let previousManifest: AffineSnapshotManifest | undefined;
  if (bridgeEndpoint) {
    try {
      previousManifest = JSON.parse(
        await fs.readFile(path.join(outputRoot, "manifest.json"), "utf8"),
      ) as AffineSnapshotManifest;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  const bridgePublicationMetadata = new Map(
    previousManifest?.pages.map((page) => [page.id, { title: page.title, slug: page.slug }]) ?? [],
  );
  const configuredSeeds = [
    ...commaSeparated(process.env.AFFINE_PUBLISH_DOC_IDS),
    ...commaSeparated(process.env.AFFINE_MANIFEST_DOC_ID),
    ...(importMap?.manifest ? [importMap.manifest] : []),
    ...Object.values(importMap?.documents ?? {}),
  ];
  if (!bridgeEndpoint && configuredSeeds.length === 0) {
    throw new Error(
      "Set AFFINE_MANIFEST_DOC_ID or AFFINE_PUBLISH_DOC_IDS to at least one AFFiNE document ID",
    );
  }

  const discoveryLimit = Number(
    process.env.AFFINE_DISCOVERY_LIMIT || DEFAULT_DISCOVERY_LIMIT,
  );
  if (!Number.isInteger(discoveryLimit) || discoveryLimit < 1) {
    throw new Error("AFFINE_DISCOVERY_LIMIT must be a positive integer");
  }

  const bridgeClient = bridgeEndpoint
    ? createAffineBridgeMcpClient({ endpoint: bridgeEndpoint, token })
    : undefined;
  const client = bridgeClient
    ? undefined
    : createAffineMcpClient({ endpoint: endpoint!, token });
  const diagnostics: AffineDiagnostic[] = [];
  const discovered = new Map<string, AffinePublicationPage>();
  const workspaceDocuments = new Map<string, AffineWorkspaceDocumentSnapshot>();
  const bridgeDocuments = bridgeClient ? await bridgeClient.listDocuments(workspaceId) : undefined;
  const bridgeDocumentMetadata = new Map(
    bridgeDocuments?.map((document) => {
      const previous = bridgePublicationMetadata.get(document.id);
      return [document.id, {
        title: document.title ?? previous?.title,
        slug: previous?.slug,
        updatedAt: document.updatedAt ?? undefined,
      }];
    }) ?? [],
  );
  const queue = [
    ...new Set(
      bridgeDocuments
        ? bridgeDocuments
            .filter((document) => !document.inTrash)
            .map((document) => document.id)
        : configuredSeeds,
    ),
  ];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const docId = queue.shift()!;
    if (visited.has(docId)) continue;
    if (visited.size >= discoveryLimit) {
      diagnostics.push({
        level: "error",
        code: "AFFINE_DISCOVERY_LIMIT",
        message: `Discovery stopped at ${discoveryLimit} documents. Raise AFFINE_DISCOVERY_LIMIT only after checking the manifest graph.`,
      });
      break;
    }
    visited.add(docId);

    try {
      const bridgeProperties = bridgeClient
        ? await bridgeClient.readDocumentProperties(workspaceId, docId)
        : undefined;
      if (bridgeProperties) {
        workspaceDocuments.set(docId, {
          id: docId,
          title: bridgeDocumentMetadata.get(docId)?.title,
          properties: bridgeProperties,
        });
      }
      const bridgeMetadata = bridgeProperties
        ? nativeBridgePublicationMetadata(bridgeProperties, bridgeDocumentMetadata.get(docId))
        : undefined;
      // The bridge can enumerate the whole workspace. Read publication controls
      // first so unpublished scratch documents never incur a Markdown export or
      // block a snapshot because their content happens to resemble malformed YAML.
      if (bridgeClient && bridgeMetadata?.publish !== true) continue;
      const rawMarkdown = bridgeClient
        ? await bridgeClient.readDocument(workspaceId, docId)
        : await client!.readDocument(docId);
      const markdown = bridgeClient
        ? withBridgePublicationMetadata(rawMarkdown, bridgeMetadata, locale)
        : rawMarkdown;
      const result = parseAffinePublicationPage({ id: docId, markdown }, locale);
      diagnostics.push(...result.diagnostics);
      discovered.set(docId, result.page);
      for (const linkedId of result.page.linkedDocumentIds) {
        if (!visited.has(linkedId)) queue.push(linkedId);
      }
    } catch (error) {
      diagnostics.push({
        level: "error",
        code: "AFFINE_READ_FAILED",
        docId,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const generatedAt = new Date().toISOString();
  const publishablePages = [...discovered.values()].filter(
    (page) =>
      page.locale === locale && page.metadata.publish === true && !page.metadata.draft,
  );
  const homepageSettingsPages = publishablePages.filter(
    (page) => siteRole(page) === HOMEPAGE_SITE_ROLE,
  );
  const unsupportedControlPages = publishablePages.filter(
    (page) => isSiteControlPage(page) && siteRole(page) !== HOMEPAGE_SITE_ROLE,
  );
  for (const page of unsupportedControlPages) {
    diagnostics.push({
      level: "warning",
      code: "AFFINE_SITE_ROLE_UNKNOWN",
      docId: page.id,
      message: `Unknown Site Role "${siteRole(page)}"; the control document was not emitted as a reader page.`,
    });
  }
  if (homepageSettingsPages.length > 1) {
    diagnostics.push({
      level: "error",
      code: "AFFINE_HOMEPAGE_SETTINGS_DUPLICATE",
      message: `Locale ${locale} has ${homepageSettingsPages.length} published homepage settings documents; keep exactly one.`,
    });
  }
  const pages = publishablePages.filter((page) => !isSiteControlPage(page));
  const siteContent = compileAffineSiteContent({
    locale,
    generatedAt,
    fallback: await readSiteFallback(locale),
    page: homepageSettingsPages[0],
  });
  diagnostics.push(...siteContent.diagnostics);
  if (pages.length === 0) {
    throw new Error(
      `No publishable AFFiNE pages were found for locale ${locale}. Add "publish: true" frontmatter to a seeded or linked page.`,
    );
  }

  const pagesById = new Map(pages.map((page) => [page.id, page]));
  const slugOwners = new Map<string, string>();
  for (const page of pages) {
    const owner = slugOwners.get(page.slug);
    if (owner) {
      diagnostics.push({
        level: "error",
        code: "AFFINE_DUPLICATE_SLUG",
        docId: page.id,
        message: `Slug ${page.slug} is also used by AFFiNE document ${owner}.`,
      });
    } else {
      slugOwners.set(page.slug, page.id);
    }
  }
  const collections = bridgeClient
    ? normalizeCollections(await bridgeClient.callTool("list_collections", { workspaceId }))
    : [];
  const studio = buildPublishingStudio({
    config: publishingConfig,
    locale,
    generatedAt,
    pages,
    documents: bridgeClient
      ? [...workspaceDocuments.values()]
      : pages.map((page) => ({ id: page.id, title: page.title, properties: page.metadata })),
    collections,
    localeCollections: localesConfig.locales.map((entry) => ({ code: entry.code, collection: entry.collection })),
    diagnostics,
    workspaceId,
    affineBaseUrl: process.env.AFFINE_BASE_URL?.trim(),
  });
  diagnostics.splice(0, diagnostics.length, ...studio.diagnostics);
  if (diagnostics.some((item) => item.level === "error")) {
    // Persist control-plane diagnostics without replacing the last known-good
    // public snapshot. The Studio can report a blocked refresh while readers
    // continue receiving the immutable successful build.
    await fs.mkdir(outputRoot, { recursive: true });
    await Promise.all([
      fs.writeFile(path.join(outputRoot, "studio.json"), `${JSON.stringify(studio.studioSnapshot, null, 2)}\n`),
      fs.writeFile(path.join(outputRoot, "diagnostics.json"), `${JSON.stringify(diagnostics, null, 2)}\n`),
    ]);
    throw new Error(
      `AFFiNE snapshot has blocking diagnostics:\n${diagnostics
        .filter((item) => item.level === "error")
        .map((item) => `- ${item.code}: ${item.message}`)
        .join("\n")}`,
    );
  }

  const canvasSnapshots = new Map<string, CanvasData>();
  for (const page of pages) {
    if (!bridgeClient && !isCanvasPage(page)) continue;
    try {
      const rawCanvas = await (bridgeClient ?? client!).callTool("get_edgeless_canvas", {
        workspaceId,
        docId: page.id,
      }) as AffineEdgelessCanvas;
      if (rawCanvas.exists === false) {
        if (isCanvasPage(page)) {
          throw new Error("document does not expose an edgeless canvas");
        }
        continue;
      }
      if (bridgeClient) await hydrateCanvasDatabases(rawCanvas, bridgeClient, workspaceId, page.id, pagesById);
      const canvas = affineCanvasToCanvasData(rawCanvas);
      if (canvas.nodes.length === 0) {
        if (isCanvasPage(page)) throw new Error("document exposes an empty edgeless canvas");
        continue;
      }
      canvasSnapshots.set(page.id, canvas);
    } catch (error) {
      if (isCanvasPage(page)) {
        throw new Error(
          `Could not publish AFFiNE canvas ${page.title} (${page.id}): ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      diagnostics.push({
        level: "warning",
        code: "AFFINE_CANVAS_UNAVAILABLE",
        docId: page.id,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const allSlugs = new Set(pages.map((page) => page.slug));
  const outputPaths = new Map(
    pages.map((page) => [page.id, pageOutputPath(page, allSlugs)]),
  );
  const pageTitlesByRoute = new Map(
    pages.map((page) => [
      outputPaths.get(page.id)!.replace(/\.mdx$/, "").replace(/\/index$/, ""),
      page.title,
    ]),
  );
  const folderOrdering = buildFolderOrdering(pages, outputPaths);
  const manifest: AffineSnapshotManifest = {
    generatedAt,
    source: "affine-mcp",
    workspaceId,
    locale,
    pages: pages
      .map((page) => ({
        id: page.id,
        title: page.title,
        slug: page.slug,
        translationKey: typeof page.metadata["Translation Key"] === "string"
          ? page.metadata["Translation Key"]
          : undefined,
        modified: page.metadata.modified,
        description: page.metadata.description,
        featured: page.metadata.featured,
        order: page.metadata.order,
        tags: page.metadata.tags,
      }))
      .sort((a, b) => a.slug.localeCompare(b.slug)),
  };

  await replaceDirectoryAtomically(outputRoot, async (temporary) => {
    const contentRoot = path.join(temporary, "content");
    const publicRoot = path.join(temporary, "public");
    await fs.mkdir(contentRoot, { recursive: true });
    await fs.mkdir(publicRoot, { recursive: true });
    await fs.writeFile(
      path.join(publicRoot, "affine-unavailable-blob.svg"),
      '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" role="img" aria-label="AFFiNE attachment unavailable"><rect width="100%" height="100%" fill="#f3f4f6"/><path d="M410 195h140a26 26 0 0 1 26 26v98a26 26 0 0 1-26 26H410a26 26 0 0 1-26-26v-98a26 26 0 0 1 26-26Z" fill="none" stroke="#9ca3af" stroke-width="10"/><path d="m405 330 48-49 36 35 26-26 55 40" fill="none" stroke="#9ca3af" stroke-width="10"/><text x="480" y="410" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#6b7280">AFFiNE attachment unavailable in publisher export</text></svg>\n',
    );
    const blobAssets = new Map<string, string>();

    for (const page of pages) {
      const outputPath = outputPaths.get(page.id)!;
      const destination = path.join(contentRoot, outputPath);
      const affineLinksRewritten = rewriteAffineDocumentLinks(
        page.markdown,
        pagesById,
        diagnostics,
        page.id,
      );
      const linksRewritten = rewriteObsidianWikiLinks(
        affineLinksRewritten,
        pages,
        diagnostics,
        page.id,
      );
      const blobUrlsRewritten = bridgeClient
        ? await materializeAffineBlobAssets({
          markdown: linksRewritten,
          workspaceId,
          publicRoot,
          assets: blobAssets,
          cookie: process.env.AFFINE_BLOB_COOKIE?.trim(),
          blobBaseUrl: process.env.AFFINE_BLOB_BASE_URL,
          onUnavailable: (_blobKey, message) => diagnostics.push({
            level: "warning", code: "AFFINE_BLOB_UNAVAILABLE", docId: page.id, message,
          }),
        })
        : linksRewritten;
      const databasesRewritten = bridgeClient && !isCanvasPage(page)
        ? await materializeAffineDatabases({
          markdown: blobUrlsRewritten,
          workspaceId,
          docId: page.id,
          publicRoot,
          client: bridgeClient,
          pagesById,
        })
        : blobUrlsRewritten;
      const rewritten = transformSidenoteSyntax(normalizeMdxComments(databasesRewritten));
      if (/affine:\/\/blob\//.test(linksRewritten) && !process.env.AFFINE_BLOB_COOKIE?.trim()) {
        diagnostics.push({
          level: "warning",
          code: "AFFINE_BLOB_SESSION_REQUIRED",
          docId: page.id,
          message: "A native AFFiNE blob is served by the authenticated AFFiNE origin.",
        });
      }
      await fs.mkdir(path.dirname(destination), { recursive: true });
      const rawCanvas = canvasSnapshots.get(page.id);
      const canvas = rawCanvas && bridgeClient
        ? await materializeCanvasBlobAssets({
          canvas: rawCanvas, workspaceId, publicRoot, assets: blobAssets,
          docId: page.id, diagnostics,
        })
        : rawCanvas;
      if (canvas) {
        const assetName = canvasAssetName(page.id);
        const canvasDestination = path.join(publicRoot, "affine-canvas", assetName);
        await fs.mkdir(path.dirname(canvasDestination), { recursive: true });
        await fs.writeFile(canvasDestination, `${JSON.stringify(canvas, null, 2)}\n`);
        await fs.writeFile(destination, serializePage(page, rewritten, assetName));
      } else {
        await fs.writeFile(destination, serializePage(page, rewritten));
      }
    }

    const occupiedPaths = new Set(outputPaths.values());
    for (const [folder, items] of folderOrdering) {
      if (!folder || occupiedPaths.has(`${folder}/index.mdx`)) continue;
      const destination = path.join(contentRoot, folder, "index.mdx");
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.writeFile(destination, serializeFolderIndex(folder, items, pageTitlesByRoute));
    }

    for (const [folder, items] of folderOrdering) {
      const destination = path.join(contentRoot, folder, "meta.json");
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.writeFile(destination, `${JSON.stringify({ pages: items }, null, 2)}\n`);
    }

    await fs.writeFile(
      path.join(temporary, "manifest.json"),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );
    await fs.writeFile(
      path.join(temporary, "site.json"),
      `${JSON.stringify(siteContent.snapshot, null, 2)}\n`,
    );
    await fs.writeFile(
      path.join(temporary, "diagnostics.json"),
      `${JSON.stringify(diagnostics, null, 2)}\n`,
    );
    studio.studioSnapshot.diagnostics = diagnostics;
    studio.studioSnapshot.summary.errors = diagnostics.filter((item) => item.level === "error").length;
    studio.studioSnapshot.summary.warnings = diagnostics.filter((item) => item.level === "warning").length;
    await fs.writeFile(
      path.join(temporary, "studio.json"),
      `${JSON.stringify(studio.studioSnapshot, null, 2)}\n`,
    );
    await fs.writeFile(
      path.join(publicRoot, "affine-publishing.json"),
      `${JSON.stringify(studio.publicSnapshot, null, 2)}\n`,
    );
    await fs.writeFile(
      path.join(publicRoot, "affine-site.json"),
      `${JSON.stringify(siteContent.snapshot, null, 2)}\n`,
    );
  });

  const warnings = diagnostics.filter((item) => item.level === "warning");
  console.log(
    `Generated ${pages.length} AFFiNE page${pages.length === 1 ? "" : "s"} for ${locale} at ${path.relative(process.cwd(), outputRoot)}`,
  );
  if (warnings.length > 0) {
    console.warn(
      `${warnings.length} warning${warnings.length === 1 ? "" : "s"} written to ${path.relative(process.cwd(), path.join(outputRoot, "diagnostics.json"))}`,
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
