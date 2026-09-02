import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { metadataFromAffineProperties } from "@affine-fumadocs/publisher";
import {
  materializeAffineBlobAssets,
  replaceDirectoryAtomically,
} from "@affine-fumadocs/publisher/snapshot";
import { createAffineMcpClient } from "../lib/affine/mcp-client.ts";
import { createAffineBridgeMcpClient } from "../lib/affine/bridge-mcp-client.ts";
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

const DEFAULT_DISCOVERY_LIMIT = 500;

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function commaSeparated(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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
    ...metadata
  } = page.metadata;
  return {
    ...metadata,
    title: page.title,
    affineDocId: page.id,
    contentSource: "affine",
  };
}

function serializePage(page: AffinePublicationPage, markdown: string): string {
  const frontmatter = yaml.dump(publicFrontmatter(page), {
    lineWidth: 100,
    noRefs: true,
    sortKeys: false,
  });
  return `---\n${frontmatter}---\n\n${markdown.trim()}\n`;
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

function nativeBridgePublicationMetadata(
  values: Record<string, unknown>,
  fallback: { title: string; slug: string } | undefined,
): Record<string, unknown> | undefined {
  const title = fallback?.title;
  const metadata = metadataFromAffineProperties(values, title);
  const slug = metadata.slug ?? fallback?.slug;
  if (!title || !slug) return undefined;
  return {
    ...metadata,
    slug,
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

function serializeFolderIndex(folder: string, items: string[]): string {
  const title = displaySegment(folder.split("/").at(-1) ?? folder);
  const links = items
    .map((item) => {
      const href = `/${[folder, item].filter(Boolean).join("/")}`;
      return `- [${displaySegment(item)}](${href})`;
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
    ? (process.env.AFFINE_BRIDGE_MCP_TOKEN?.trim() ?? "").replace(/^Bearer\s+/i, "")
    : requiredEnv("AFFINE_MCP_TOKEN").replace(/^Bearer\s+/i, "");
  const locale = process.env.AFFINE_LOCALE?.trim() || resolveGenerateLocale();
  const workspaceId =
    process.env.AFFINE_WORKSPACE_ID?.trim() || inferWorkspaceId(endpoint!);
  const outputRoot = path.resolve(
    process.cwd(),
    process.env.AFFINE_OUTPUT_ROOT?.trim() || path.join("affine", locale),
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
  const previousManifest = bridgeEndpoint
    ? (JSON.parse(await fs.readFile(path.join(outputRoot, "manifest.json"), "utf8")) as AffineSnapshotManifest)
    : undefined;
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
  const bridgeDocuments = bridgeClient ? await bridgeClient.listDocuments(workspaceId) : undefined;
  const queue = [
    ...new Set(
      bridgeDocuments
        ? bridgeDocuments
            .filter((document) => !document.inTrash && bridgePublicationMetadata.has(document.id))
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
      const rawMarkdown = bridgeClient
        ? await bridgeClient.readDocument(workspaceId, docId)
        : await client!.readDocument(docId);
      const bridgeMetadata = bridgeClient
        ? nativeBridgePublicationMetadata(
            await bridgeClient.readDocumentProperties(workspaceId, docId),
            bridgePublicationMetadata.get(docId),
          )
        : undefined;
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

  const pages = [...discovered.values()].filter(
    (page) =>
      page.locale === locale && page.metadata.publish === true && !page.metadata.draft,
  );
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
  if (diagnostics.some((item) => item.level === "error")) {
    throw new Error(
      `AFFiNE snapshot has blocking diagnostics:\n${diagnostics
        .filter((item) => item.level === "error")
        .map((item) => `- ${item.code}: ${item.message}`)
        .join("\n")}`,
    );
  }

  const allSlugs = new Set(pages.map((page) => page.slug));
  const outputPaths = new Map(
    pages.map((page) => [page.id, pageOutputPath(page, allSlugs)]),
  );
  const folderOrdering = buildFolderOrdering(pages, outputPaths);
  const manifest: AffineSnapshotManifest = {
    generatedAt: new Date().toISOString(),
    source: "affine-mcp",
    workspaceId,
    locale,
    pages: pages
      .map((page) => ({
        id: page.id,
        title: page.title,
        slug: page.slug,
        modified: page.metadata.modified,
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
      const rewritten = transformSidenoteSyntax(normalizeMdxComments(blobUrlsRewritten));
      if (/affine:\/\/blob\//.test(linksRewritten) && !process.env.AFFINE_BLOB_COOKIE?.trim()) {
        diagnostics.push({
          level: "warning",
          code: "AFFINE_BLOB_SESSION_REQUIRED",
          docId: page.id,
          message: "A native AFFiNE blob is served by the authenticated AFFiNE origin.",
        });
      }
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.writeFile(destination, serializePage(page, rewritten));
    }

    const occupiedPaths = new Set(outputPaths.values());
    for (const [folder, items] of folderOrdering) {
      if (!folder || occupiedPaths.has(`${folder}/index.mdx`)) continue;
      const destination = path.join(contentRoot, folder, "index.mdx");
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.writeFile(destination, serializeFolderIndex(folder, items));
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
      path.join(temporary, "diagnostics.json"),
      `${JSON.stringify(diagnostics, null, 2)}\n`,
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
