import fs from "node:fs/promises";
import path from "node:path";
import { createAffineBridgeMcpClient } from "../lib/affine/bridge-mcp-client.ts";
import { officialMedia } from "../lib/knowledge-hub.ts";

const root = process.cwd();
const propertyDefinitions = [
  ["Content Type", "text"], ["YouTube ID", "text"], ["Source URL", "text"],
  ["Series", "text"], ["Topics", "text"], ["Audience", "text"],
  ["Transcript Status", "text"], ["Review Status", "text"], ["Rights", "text"],
] as const;

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function slugify(value: string) {
  return value.toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72);
}

async function token() {
  const configured = process.env.AFFINE_BRIDGE_MCP_TOKEN?.trim();
  if (configured) return configured.replace(/^Bearer\s+/i, "");
  return (await fs.readFile(path.join(root, ".affine-publisher", "bridge.token"), "utf8")).trim();
}

async function main() {
  const workspaceId = required("AFFINE_WORKSPACE_ID");
  const client = createAffineBridgeMcpClient({ endpoint: required("AFFINE_BRIDGE_MCP_URL"), token: await token() });
  const documents = (await client.listDocuments(workspaceId)).filter((document) => !document.inTrash);
  if (!documents[0]) throw new Error("AFFiNE workspace has no documents.");
  const first = await client.callTool("list_doc_properties", { workspaceId, docId: documents[0].id }) as { definitions?: Array<{ name: string }> };
  const definitions = new Set((first.definitions ?? []).map((item) => item.name));
  for (const [name, type] of propertyDefinitions) {
    if (!definitions.has(name)) await client.callTool("create_custom_property", { workspaceId, name, type });
  }

  const byYouTubeId = new Map<string, string>();
  for (const document of documents) {
    const properties = await client.readDocumentProperties(workspaceId, document.id);
    const id = typeof properties["YouTube ID"] === "string" ? properties["YouTube ID"].trim() : "";
    if (id) byYouTubeId.set(id, document.id);
  }

  let created = 0;
  let existing = 0;
  for (const item of officialMedia) {
    let docId = byYouTubeId.get(item.id);
    if (!docId) {
      const sourceUrl = `https://www.youtube.com/watch?v=${item.id}`;
      const result = await client.callTool("create_doc_from_markdown", {
        workspaceId,
        title: item.title,
        markdown: `# ${item.title}\n\n[Watch the official video on YouTube](${sourceUrl})\n\n## Editorial summary\n\n_To be written after review._\n\n## Transcript\n\n_Transcript not yet imported. Prefer official captions; otherwise label machine transcription and review it before publishing._\n\n## Key ideas\n\n_To be extracted with timestamps._\n\n## Sources and related teachings\n\n_To be linked during editorial review._`,
      }) as { docId: string };
      docId = result.docId;
      created += 1;
    } else {
      existing += 1;
    }
    const slug = `media/${slugify(item.title)}`;
    const values: Array<[string, string | boolean]> = [
      ["Title", item.title], ["Slug", slug], ["Locale", "en"], ["Translation Key", slug],
      ["Description", `Official ${item.series} video; transcript awaiting editorial review.`],
      ["Publish", false], ["Draft", true], ["Content Type", "Video"], ["YouTube ID", item.id],
      ["Source URL", `https://www.youtube.com/watch?v=${item.id}`], ["Series", item.series],
      ["Topics", item.topics.join(", ")], ["Audience", "Public"], ["Transcript Status", "None"],
      ["Review Status", "Needs Review"], ["Rights", "Embed Only"],
    ];
    for (const [property, value] of values) await client.callTool("set_doc_property", { workspaceId, docId, property, value });
    for (const tag of ["media:official", "review:transcript", `series:${slugify(item.series)}`, ...item.topics.map((topic) => `topic:${topic}`)]) {
      await client.callTool("add_tag_to_doc", { workspaceId, docId, tag });
    }
  }

  const listed = await client.callTool("list_collections", { workspaceId }) as { items?: Array<{ id: string; name: string }> };
  const collectionName = "Media · Transcript review queue";
  let collection = (listed.items ?? []).find((item) => item.name === collectionName);
  if (!collection) collection = await client.callTool("create_collection", { workspaceId, name: collectionName }) as { id: string; name: string };
  await client.callTool("update_collection_rules", {
    workspaceId,
    collectionId: collection.id,
    rules: { match: "all", filters: [{ field: "tag", operator: "equals", value: "review:transcript" }] },
  });
  console.log(`Seeded official media drafts. Created: ${created}; already present: ${existing}; review collection ready.`);
}

void main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
