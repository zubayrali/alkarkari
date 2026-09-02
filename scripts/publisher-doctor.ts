import fs from "node:fs/promises";
import path from "node:path";
import { createAffineBridgeMcpClient } from "../lib/affine/bridge-mcp-client.ts";
import { assessPublisherHealth, type PublisherHealthInput } from "../lib/affine/publisher-health.ts";
import type { AffineDiagnostic, AffineSnapshotManifest } from "../lib/affine/types.ts";

const root = process.cwd();
const locale = process.env.AFFINE_LOCALE?.trim() || "en";
const outputRoot = path.resolve(root, process.env.AFFINE_OUTPUT_ROOT?.trim() || path.join("affine", locale));
const bridgeUrl = process.env.AFFINE_BRIDGE_MCP_URL?.trim() || "http://127.0.0.1:3333/mcp";
const runtimeDir = path.join(root, ".affine-publisher");

async function readJson<T>(filePath: string): Promise<T | undefined> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw new Error(`Could not read ${path.relative(root, filePath)}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function positiveSeconds(value: string | undefined): number | undefined {
  if (!value?.trim()) return undefined;
  const seconds = Number(value);
  if (!Number.isInteger(seconds) || seconds < 60) {
    throw new Error("PUBLISHER_MAX_SNAPSHOT_AGE_SECONDS must be an integer of at least 60.");
  }
  return seconds;
}

async function bridgeStatus(workspaceId: string): Promise<PublisherHealthInput["bridge"]> {
  try {
    const token = (await fs.readFile(path.join(runtimeDir, "bridge.token"), "utf8")).trim();
    if (!token) return { tokenAvailable: false, reachable: false };
    const client = createAffineBridgeMcpClient({ endpoint: bridgeUrl, token });
    const documents = await client.listDocuments(workspaceId);
    return { tokenAvailable: true, reachable: true, documentCount: documents.filter((document) => !document.inTrash).length };
  } catch (error) {
    const missing = (error as NodeJS.ErrnoException).code === "ENOENT";
    return {
      tokenAvailable: !missing,
      reachable: false,
      error: missing
        ? "The local bridge token is missing. Start pnpm publisher:watch first."
        : `Could not reach the local AFFINE bridge: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function main() {
  const manifest = await readJson<AffineSnapshotManifest>(path.join(outputRoot, "manifest.json"));
  const diagnostics = await readJson<AffineDiagnostic[]>(path.join(outputRoot, "diagnostics.json"));
  const workspaceId = process.env.AFFINE_WORKSPACE_ID?.trim();
  const report = assessPublisherHealth({
    config: { workspaceId, bridgeUrl, blobCookie: process.env.AFFINE_BLOB_COOKIE },
    snapshot: manifest,
    diagnostics,
    bridge: workspaceId ? await bridgeStatus(workspaceId) : undefined,
    maxSnapshotAgeSeconds: positiveSeconds(process.env.PUBLISHER_MAX_SNAPSHOT_AGE_SECONDS),
  });

  for (const check of report.checks) {
    const output = `[${check.level.toUpperCase()}] ${check.code}: ${check.message}`;
    (check.level === "error" ? console.error : console.log)(output);
  }
  if (!report.ready) process.exitCode = 1;
}

void main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
