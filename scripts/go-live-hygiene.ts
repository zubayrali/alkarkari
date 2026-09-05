#!/usr/bin/env node
/**
 * One-shot go-live hygiene via short-lived authoring bridge:
 * - Unpublish the scratch "test" document
 * - Fill missing Description with the document title (recommended property)
 *
 * Run: pnpm exec tsx --env-file=.env.publisher scripts/run-affine-authoring.ts scripts/go-live-hygiene.ts
 */
import fs from "node:fs/promises";
import path from "node:path";
import { createAffineBridgeMcpClient } from "../lib/affine/bridge-mcp-client.ts";
import { metadataFromAllAffineProperties } from "../lib/affine/properties.ts";

const root = process.cwd();
const workspaceId = process.env.AFFINE_WORKSPACE_ID?.trim();
if (!workspaceId) throw new Error("AFFINE_WORKSPACE_ID is required.");

const endpoint = process.env.AFFINE_BRIDGE_MCP_URL?.trim();
if (!endpoint) throw new Error("AFFINE_BRIDGE_MCP_URL is required.");

async function bridgeToken(): Promise<string | undefined> {
  const configured = process.env.AFFINE_BRIDGE_MCP_TOKEN?.trim();
  if (configured) return configured.replace(/^Bearer\s+/i, "");
  try {
    return (await fs.readFile(path.join(root, ".affine-publisher", "bridge.token"), "utf8")).trim();
  } catch {
    return undefined;
  }
}

const client = createAffineBridgeMcpClient({
  endpoint,
  token: await bridgeToken(),
});

const docs = await client.listDocuments(workspaceId);
let unpublished = 0;
let descriptions = 0;

for (const doc of docs) {
  if (doc.inTrash) continue;
  const properties = await client.readDocumentProperties(workspaceId, doc.id);
  const metadata = metadataFromAllAffineProperties(properties, doc.title ?? undefined);
  const title = String(metadata.title ?? doc.title ?? "").trim();
  const slug = typeof metadata.slug === "string" ? metadata.slug : "";

  // Scratch probe page — keep it out of the public site.
  if (doc.id === "edD9PJcaQp" || (title.toLowerCase() === "test" && (slug === "test" || !slug))) {
    if (metadata.publish === true) {
      await client.callTool("set_doc_property", {
        workspaceId,
        docId: doc.id,
        property: "Publish",
        value: false,
      });
      unpublished += 1;
      console.log(`[hygiene] Unpublished ${doc.id} (${title || "untitled"})`);
    }
    continue;
  }

  if (metadata.publish !== true || metadata.draft === true) continue;
  const description = typeof properties.Description === "string"
    ? properties.Description.trim()
    : "";
  if (!description && title) {
    await client.callTool("set_doc_property", {
      workspaceId,
      docId: doc.id,
      property: "Description",
      value: title,
    });
    descriptions += 1;
    console.log(`[hygiene] Description ← title for ${doc.id} (${title})`);
  }
}

console.log(`[hygiene] Done. unpublished=${unpublished} descriptionsFilled=${descriptions}`);
