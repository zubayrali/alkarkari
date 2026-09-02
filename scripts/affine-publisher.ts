import { spawn } from "node:child_process";
import path from "node:path";
import { createSnapshotPoller } from "@affine-fumadocs/publisher/poller";
import { createAffineBridgeMcpClient } from "../lib/affine/bridge-mcp-client.ts";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function positiveSeconds(value: string | undefined): number {
  const seconds = Number(value ?? "45");
  if (!Number.isInteger(seconds) || seconds < 15) {
    throw new Error("PUBLISHER_POLL_SECONDS must be an integer of at least 15 seconds.");
  }
  return seconds;
}

function runNode(script: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`${script} exited with ${code}`)));
  });
}

async function main() {
  const workspaceId = requiredEnv("AFFINE_WORKSPACE_ID");
  const pollSeconds = positiveSeconds(process.env.PUBLISHER_POLL_SECONDS);
  const statePath = path.resolve(process.cwd(), process.env.PUBLISHER_STATE_PATH ?? ".affine-publisher-state.json");
  const source = process.env.PUBLISHER_SOURCE ?? "bridge";
  if (source !== "official" && source !== "bridge") {
    throw new Error('PUBLISHER_SOURCE must be either "official" or "bridge".');
  }
  if (source === "official") {
    throw new Error(
      "The official workspace MCP is rate-limited to individual document reads and cannot support continuous publishing for this 114-note corpus. Configure PUBLISHER_SOURCE=bridge instead.",
    );
  }
  const bridgeClient = source === "bridge"
      ? createAffineBridgeMcpClient({
        endpoint: requiredEnv("AFFINE_BRIDGE_MCP_URL"),
        token: process.env.AFFINE_BRIDGE_MCP_TOKEN?.trim(),
      })
    : undefined;
  const poller = createSnapshotPoller({
    client: bridgeClient!, workspaceId, statePath, pollSeconds,
    refresh: async () => { await runNode("scripts/generate-affine.ts"); await runNode("scripts/stage.ts"); },
  });
  await poller.start();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
