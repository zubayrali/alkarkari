import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { startReadOnlyBridgePublisher } from "@affine-fumadocs/publisher/service";

const root = process.cwd();
const bridgeUrl = process.env.AFFINE_BRIDGE_MCP_URL?.trim() || "http://127.0.0.1:3333/mcp";
const servicePath = [
  path.join(os.homedir(), ".local", "bin"),
  path.join(os.homedir(), ".local", "share", "pnpm"),
  "/opt/homebrew/bin",
  "/usr/local/bin",
  "/usr/bin",
  "/bin",
  process.env.PATH,
].filter(Boolean).join(":");
let stopping = false;
let service: { stop(): void } | undefined;

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required in .env.publisher.`);
  return value;
}

function affineMcpCommand(): string {
  const candidates = [process.env.AFFINE_MCP_BIN?.trim(), "/opt/homebrew/bin/affine-mcp", "/usr/local/bin/affine-mcp", "affine-mcp"]
    .filter((candidate): candidate is string => Boolean(candidate));
  return candidates.find((candidate) => candidate === "affine-mcp" || existsSync(candidate)) ?? "affine-mcp";
}

function stop() { stopping = true; service?.stop(); }

async function main() {
  const cookie = required("AFFINE_BLOB_COOKIE");
  service = await startReadOnlyBridgePublisher({
    cwd: root,
    runtimeDir: path.join(root, ".affine-publisher"),
    bridgeUrl,
    bridgeCommand: affineMcpCommand(),
    publisherCommand: process.execPath,
    publisherArgs: ["scripts/affine-publisher.ts"],
    environment: { ...process.env, PATH: servicePath },
    bridgeEnvironment: {
      AFFINE_BASE_URL: process.env.AFFINE_BASE_URL?.trim() || "http://localhost:3010",
      AFFINE_COOKIE: cookie,
      PATH: servicePath,
    },
    onUnexpectedExit(name, detail) {
      if (stopping) return;
      console.error(`[publisher-service] ${name} exited (${detail}); restarting service.`);
      process.exit(1);
    },
  });
  console.log("[publisher-service] Read-only bridge healthy; publisher started.");
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
void main().catch((error) => { console.error(error instanceof Error ? error.message : error); stop(); process.exit(1); });
