import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { createAffineBridgeMcpClient } from "../lib/affine/bridge-mcp-client.ts";
import {
  normalizePublicationSlug,
  translationKeyFor,
  type AffineLocalesConfig,
} from "../lib/affine/multilingual.ts";

type PropertyType = "text" | "number" | "checkbox" | "date";

const root = process.cwd();
const propertyDefinitions: Array<{ name: string; type: PropertyType }> = [
  { name: "Title", type: "text" },
  { name: "Slug", type: "text" },
  { name: "Locale", type: "text" },
  { name: "Translation Key", type: "text" },
  { name: "Description", type: "text" },
  { name: "Publish", type: "checkbox" },
  { name: "Draft", type: "checkbox" },
  { name: "Featured", type: "checkbox" },
  { name: "Aliases", type: "text" },
  { name: "Created", type: "date" },
  { name: "Modified", type: "date" },
  { name: "Arabic", type: "text" },
];

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

async function bridgeToken(): Promise<string | undefined> {
  const configured = process.env.AFFINE_BRIDGE_MCP_TOKEN?.trim();
  if (configured) return configured.replace(/^Bearer\s+/i, "");
  try {
    return (await fs.readFile(path.join(root, ".affine-publisher", "bridge.token"), "utf8")).trim();
  } catch {
    return undefined;
  }
}

function parseFrontmatter(markdown: string) {
  const match = markdown.match(/^\uFEFF?---[\t ]*\r?\n([\s\S]*?)\r?\n---[\t ]*(?:\r?\n|$)/);
  const parsed = match?.[1] ? yaml.load(match[1]) : undefined;
  return {
    metadata: parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {},
    body: match ? markdown.slice(match[0].length).trim() : markdown.trim(),
  };
}

function slugPart(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-").replace(/^-+|-+$/g, "") || "untitled";
}

function sourceSlug(relativePath: string): string {
  const parts = relativePath.replace(/\.md$/i, "").split("/").map(slugPart);
  if (parts.at(-1) === "index") parts.pop();
  return normalizePublicationSlug(parts.join("/"));
}

function valueText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function valueBoolean(value: unknown): boolean {
  return value === true || value === "true";
}

function titleFor(metadata: Record<string, unknown>, body: string, relativePath: string): string {
  return valueText(metadata.title)
    ?? body.match(/^#\s+(.+)$/m)?.[1]?.trim()
    ?? path.basename(relativePath, path.extname(relativePath));
}

function dateOnly(value: unknown): string | undefined {
  const text = valueText(value);
  if (!text) return undefined;
  const date = new Date(text);
  return Number.isNaN(date.valueOf()) ? undefined : date.toISOString().slice(0, 10);
}

async function markdownFiles(directory: string, relative = ""): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await fs.readdir(path.join(directory, relative), { withFileTypes: true })) {
    if (entry.name === ".obsidian" || entry.name === ".git" || entry.name === ".DS_Store") continue;
    const child = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...await markdownFiles(directory, child));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) files.push(child);
  }
  return files.sort();
}

async function main() {
  const workspaceId = required("AFFINE_WORKSPACE_ID");
  const endpoint = required("AFFINE_BRIDGE_MCP_URL");
  const configPath = path.resolve(root, process.env.AFFINE_LOCALES_CONFIG?.trim() || "affine/locales.config.json");
  const config = JSON.parse(await fs.readFile(configPath, "utf8")) as AffineLocalesConfig;
  const client = createAffineBridgeMcpClient({ endpoint, token: await bridgeToken() });
  const documents = (await client.listDocuments(workspaceId)).filter((document) => !document.inTrash);
  if (documents.length === 0) throw new Error("The AFFiNE workspace contains no documents.");

  const firstProperties = await client.callTool("list_doc_properties", { workspaceId, docId: documents[0]!.id }) as {
    definitions?: Array<{ name?: string }>;
  };
  const definitionNames = new Set((firstProperties.definitions ?? []).flatMap((item) => item.name ? [item.name] : []));
  for (const definition of propertyDefinitions) {
    if (!definitionNames.has(definition.name)) {
      await client.callTool("create_custom_property", { workspaceId, ...definition });
    }
  }

  const localeByCode = new Map(config.locales.map((locale) => [locale.code, locale]));
  const byLocaleSlug = new Map<string, string>();
  let tagged = 0;
  let translationKeysAdded = 0;
  for (const document of documents) {
    const properties = await client.readDocumentProperties(workspaceId, document.id);
    const localeCode = valueText(properties.Locale);
    const slug = valueText(properties.Slug);
    const locale = localeCode ? localeByCode.get(localeCode) : undefined;
    if (!locale || !slug) continue;
    byLocaleSlug.set(`${locale.code}:${normalizePublicationSlug(slug)}`, document.id);
    if (!valueText(properties["Translation Key"])) {
      await client.callTool("set_doc_property", {
        workspaceId,
        docId: document.id,
        property: "Translation Key",
        value: translationKeyFor(config, locale.code, slug),
      });
      translationKeysAdded += 1;
    }
    await client.callTool("add_tag_to_doc", { workspaceId, docId: document.id, tag: locale.tag });
    tagged += 1;
  }

  let imported = 0;
  let alreadyPresent = 0;
  for (const locale of config.locales.filter((entry) => entry.import !== false)) {
    const sourceRoot = locale.sourceEnv ? process.env[locale.sourceEnv]?.trim() : undefined;
    if (!sourceRoot) {
      console.warn(`[locales] Skipping ${locale.code} import: ${locale.sourceEnv ?? "sourceEnv"} is not configured.`);
      continue;
    }
    const documentMap: Record<string, string> = {};
    for (const relativePath of await markdownFiles(sourceRoot)) {
      const markdown = await fs.readFile(path.join(sourceRoot, relativePath), "utf8");
      const { metadata, body } = parseFrontmatter(markdown);
      const slug = sourceSlug(relativePath);
      const existingId = byLocaleSlug.get(`${locale.code}:${slug}`);
      let docId = existingId;
      if (!docId) {
        const created = await client.callTool("create_doc_from_markdown", {
          workspaceId,
          title: titleFor(metadata, body, relativePath),
          markdown: body || " ",
        }) as { docId: string };
        docId = created.docId;
        byLocaleSlug.set(`${locale.code}:${slug}`, docId);
        imported += 1;
      } else {
        alreadyPresent += 1;
      }
      documentMap[relativePath] = docId;

      const draft = valueBoolean(metadata.draft);
      const values: Array<[string, string | boolean | undefined]> = [
        ["Title", titleFor(metadata, body, relativePath)],
        ["Slug", slug],
        ["Locale", locale.code],
        ["Translation Key", translationKeyFor(config, locale.code, slug)],
        ["Description", valueText(metadata.description)],
        ["Publish", !draft],
        ["Draft", draft],
        ["Featured", valueBoolean(metadata.featured)],
        ["Aliases", Array.isArray(metadata.aliases) ? metadata.aliases.map(String).join(", ") : valueText(metadata.aliases)],
        ["Created", dateOnly(metadata.created)],
        ["Modified", dateOnly(metadata.modified)],
        ["Arabic", valueText(metadata.arabic)],
      ];
      for (const [property, value] of values) {
        if (value !== undefined) {
          await client.callTool("set_doc_property", { workspaceId, docId, property, value });
        }
      }
      await client.callTool("add_tag_to_doc", { workspaceId, docId, tag: locale.tag });
      for (const tag of Array.isArray(metadata.tags) ? metadata.tags.map(String) : []) {
        await client.callTool("add_tag_to_doc", { workspaceId, docId, tag });
      }
    }
    await fs.writeFile(
      path.join(root, "affine", `import-map.${locale.code}.json`),
      `${JSON.stringify({ documents: documentMap }, null, 2)}\n`,
    );
  }

  const listed = await client.callTool("list_collections", { workspaceId }) as {
    items?: Array<{ id: string; name: string }>;
  };
  for (const locale of config.locales) {
    let collection = (listed.items ?? []).find((item) => item.name === locale.collection);
    if (!collection) {
      collection = await client.callTool("create_collection", {
        workspaceId,
        name: locale.collection,
      }) as { id: string; name: string };
    }
    await client.callTool("update_collection_rules", {
      workspaceId,
      collectionId: collection.id,
      rules: { match: "all", filters: [{ field: "tag", operator: "equals", value: locale.tag }] },
    });
  }

  console.log(
    `Synchronized AFFiNE locales. Imported: ${imported}; already present: ${alreadyPresent}; `
    + `tagged existing: ${tagged}; translation keys added: ${translationKeysAdded}; `
    + `collections: ${config.locales.length}.`,
  );
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
