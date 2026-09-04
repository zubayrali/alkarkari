import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { createAffineBridgeMcpClient } from "../lib/affine/bridge-mcp-client.ts";
import { parseAffinePublicationPage } from "../lib/affine/publication.ts";

type PropertyType = "text" | "number" | "checkbox" | "date";

const PROPERTY_DEFINITIONS: Array<{ name: string; legacyName: string; type: PropertyType }> = [
  { name: "Title", legacyName: "Karkari Title", type: "text" },
  { name: "Slug", legacyName: "Karkari Slug", type: "text" },
  { name: "Locale", legacyName: "Karkari Locale", type: "text" },
  { name: "Translation Key", legacyName: "Karkari Translation Key", type: "text" },
  { name: "Description", legacyName: "Karkari Description", type: "text" },
  { name: "Publish", legacyName: "Karkari Publish", type: "checkbox" },
  { name: "Draft", legacyName: "Karkari Draft", type: "checkbox" },
  { name: "Unlisted", legacyName: "Karkari Unlisted", type: "checkbox" },
  { name: "Featured", legacyName: "Karkari Featured", type: "checkbox" },
  { name: "Order", legacyName: "Karkari Order", type: "number" },
  { name: "Aliases", legacyName: "Karkari Aliases", type: "text" },
  { name: "Created", legacyName: "Karkari Created", type: "date" },
  { name: "Modified", legacyName: "Karkari Modified", type: "date" },
];

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Unexpected bridge response.");
  return value as Record<string, unknown>;
}

function dateOnly(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? undefined : date.toISOString().slice(0, 10);
}

function propertyValue(value: unknown): string | number | boolean | undefined {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean"
    ? value
    : undefined;
}

async function sourceTitle(sourcePath: string, locale: string): Promise<string | undefined> {
  const root = path.resolve(
    process.cwd(),
    process.env.AFFINE_METADATA_SOURCE_ROOT?.trim() || path.join("locales", locale, "content"),
  );
  const relative = sourcePath.replace(/\.md$/i, ".mdx");
  const requestedPath = path.join(root, relative);
  let sourceFile = requestedPath;
  try {
    try {
      await fs.access(sourceFile);
    } catch {
      const directory = path.dirname(requestedPath);
      const wanted = path.basename(requestedPath, ".mdx").toLowerCase().replace(/[^a-z0-9]/g, "");
      const candidates = (await fs.readdir(directory)).filter((name) => name.toLowerCase().endsWith(".mdx"));
      const match = candidates.find((name) => {
        const stem = path.basename(name, ".mdx").toLowerCase().replace(/[^a-z0-9]/g, "");
        return stem === wanted || stem.replace(/\d+$/, "") === wanted;
      });
      if (!match) return undefined;
      sourceFile = path.join(directory, match);
    }
    const markdown = await fs.readFile(sourceFile, "utf8");
    const match = markdown.match(/^\uFEFF?---[\t ]*\r?\n([\s\S]*?)\r?\n---[\t ]*(?:\r?\n|$)/);
    if (!match?.[1]) return undefined;
    const metadata = yaml.load(match[1]);
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return undefined;
    const title = (metadata as Record<string, unknown>).title;
    return typeof title === "string" && title.trim() ? title.trim() : undefined;
  } catch {
    return undefined;
  }
}

async function main() {
  const workspaceId = required("AFFINE_WORKSPACE_ID");
  const endpoint = required("AFFINE_BRIDGE_MCP_URL");
  const locale = process.env.AFFINE_LOCALE?.trim() || "en";
  const client = createAffineBridgeMcpClient({ endpoint, token: process.env.AFFINE_BRIDGE_MCP_TOKEN?.trim() });
  const map = JSON.parse(await fs.readFile(path.resolve(process.cwd(), process.env.AFFINE_DOC_MAP_PATH ?? "affine/import-map.en.json"), "utf8")) as { documents: Record<string, string> };
  const sourceByDocument = new Map(
    Object.entries(map.documents).map(([sourcePath, docId]) => [docId, sourcePath]),
  );
  const documents = (await client.listDocuments(workspaceId)).filter((document) => !document.inTrash);
  const first = documents[0]?.id;
  if (!first) throw new Error("The AFFiNE import map contains no documents.");

  const existing = asRecord(await client.callTool("list_doc_properties", { workspaceId, docId: first }));
  const definitions = Array.isArray(existing.definitions) ? existing.definitions : [];
  const definitionNames = new Set(definitions.map((item) => asRecord(item).name).filter((name): name is string => typeof name === "string"));
  for (const definition of PROPERTY_DEFINITIONS) {
    if (!definitionNames.has(definition.name)) {
      await client.callTool("create_custom_property", { workspaceId, name: definition.name, type: definition.type });
    }
  }

  let migrated = 0;
  let titlesAdded = 0;
  let titlesPreserved = 0;
  let titlesMissing = 0;
  for (const document of documents) {
    const docId = document.id;
    const sourcePath = sourceByDocument.get(docId);
    const nativeValues = await client.readDocumentProperties(workspaceId, docId);
    const fromExistingProperty = (...names: string[]) =>
      names.map((name) => propertyValue(nativeValues[name])).find((value) => value !== undefined);
    const existingTitle = fromExistingProperty("Title", "Karkari Title");
    const title = existingTitle ?? (
      sourcePath ? await sourceTitle(sourcePath, locale) : undefined
    ) ?? document.title?.trim();
    if (existingTitle !== undefined) {
      titlesPreserved += 1;
    } else if (title !== undefined) {
      await client.callTool("set_doc_property", { workspaceId, docId, property: "Title", value: title });
      titlesAdded += 1;
    } else {
      titlesMissing += 1;
    }
    if (!sourcePath) {
      migrated += 1;
      continue;
    }
    const raw = await client.readDocument(workspaceId, docId);
    const page = parseAffinePublicationPage({ id: docId, markdown: raw.replace(/^```\s+(yaml|yml)/i, "```$1") }, locale).page;
    const metadata = page.metadata;
    const values: Array<[string, string | number | boolean | undefined]> = [
      ["Slug", fromExistingProperty("Slug", "Karkari Slug") ?? metadata.slug],
      ["Locale", fromExistingProperty("Locale", "Karkari Locale") ?? metadata.locale],
      ["Description", fromExistingProperty("Description", "Karkari Description") ?? metadata.description],
      ["Publish", fromExistingProperty("Publish", "Karkari Publish") ?? metadata.publish],
      ["Draft", fromExistingProperty("Draft", "Karkari Draft") ?? metadata.draft],
      ["Unlisted", fromExistingProperty("Unlisted", "Karkari Unlisted") ?? metadata.unlisted],
      ["Featured", fromExistingProperty("Featured", "Karkari Featured") ?? metadata.featured],
      ["Order", fromExistingProperty("Order", "Karkari Order") ?? metadata.order],
      ["Aliases", fromExistingProperty("Aliases", "Karkari Aliases") ?? metadata.aliases?.join(", ")],
      ["Created", fromExistingProperty("Created", "Karkari Created") ?? dateOnly(metadata.created)],
      ["Modified", fromExistingProperty("Modified", "Karkari Modified") ?? dateOnly(metadata.modified)],
    ];
    for (const [property, value] of values) {
      if (value !== undefined) await client.callTool("set_doc_property", { workspaceId, docId, property, value });
    }
    for (const tag of metadata.tags ?? []) {
      await client.callTool("add_tag_to_doc", { workspaceId, docId, tag });
    }
    migrated += 1;
  }
  if (process.env.AFFINE_DELETE_LEGACY_PROPERTIES === "1") {
    for (const definition of PROPERTY_DEFINITIONS) {
      await client.callTool("delete_custom_property", { workspaceId, property: definition.legacyName });
    }
  }
  console.log(`Migrated clean native AFFiNE metadata for ${migrated} documents. Titles added: ${titlesAdded}; preserved: ${titlesPreserved}; missing: ${titlesMissing}.${process.env.AFFINE_DELETE_LEGACY_PROPERTIES === "1" ? " Removed the legacy Karkari-prefixed properties." : " Legacy Karkari-prefixed properties were retained."}`);
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
