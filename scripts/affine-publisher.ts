import { spawn } from "node:child_process";
import fs from "node:fs/promises";
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

type DevSession = { pid: number; port: number; locale: string };

async function readDevSession(): Promise<DevSession | undefined> {
  const sessionPath = path.resolve(process.cwd(), ".affine-dev-session.json");
  try {
    const session = JSON.parse(await fs.readFile(sessionPath, "utf8")) as DevSession;
    if (!Number.isSafeInteger(session.pid) || session.pid <= 0 || !session.locale) return;
    process.kill(session.pid, 0);
    return session;
  } catch {
    return;
  }
}

async function refreshDevelopmentSite(): Promise<boolean> {
  const session = await readDevSession();
  if (!session) return false;

  await fs.writeFile(
    path.resolve(process.cwd(), ".dev-locale-request"),
    `${session.locale}\n`,
    "utf8",
  );
  process.kill(session.pid, "SIGUSR2");
  console.log(`[publisher] Refreshing active language "${session.locale}" on port ${session.port}.`);
  return true;
}

async function main() {
  const workspaceId = requiredEnv("AFFINE_WORKSPACE_ID");
  const pollSeconds = positiveSeconds(process.env.PUBLISHER_POLL_SECONDS);
  const statePath = path.resolve(process.cwd(), process.env.PUBLISHER_STATE_PATH ?? ".affine-publisher-state.json");
  const runtimePath = path.resolve(process.cwd(), process.env.PUBLISHER_RUNTIME_PATH ?? ".affine-publisher-runtime.json");
  const writeRuntime = async (value: Record<string, unknown>) => {
    const temporary = `${runtimePath}.${process.pid}.tmp`;
    await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
    await fs.rename(temporary, runtimePath);
  };
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
    refresh: async () => {
      const startedAt = new Date().toISOString();
      await writeRuntime({ state: "syncing", startedAt });
      try {
        await runNode("scripts/generate-affine-all.ts");
        const developmentActive = await refreshDevelopmentSite();
        if (!developmentActive) {
          await runNode("scripts/stage.ts");
        }
        if (process.env.PUBLISHER_RELEASE_ON_CHANGE === "1" && !developmentActive) {
          await runNode("scripts/publisher-release.ts");
        } else if (process.env.PUBLISHER_RELEASE_ON_CHANGE === "1") {
          console.log("[publisher] Static release deferred while the development site is running.");
        }
        await writeRuntime({ state: "idle", startedAt, completedAt: new Date().toISOString() });
      } catch (error) {
        await writeRuntime({
          state: "failed",
          startedAt,
          failedAt: new Date().toISOString(),
          message: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
  });
  await writeRuntime({ state: "idle", completedAt: new Date().toISOString() });
  await poller.start();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
