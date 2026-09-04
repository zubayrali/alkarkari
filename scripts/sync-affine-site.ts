import fs from "node:fs/promises";
import path from "node:path";
import { createAffineBridgeMcpClient } from "../lib/affine/bridge-mcp-client.ts";
import type { AffineLocalesConfig } from "../lib/affine/multilingual.ts";
import {
  HOMEPAGE_SITE_ROLE,
  serializeHomepageSettings,
  SITE_ROLE_PROPERTY,
} from "../lib/affine/site-content.ts";
import type { SiteStrings } from "../lib/site-strings.ts";

const root = process.cwd();
const HOMEPAGE_TAG = "site:homepage";
const HOMEPAGE_COLLECTION = "Site · Homepage";

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

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

async function readFallback(locale: string): Promise<SiteStrings> {
  const localePath = path.join(root, "content-site", `${locale}.json`);
  try {
    return JSON.parse(await fs.readFile(localePath, "utf8")) as SiteStrings;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return JSON.parse(await fs.readFile(path.join(root, "content-site", "en.json"), "utf8")) as SiteStrings;
  }
}

async function main() {
  const workspaceId = required("AFFINE_WORKSPACE_ID");
  const endpoint = required("AFFINE_BRIDGE_MCP_URL");
  const configPath = path.resolve(
    root,
    process.env.AFFINE_LOCALES_CONFIG?.trim() || "affine/locales.config.json",
  );
  const config = JSON.parse(await fs.readFile(configPath, "utf8")) as AffineLocalesConfig;
  const client = createAffineBridgeMcpClient({ endpoint, token: await bridgeToken() });
  const documents = (await client.listDocuments(workspaceId)).filter((document) => !document.inTrash);
  if (documents.length === 0) throw new Error("The AFFiNE workspace contains no documents.");

  const existing = new Map<string, string>();
  for (const document of documents) {
    const properties = await client.readDocumentProperties(workspaceId, document.id);
    const role = text(properties[SITE_ROLE_PROPERTY])
      ?.toLocaleLowerCase()
      .replace(/[ _]+/g, "-");
    if (role !== HOMEPAGE_SITE_ROLE) continue;
    const locale = text(properties.Locale);
    if (locale) existing.set(locale, document.id);
  }

  const overwrite = process.argv.includes("--overwrite");
  let created = 0;
  let updated = 0;
  let preserved = 0;
  for (const locale of config.locales) {
    const fallback = await readFallback(locale.code);
    const markdown = serializeHomepageSettings(fallback);
    let docId = existing.get(locale.code);

    if (!docId) {
      const result = await client.callTool("create_doc_from_markdown", {
        workspaceId,
        title: `Homepage · ${locale.label}`,
        markdown,
        strict: false,
      }) as { docId: string };
      docId = result.docId;
      created += 1;
    } else if (overwrite) {
      await client.callTool("replace_doc_with_markdown", {
        workspaceId,
        docId,
        markdown,
        strict: false,
      });
      updated += 1;
    } else {
      preserved += 1;
    }

    const values: Array<[string, string | boolean]> = [
      ["Title", `Homepage · ${locale.label}`],
      ["Slug", "_site/homepage"],
      ["Locale", locale.code],
      ["Translation Key", "site/homepage"],
      ["Description", `Homepage content for ${locale.label}`],
      ["Publish", true],
      ["Draft", false],
      [SITE_ROLE_PROPERTY, "Site Homepage"],
    ];
    for (const [property, value] of values) {
      await client.callTool("set_doc_property", { workspaceId, docId, property, value });
    }
    await client.callTool("add_tag_to_doc", { workspaceId, docId, tag: locale.tag });
    await client.callTool("add_tag_to_doc", { workspaceId, docId, tag: HOMEPAGE_TAG });
  }

  const listed = await client.callTool("list_collections", { workspaceId }) as {
    items?: Array<{ id: string; name: string }>;
  };
  let collection = (listed.items ?? []).find((item) => item.name === HOMEPAGE_COLLECTION);
  if (!collection) {
    collection = await client.callTool("create_collection", {
      workspaceId,
      name: HOMEPAGE_COLLECTION,
    }) as { id: string; name: string };
  }
  await client.callTool("update_collection_rules", {
    workspaceId,
    collectionId: collection.id,
    rules: { match: "all", filters: [{ field: "tag", operator: "equals", value: HOMEPAGE_TAG }] },
  });

  console.log(
    `Synchronized AFFiNE homepage content. Created: ${created}; reset: ${updated}; preserved: ${preserved}; collection: ${HOMEPAGE_COLLECTION}.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
